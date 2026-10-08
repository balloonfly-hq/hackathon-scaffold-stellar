#![no_std]

mod error;
mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Bytes, Env, BytesN, Vec};

pub use error::Error;
pub use types::{Bet, BetStatus, Pool, Round, RoundStatus};

use storage::{
    get_admin, get_bet, get_current_round_id, get_pool, get_round, has_admin, set_admin, set_bet,
    set_current_round_id, set_pool, set_round, HOUSE_EDGE_BPS,
};

#[contract]
pub struct BalloonFlyContract;

#[contractimpl]
impl BalloonFlyContract {
    /// Initialize the contract with admin address
    pub fn __constructor(env: Env, admin: Address) {
        if has_admin(&env) {
            panic!("Already initialized");
        }
        
        admin.require_auth();
        set_admin(&env, &admin);
        
        // Initialize pool
        let pool = Pool {
            total_bets: 0,
            total_payouts: 0,
            total_house_earnings: 0,
        };
        set_pool(&env, &pool);
    }

    /// Get current admin address
    pub fn admin(env: Env) -> Address {
        get_admin(&env)
    }

    /// Create a new round (admin only)
    /// 
    /// Security: Only admin can create rounds to prevent spam
    /// Ensures only one round is active at a time
    pub fn create_round(
        env: Env,
        round_id: u64,
        server_seed_hash: BytesN<32>,
        betting_window_seconds: u64,
    ) -> Result<Round, Error> {
        let admin = get_admin(&env);
        admin.require_auth();

        // Check if there's already an active round
        if let Some(current_round_id) = get_current_round_id(&env) {
            if let Ok(current_round) = get_round(&env, current_round_id) {
                match current_round.status {
                    RoundStatus::Waiting | RoundStatus::InProgress => {
                        return Err(Error::RoundAlreadyActive);
                    }
                    RoundStatus::Ended => {
                        // OK, can create new round
                    }
                }
            }
        }

        // Prevent round ID reuse (security)
        if env.storage().persistent().has(&round_id) {
            return Err(Error::RoundAlreadyExists);
        }

        let now = env.ledger().timestamp();
        let betting_window_end = now + betting_window_seconds;

        let round = Round {
            id: round_id,
            status: RoundStatus::Waiting,
            server_seed_hash,
            crash_multiplier: 0, // Will be set when round starts
            created_at: now,
            started_at: 0,
            ended_at: 0,
            betting_window_end,
            total_bet_amount: 0,
            total_payout: 0,
            bet_count: 0,
            client_seeds: Vec::new(&env),
        };

        set_round(&env, round_id, &round);
        set_current_round_id(&env, round_id); // Mark as current round
        Ok(round)
    }

    /// Start the round with server seed (admin only)
    /// 
    /// Security: Server seed must match hash, multiplier pre-determined
    pub fn start_round(
        env: Env,
        round_id: u64,
        server_seed: BytesN<32>,
        crash_multiplier: u64,
    ) -> Result<(), Error> {
        let admin = get_admin(&env);
        admin.require_auth();

        let mut round = get_round(&env, round_id)?;

        // Verify round is in waiting state
        if round.status != RoundStatus::Waiting {
            return Err(Error::InvalidRoundStatus);
        }

        // Verify server seed matches hash (CRITICAL SECURITY)
        let server_seed_bytes: Bytes = server_seed.into();
        let calculated_hash = env.crypto().sha256(&server_seed_bytes);
        let calculated_hash_bytes: BytesN<32> = calculated_hash.into();
        if calculated_hash_bytes != round.server_seed_hash {
            return Err(Error::InvalidServerSeedHash);
        }

        // Validate multiplier is reasonable (100 = 1.00x minimum)
        if crash_multiplier < 100 {
            return Err(Error::InvalidMultiplier);
        }

        round.status = RoundStatus::InProgress;
        round.crash_multiplier = crash_multiplier;
        round.started_at = env.ledger().timestamp();

        set_round(&env, round_id, &round);
        Ok(())
    }

    /// Place a bet in the current round
    /// 
    /// Validation & Security:
    /// - Requires player authorization
    /// - Verifies round is in Waiting status
    /// - Validates bet amount within bounds (1 XLM to 1000 XLM)
    /// - Prevents duplicate bets by the same player in this round
    /// - Note: Token transfer is assumed to be handled externally (player balance is not checked on-chain)
    pub fn place_bet(
        env: Env,
        player: Address,
        round_id: u64,
        amount: i128,
        client_seed: BytesN<32>,
    ) -> Result<u64, Error> {
        player.require_auth();

        let mut round = get_round(&env, round_id)?;

        // Only allow bets in Waiting status
        if round.status != RoundStatus::Waiting {
            return Err(Error::InvalidRoundStatus);
        }

        // Validate bet amount (min 1 XLM = 10_000_000 stroops, max 1000 XLM)
        if amount < 10_000_000 || amount > 1_000_000_000_000 {
            return Err(Error::InvalidBetAmount);
        }

        // Check if player already has a bet in this round (prevent double betting)
        let bet_id = generate_bet_id(&env, round_id, &player);
        if env.storage().persistent().has(&bet_id) {
            return Err(Error::BetAlreadyPlaced);
        }

        // Transfer XLM from player to contract
        // Note: In production, use proper token contract
        // For now, we assume payment is handled externally

        // Create bet
        let bet = Bet {
            id: bet_id,
            round_id,
            player: player.clone(),
            amount,
            cash_out_multiplier: 0,
            payout: 0,
            status: BetStatus::Active,
            timestamp: env.ledger().timestamp(),
        };

        set_bet(&env, bet_id, &bet);

        // Update round stats
        round.total_bet_amount += amount;
        round.bet_count += 1;

        // Collect client seeds from first 3 bets (for provably fair)
        if round.client_seeds.len() < 3 {
            round.client_seeds.push_back(client_seed);
        }

        set_round(&env, round_id, &round);

        // Update pool stats
        let mut pool = get_pool(&env);
        pool.total_bets += amount;
        set_pool(&env, &pool);

        Ok(bet_id)
    }

    /// Cash out a bet at current multiplier
    /// 
    /// Validation & Security:
    /// - Requires player authorization
    /// - Verifies bet ownership (`bet.player == player`)
    /// - Verifies bet is currently Active (prevents multiple cash outs)
    /// - Verifies round is currently InProgress
    /// - Derives the multiplier on-chain from elapsed time via the documented curve
    /// - Verifies multiplier has not reached or exceeded crash multiplier
    /// - Validates multiplier is at least 100 (1.00x minimum)
    /// - Rejects a caller-supplied multiplier above the derived value
    /// - Calculates net payout at the derived multiplier deducting 3% house edge
    /// - Note: Payout token transfer is assumed to be handled externally
    pub fn cash_out(
        env: Env,
        player: Address,
        bet_id: u64,
        current_multiplier: u64,
    ) -> Result<i128, Error> {
        player.require_auth();

        let mut bet = get_bet(&env, bet_id)?;

        // Verify ownership
        if bet.player != player {
            return Err(Error::Unauthorized);
        }

        // Verify bet is active
        if bet.status != BetStatus::Active {
            return Err(Error::BetNotActive);
        }

        let round = get_round(&env, bet.round_id)?;

        // Verify round is in progress
        if round.status != RoundStatus::InProgress {
            return Err(Error::InvalidRoundStatus);
        }

        // Derive the multiplier on-chain from the elapsed round time using
        // the documented curve (same curve the frontend simulates):
        //   multiplier(x100) = 100 + t^1.55 * 1.6, t = now - round.started_at
        // This keeps the caller from claiming crash_multiplier - 1 payout
        // one second after start_round.
        let elapsed = env
            .ledger()
            .timestamp()
            .saturating_sub(round.started_at);
        let derived_multiplier = curve_multiplier_x100(elapsed);

        // If the curve has already reached the crash point the round is
        // effectively over regardless of what the caller claims.
        if derived_multiplier >= round.crash_multiplier {
            return Err(Error::AlreadyCrashed);
        }

        // Verify multiplier hasn't crashed yet
        if current_multiplier >= round.crash_multiplier {
            return Err(Error::AlreadyCrashed);
        }

        // Validate multiplier is reasonable (100 = 1.00x minimum)
        if current_multiplier < 100 {
            return Err(Error::InvalidMultiplier);
        }

        // The caller-supplied multiplier must not exceed the on-chain
        // derived value.
        if current_multiplier > derived_multiplier {
            return Err(Error::InvalidMultiplier);
        }

        // Calculate payout with house edge (3%) at the derived multiplier
        // payout = bet_amount * (multiplier / 100) * (1 - 0.03)
        let multiplier_factor = derived_multiplier as i128;
        let gross_payout = (bet.amount * multiplier_factor) / 100;
        let house_fee = (gross_payout * HOUSE_EDGE_BPS as i128) / 10000;
        let net_payout = gross_payout - house_fee;

        // Update bet status
        bet.cash_out_multiplier = derived_multiplier;
        bet.payout = net_payout;
        bet.status = BetStatus::CashedOut;
        set_bet(&env, bet_id, &bet);

        // Update pool stats
        let mut pool = get_pool(&env);
        pool.total_payouts += net_payout;
        pool.total_house_earnings += house_fee;
        set_pool(&env, &pool);

        // Transfer payout to player
        // Note: In production, use proper token contract
        // For now, we assume payment is handled externally

        Ok(net_payout)
    }

    /// Finalize the round (admin only)
    /// 
    /// Validation & Security:
    /// - Requires admin authorization
    /// - Verifies round is currently InProgress
    /// - Transitions round status to Ended with timestamp
    /// - Automatically creates next round with next_server_seed_hash in Waiting status
    /// - Note: Does not mutate uncashed bets in storage (uncashed bets remain un-cashed)
    pub fn finalize_round(
        env: Env,
        round_id: u64,
        next_server_seed_hash: BytesN<32>,
        betting_window_seconds: u64,
    ) -> Result<u64, Error> {
        let admin = get_admin(&env);
        admin.require_auth();

        let mut round = get_round(&env, round_id)?;

        // Verify round is in progress
        if round.status != RoundStatus::InProgress {
            return Err(Error::InvalidRoundStatus);
        }

        round.status = RoundStatus::Ended;
        round.ended_at = env.ledger().timestamp();
        set_round(&env, round_id, &round);

        // Automatically create next round
        let next_round_id = round_id + 1;
        let now = env.ledger().timestamp();
        let betting_window_end = now + betting_window_seconds;

        let next_round = Round {
            id: next_round_id,
            status: RoundStatus::Waiting,
            server_seed_hash: next_server_seed_hash,
            crash_multiplier: 0,
            created_at: now,
            started_at: 0,
            ended_at: 0,
            betting_window_end,
            total_bet_amount: 0,
            total_payout: 0,
            bet_count: 0,
            client_seeds: Vec::new(&env),
        };

        set_round(&env, next_round_id, &next_round);
        set_current_round_id(&env, next_round_id); // Update current round

        Ok(next_round_id)
    }

    /// Get round details
    pub fn get_round(env: Env, round_id: u64) -> Result<Round, Error> {
        get_round(&env, round_id)
    }

    /// Get bet details
    pub fn get_bet(env: Env, bet_id: u64) -> Result<Bet, Error> {
        get_bet(&env, bet_id)
    }

    /// Get pool statistics
    pub fn get_pool(env: Env) -> Pool {
        get_pool(&env)
    }

    /// Get current active round
    pub fn get_current_round(env: Env) -> Result<Round, Error> {
        let current_round_id = get_current_round_id(&env)
            .ok_or(Error::NoActiveRound)?;
        get_round(&env, current_round_id)
    }

    /// Get current round ID
    pub fn get_current_round_id(env: Env) -> Option<u64> {
        get_current_round_id(&env)
    }

    /// Check if current round can be started
    /// Returns true if round is Waiting and betting window has expired
    pub fn can_start_round(env: Env) -> Result<bool, Error> {
        let current_round_id = get_current_round_id(&env)
            .ok_or(Error::NoActiveRound)?;
        let round = get_round(&env, current_round_id)?;
        
        if round.status != RoundStatus::Waiting {
            return Ok(false);
        }
        
        let now = env.ledger().timestamp();
        Ok(now >= round.betting_window_end)
    }
}

/// Generate unique bet ID from round ID and player address
fn generate_bet_id(env: &Env, round_id: u64, player: &Address) -> u64 {
    // Combine round_id and player address into bytes
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &round_id.to_be_bytes()));
    
    // Convert player address to bytes
    let player_bytes = player.to_string().to_bytes();
    data.append(&player_bytes);
    
    let hash = env.crypto().sha256(&data);
    let hash_bytes: BytesN<32> = hash.into();
    
    // Convert first 8 bytes to u64
    let mut id: u64 = 0;
    for i in 0..8 {
        id = (id << 8) | (hash_bytes.get(i).unwrap() as u64);
    }
    id
}

/// Derive the multiplier (in contract x100 units, so 100 = 1.00x) from the
/// elapsed seconds since round start using the documented curve:
///   multiplier_x100 = 100 + t^1.55 * 1.6
///
/// t^1.55 is evaluated without floating point as t * t^0.5 * t^0.05:
/// sqrt uses Newton iteration on u128 and t^0.05 is the 20th root found by
/// binary search. The result floors slightly relative to the f64 curve the
/// frontend simulates, which stays well within one ledger second of drift
/// and errs toward the lower (safe) payout.
fn curve_multiplier_x100(elapsed_secs: u64) -> u64 {
    if elapsed_secs == 0 {
        return 100;
    }

    const SQRT_SCALE: u128 = 1 << 16; // fixed-point scale for sqrt(t)
    const ROOT_SCALE: u128 = 1 << 12; // fixed-point scale for t^0.05
    const COMBINED: u128 = SQRT_SCALE * ROOT_SCALE; // 2^28

    // sqrt_fp ~= sqrt(t) * SQRT_SCALE ; input t * SQRT_SCALE^2 fits u128
    // for every u64 elapsed value.
    let sqrt_fp = isqrt((elapsed_secs as u128) * SQRT_SCALE * SQRT_SCALE);

    // root_fp ~= t^0.05 * ROOT_SCALE
    let root_fp = root20_scaled(elapsed_secs, ROOT_SCALE);

    // t^1.55 = t * sqrt_fp * root_fp / (SQRT_SCALE * ROOT_SCALE)
    // product bound for u64::MAX elapsed ~= t^1.55 * 2^28, fits u128.
    let t155 = (elapsed_secs as u128) * sqrt_fp * root_fp / COMBINED;

    // multiplier_x100 = 100 + t^1.55 * 1.6 = 100 + t155 * 160 / 100
    let derived = 100u128 + (t155 * 160) / 100;
    if derived > u64::MAX as u128 {
        u64::MAX
    } else {
        derived as u64
    }
}

/// Largest y such that y^20 <= t * scale^20, i.e. floor(t^(1/20) * scale).
/// Binary search; the pow20_le predicate evaluates y^20 / scale^19 <= t * scale
/// with interleaved multiply/divide so no intermediate exceeds u128.
fn root20_scaled(t: u64, scale: u128) -> u128 {
    if t <= 1 {
        return scale; // 1^0.05 == 1
    }

    // Upper bound: 16 * scale covers every physically possible elapsed
    // (t <= 16^20 seconds ~= 4e24); doubling stops early for small t.
    let mut hi = scale * 2;
    while pow20_le(hi, t, scale) && hi < scale * 16 {
        hi *= 2;
    }

    let mut lo = hi / 2;
    while lo + 1 < hi {
        let mid = lo + (hi - lo) / 2;
        if pow20_le(mid, t, scale) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    lo
}

/// Returns y^20 <= t * scale^20 without materializing either side.
/// Computes acc = floor over steps of y^20 / scale^19 and compares to
/// t * scale; each intermediate acc * y <= (16 * scale)^20 / scale^18
/// = 16^20 * scale^2 ~= 2e31 which fits u128 when scale = 2^12.
/// Interleaved floor division underestimates y^20 by less than 1 part in
/// scale, so the boundary error is below the integer resolution of y.
fn pow20_le(y: u128, t: u64, scale: u128) -> bool {
    let mut acc: u128 = y;
    for _ in 1..20 {
        acc = acc * y / scale;
    }
    acc <= (t as u128) * scale
}

/// Integer square root via Newton iteration (floor of sqrt).
fn isqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = x / 2 + 1;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[cfg(test)]
mod test;

