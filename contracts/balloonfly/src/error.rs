use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Round not found
    RoundNotFound = 1,
    /// Round already exists
    RoundAlreadyExists = 2,
    /// Invalid round status for this operation
    InvalidRoundStatus = 3,
    /// Invalid server seed hash
    InvalidServerSeedHash = 4,
    /// Invalid multiplier value
    InvalidMultiplier = 5,
    /// Invalid bet amount
    InvalidBetAmount = 6,
    /// Bet already placed for this round
    BetAlreadyPlaced = 7,
    /// Bet not found
    BetNotFound = 8,
    /// Bet is not active
    BetNotActive = 9,
    /// Unauthorized operation
    Unauthorized = 10,
    /// Round already crashed
    AlreadyCrashed = 11,
    /// Transfer failed
    TransferFailed = 12,
    /// Admin not initialized
    AdminNotInitialized = 13,
    /// Round already active (Waiting or InProgress)
    RoundAlreadyActive = 14,
    /// No active round found
    NoActiveRound = 15,
    /// Betting window has not closed yet
    BettingWindowNotClosed = 16,
}

