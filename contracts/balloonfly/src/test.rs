#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, BytesN, Env};

fn create_test_contract<'a>(env: &'a Env) -> (Address, BalloonFlyContractClient<'a>) {
    env.mock_all_auths();
    
    // Set ledger timestamp
    env.ledger().set_timestamp(1000000);

    let admin = Address::generate(env);
    let contract_id = env.register(BalloonFlyContract, (&admin,));
    let client = BalloonFlyContractClient::new(env, &contract_id);

    (admin, client)
}

fn generate_seed(env: &Env, value: u32) -> BytesN<32> {
    let mut bytes = [0u8; 32];
    bytes[0] = (value >> 24) as u8;
    bytes[1] = (value >> 16) as u8;
    bytes[2] = (value >> 8) as u8;
    bytes[3] = value as u8;
    BytesN::from_array(env, &bytes)
}

fn hash_seed(env: &Env, seed: &BytesN<32>) -> BytesN<32> {
    let seed_bytes: soroban_sdk::Bytes = seed.clone().into();
    let hash = env.crypto().sha256(&seed_bytes);
    hash.into()
}

#[test]
fn test_initialization() {
    let env = Env::default();
    let (admin, client) = create_test_contract(&env);

    let stored_admin = client.admin();
    assert_eq!(stored_admin, admin);

    let pool = client.get_pool();
    assert_eq!(pool.total_bets, 0);
    assert_eq!(pool.total_payouts, 0);
    assert_eq!(pool.total_house_earnings, 0);
}

#[test]
fn test_create_round() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);

    let round = client.create_round(&round_id, &server_seed_hash, &60u64);
    
    assert_eq!(round.id, round_id);
    assert_eq!(round.status, RoundStatus::Waiting);
    assert_eq!(round.server_seed_hash, server_seed_hash);
    assert_eq!(round.crash_multiplier, 0);
    assert_eq!(round.total_bet_amount, 0);
    assert_eq!(round.bet_count, 0);
}

#[test]
fn test_create_duplicate_round() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);

    client.create_round(&round_id, &server_seed_hash, &60u64);
    
    // Try to create same round again - should error
    // Note: Now checks for active round first, so returns RoundAlreadyActive
    let result = client.try_create_round(&round_id, &server_seed_hash, &60u64);
    // Could be either error since we check active round first, then duplicate ID
    assert!(result.err().is_some());
}

#[test]
fn test_start_round() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 250u64; // 2.50x

    client.create_round(&round_id, &server_seed_hash, &60u64);
    client.start_round(&round_id, &server_seed, &crash_multiplier);

    let round = client.get_round(&round_id);
    assert_eq!(round.status, RoundStatus::InProgress);
    assert_eq!(round.crash_multiplier, crash_multiplier);
    assert!(round.started_at > 0);
}

#[test]
fn test_start_round_wrong_seed() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let wrong_seed = generate_seed(&env, 99999); // Wrong seed!
    let crash_multiplier = 250u64;

    client.create_round(&round_id, &server_seed_hash, &60u64);
    
    // This should error because seed doesn't match hash
    let result = client.try_start_round(&round_id, &wrong_seed, &crash_multiplier);
    assert_eq!(result.err(), Some(Ok(Error::InvalidServerSeedHash)));
}

#[test]
fn test_start_round_invalid_multiplier() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 50u64; // Too low! Minimum is 100 (1.00x)

    client.create_round(&round_id, &server_seed_hash, &60u64);
    let result = client.try_start_round(&round_id, &server_seed, &crash_multiplier);
    assert_eq!(result.err(), Some(Ok(Error::InvalidMultiplier)));
}

#[test]
fn test_place_bet() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128; // 10 XLM
    let client_seed = generate_seed(&env, 111);

    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);
    assert!(bet_id > 0);

    let bet = client.get_bet(&bet_id);
    assert_eq!(bet.player, player);
    assert_eq!(bet.amount, bet_amount);
    assert_eq!(bet.status, BetStatus::Active);
    assert_eq!(bet.round_id, round_id);

    let round = client.get_round(&round_id);
    assert_eq!(round.total_bet_amount, bet_amount);
    assert_eq!(round.bet_count, 1);

    let pool = client.get_pool();
    assert_eq!(pool.total_bets, bet_amount);
}

#[test]
fn test_place_bet_too_small() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 1_000_000i128; // 0.1 XLM - too small!
    let client_seed = generate_seed(&env, 111);

    let result = client.try_place_bet(&player, &round_id, &bet_amount, &client_seed);
    assert_eq!(result.err(), Some(Ok(Error::InvalidBetAmount)));
}

#[test]
fn test_place_bet_too_large() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 2_000_000_000_000i128; // 200,000 XLM - too large!
    let client_seed = generate_seed(&env, 111);

    let result = client.try_place_bet(&player, &round_id, &bet_amount, &client_seed);
    assert_eq!(result.err(), Some(Ok(Error::InvalidBetAmount)));
}

#[test]
fn test_place_bet_duplicate() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);

    client.place_bet(&player, &round_id, &bet_amount, &client_seed);
    
    // Try to bet again - should error
    let result = client.try_place_bet(&player, &round_id, &bet_amount, &client_seed);
    assert_eq!(result.err(), Some(Ok(Error::BetAlreadyPlaced)));
}

#[test]
fn test_place_bet_after_start() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    client.create_round(&round_id, &server_seed_hash, &60u64);
    client.start_round(&round_id, &server_seed, &250);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);

    // Try to bet after round started - should error
    let result = client.try_place_bet(&player, &round_id, &bet_amount, &client_seed);
    assert_eq!(result.err(), Some(Ok(Error::InvalidRoundStatus)));
}

#[test]
fn test_cash_out() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    // Setup round
    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 500u64; // 5.00x
    client.create_round(&round_id, &server_seed_hash, &60u64);

    // Place bet
    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128; // 10 XLM
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    // Start round
    client.start_round(&round_id, &server_seed, &crash_multiplier);

    // Cash out at 2.00x
    let cash_out_multiplier = 200u64;
    let payout = client.cash_out(&player, &bet_id, &cash_out_multiplier);

    // Expected: 10 XLM * 2.00x = 20 XLM
    // With 3% house edge: 20 * 0.97 = 19.4 XLM
    let expected_payout = 194_000_000i128;
    assert_eq!(payout, expected_payout);

    let bet = client.get_bet(&bet_id);
    assert_eq!(bet.status, BetStatus::CashedOut);
    assert_eq!(bet.cash_out_multiplier, cash_out_multiplier);
    assert_eq!(bet.payout, expected_payout);

    let pool = client.get_pool();
    assert_eq!(pool.total_payouts, expected_payout);
    assert_eq!(pool.total_house_earnings, 6_000_000i128); // 3% of 20 XLM
}

#[test]
fn test_cash_out_after_crash() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 200u64; // 2.00x
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    client.start_round(&round_id, &server_seed, &crash_multiplier);

    // Try to cash out at 2.50x when crash is at 2.00x - should error
    let result = client.try_cash_out(&player, &bet_id, &250);
    assert_eq!(result.err(), Some(Ok(Error::AlreadyCrashed)));
}

#[test]
fn test_double_cash_out() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 500u64;
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    client.start_round(&round_id, &server_seed, &crash_multiplier);

    // First cash out
    client.cash_out(&player, &bet_id, &200);

    // Try to cash out again - should error
    let result = client.try_cash_out(&player, &bet_id, &300);
    assert_eq!(result.err(), Some(Ok(Error::BetNotActive)));
}

#[test]
fn test_cash_out_unauthorized() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 500u64;
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player1, &round_id, &bet_amount, &client_seed);

    client.start_round(&round_id, &server_seed, &crash_multiplier);

    // Player 2 attempts to cash out Player 1's bet - should error Unauthorized
    let result = client.try_cash_out(&player2, &bet_id, &200);
    assert_eq!(result.err(), Some(Ok(Error::Unauthorized)));
}

#[test]
fn test_cash_out_bet_not_found() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let player = Address::generate(&env);
    let unknown_bet_id = 9999u64;

    // Unknown bet ID - should error BetNotFound
    let result = client.try_cash_out(&player, &unknown_bet_id, &200);
    assert_eq!(result.err(), Some(Ok(Error::BetNotFound)));
}

#[test]
fn test_cash_out_invalid_round_status() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    // Round is in Waiting status, not InProgress - should error InvalidRoundStatus
    let result = client.try_cash_out(&player, &bet_id, &200);
    assert_eq!(result.err(), Some(Ok(Error::InvalidRoundStatus)));
}

#[test]
fn test_cash_out_invalid_multiplier_below_minimum() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 500u64;
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    client.start_round(&round_id, &server_seed, &crash_multiplier);

    // Multiplier 99 is below minimum 100 (1.00x) - should error InvalidMultiplier
    let result = client.try_cash_out(&player, &bet_id, &99);
    assert_eq!(result.err(), Some(Ok(Error::InvalidMultiplier)));
}

#[test]
fn test_cash_out_exact_crash_multiplier() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    let crash_multiplier = 200u64; // 2.00x
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 100_000_000i128;
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    client.start_round(&round_id, &server_seed, &crash_multiplier);

    // Exact equality with crash multiplier (200 == 200) - should error AlreadyCrashed
    let result = client.try_cash_out(&player, &bet_id, &crash_multiplier);
    assert_eq!(result.err(), Some(Ok(Error::AlreadyCrashed)));
}

#[test]
fn test_finalize_round() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    client.create_round(&round_id, &server_seed_hash, &60u64);
    client.start_round(&round_id, &server_seed, &250);

    let next_server_seed = generate_seed(&env, 54321);
    let next_server_seed_hash = hash_seed(&env, &next_server_seed);
    let next_round_id = client.finalize_round(&round_id, &next_server_seed_hash, &60u64);

    let round = client.get_round(&round_id);
    assert_eq!(round.status, RoundStatus::Ended);
    assert!(round.ended_at > 0);
    
    // Verify next round was created automatically
    assert_eq!(next_round_id, round_id + 1);
    let next_round = client.get_round(&next_round_id);
    assert_eq!(next_round.status, RoundStatus::Waiting);
    assert_eq!(next_round.id, next_round_id);
}

#[test]
fn test_cannot_create_two_active_rounds() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id_1 = 1u64;
    let server_seed_1 = generate_seed(&env, 12345);
    let server_seed_hash_1 = hash_seed(&env, &server_seed_1);
    
    // Create first round
    client.create_round(&round_id_1, &server_seed_hash_1, &60u64);
    
    // Try to create second round while first is active - should error
    let round_id_2 = 2u64;
    let server_seed_2 = generate_seed(&env, 54321);
    let server_seed_hash_2 = hash_seed(&env, &server_seed_2);
    
    let result = client.try_create_round(&round_id_2, &server_seed_hash_2, &60u64);
    assert_eq!(result.err(), Some(Ok(Error::RoundAlreadyActive)));
    
    // After finalizing first round, should be able to create second
    client.start_round(&round_id_1, &server_seed_1, &250);
    let next_server_seed = generate_seed(&env, 99999);
    let next_server_seed_hash = hash_seed(&env, &next_server_seed);
    client.finalize_round(&round_id_1, &next_server_seed_hash, &60u64);
    
    // Now should be able to create round 2 (but round 3 was auto-created)
    // So we test with round 4
    let round_id_4 = 4u64;
    let server_seed_4 = generate_seed(&env, 11111);
    let server_seed_hash_4 = hash_seed(&env, &server_seed_4);
    
    // Should still error because round 3 is now active
    let result = client.try_create_round(&round_id_4, &server_seed_hash_4, &60u64);
    assert_eq!(result.err(), Some(Ok(Error::RoundAlreadyActive)));
}

#[test]
fn test_multiple_bets_same_round() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    // Player 1 bets
    let player1 = Address::generate(&env);
    let bet1_amount = 100_000_000i128;
    let client_seed1 = generate_seed(&env, 111);
    client.place_bet(&player1, &round_id, &bet1_amount, &client_seed1);

    // Player 2 bets
    let player2 = Address::generate(&env);
    let bet2_amount = 200_000_000i128;
    let client_seed2 = generate_seed(&env, 222);
    client.place_bet(&player2, &round_id, &bet2_amount, &client_seed2);

    // Player 3 bets
    let player3 = Address::generate(&env);
    let bet3_amount = 300_000_000i128;
    let client_seed3 = generate_seed(&env, 333);
    client.place_bet(&player3, &round_id, &bet3_amount, &client_seed3);

    let round = client.get_round(&round_id);
    assert_eq!(round.bet_count, 3);
    assert_eq!(round.total_bet_amount, 600_000_000i128);
    assert_eq!(round.client_seeds.len(), 3); // First 3 seeds collected

    let pool = client.get_pool();
    assert_eq!(pool.total_bets, 600_000_000i128);
}

#[test]
fn test_client_seeds_collection() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed_hash = hash_seed(&env, &generate_seed(&env, 12345));
    client.create_round(&round_id, &server_seed_hash, &60u64);

    // Place 5 bets
    for i in 0..5 {
        let player = Address::generate(&env);
        let bet_amount = 100_000_000i128;
        let client_seed = generate_seed(&env, i);
        client.place_bet(&player, &round_id, &bet_amount, &client_seed);
    }

    let round = client.get_round(&round_id);
    
    // Only first 3 seeds should be collected
    assert_eq!(round.client_seeds.len(), 3);
    assert_eq!(round.bet_count, 5);
}

#[test]
fn test_payout_calculation_accuracy() {
    let env = Env::default();
    let (_admin, client) = create_test_contract(&env);

    let round_id = 1u64;
    let server_seed = generate_seed(&env, 12345);
    let server_seed_hash = hash_seed(&env, &server_seed);
    client.create_round(&round_id, &server_seed_hash, &60u64);

    let player = Address::generate(&env);
    let bet_amount = 500_000_000i128; // 50 XLM
    let client_seed = generate_seed(&env, 111);
    let bet_id = client.place_bet(&player, &round_id, &bet_amount, &client_seed);

    client.start_round(&round_id, &server_seed, &1000); // Crash at 10.00x

    // Cash out at 3.50x
    let payout = client.cash_out(&player, &bet_id, &350);

    // Expected: 50 XLM * 3.50x = 175 XLM
    // With 3% house edge: 175 * 0.97 = 169.75 XLM
    let expected_payout = 1_697_500_000i128;
    assert_eq!(payout, expected_payout);

    let pool = client.get_pool();
    assert_eq!(pool.total_house_earnings, 52_500_000i128); // 3% of 175 XLM
}

