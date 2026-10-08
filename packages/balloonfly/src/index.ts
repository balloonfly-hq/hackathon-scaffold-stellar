import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  standalone: {
    networkPassphrase: "Standalone Network ; February 2017",
    contractId: "CA4WNWRHFNFBMXDQRFMBNNFRGD3Q7LLFY5SP2VQQ7WLRAYO23DTCWIQY",
  }
} as const

export const Errors = {
  /**
   * Round not found
   */
  1: {message:"RoundNotFound"},
  /**
   * Round already exists
   */
  2: {message:"RoundAlreadyExists"},
  /**
   * Invalid round status for this operation
   */
  3: {message:"InvalidRoundStatus"},
  /**
   * Invalid server seed hash
   */
  4: {message:"InvalidServerSeedHash"},
  /**
   * Invalid multiplier value
   */
  5: {message:"InvalidMultiplier"},
  /**
   * Invalid bet amount
   */
  6: {message:"InvalidBetAmount"},
  /**
   * Bet already placed for this round
   */
  7: {message:"BetAlreadyPlaced"},
  /**
   * Bet not found
   */
  8: {message:"BetNotFound"},
  /**
   * Bet is not active
   */
  9: {message:"BetNotActive"},
  /**
   * Unauthorized operation
   */
  10: {message:"Unauthorized"},
  /**
   * Round already crashed
   */
  11: {message:"AlreadyCrashed"},
  /**
   * Transfer failed
   */
  12: {message:"TransferFailed"},
  /**
   * Admin not initialized
   */
  13: {message:"AdminNotInitialized"},
  /**
   * Round already active (Waiting or InProgress)
   */
  14: {message:"RoundAlreadyActive"},
  /**
   * No active round found
   */
  15: {message:"NoActiveRound"}
}

export type RoundStatus = {tag: "Waiting", values: void} | {tag: "InProgress", values: void} | {tag: "Ended", values: void};


export interface Round {
  bet_count: u32;
  betting_window_end: u64;
  client_seeds: Array<Buffer>;
  crash_multiplier: u64;
  created_at: u64;
  ended_at: u64;
  id: u64;
  server_seed_hash: Buffer;
  started_at: u64;
  status: RoundStatus;
  total_bet_amount: i128;
  total_payout: i128;
}

export type BetStatus = {tag: "Active", values: void} | {tag: "CashedOut", values: void} | {tag: "Lost", values: void};


export interface Bet {
  amount: i128;
  cash_out_multiplier: u64;
  id: u64;
  payout: i128;
  player: string;
  round_id: u64;
  status: BetStatus;
  timestamp: u64;
}


export interface Pool {
  total_bets: i128;
  total_house_earnings: i128;
  total_payouts: i128;
}

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current admin address
   */
  admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a create_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new round (admin only)
   * 
   * Security: Only admin can create rounds to prevent spam
   * Ensures only one round is active at a time
   */
  create_round: ({round_id, server_seed_hash, betting_window_seconds}: {round_id: u64, server_seed_hash: Buffer, betting_window_seconds: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Round>>>

  /**
   * Construct and simulate a start_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Start the round with server seed (admin only)
   * 
   * Security: Server seed must match hash, multiplier pre-determined
   */
  start_round: ({round_id, server_seed, crash_multiplier}: {round_id: u64, server_seed: Buffer, crash_multiplier: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a place_bet transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Place a bet in the current round
   * 
   * Validation & Security:
   * - Requires player authorization
   * - Verifies round is in Waiting status
   * - Validates bet amount within bounds (1 XLM to 1000 XLM)
   * - Prevents duplicate bets by the same player in this round
   * - Note: Token transfer is assumed to be handled externally (player balance is not checked on-chain)
   */
  place_bet: ({player, round_id, amount, client_seed}: {player: string, round_id: u64, amount: i128, client_seed: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a cash_out transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cash out a bet at current multiplier
   * 
   * Validation & Security:
   * - Requires player authorization
   * - Verifies bet ownership (`bet.player == player`)
   * - Verifies bet is currently Active (prevents multiple cash outs)
   * - Verifies round is currently InProgress
   * - Verifies multiplier has not reached or exceeded crash multiplier
   * - Validates multiplier is at least 100 (1.00x minimum)
   * - Calculates net payout deducting 3% house edge
   * - Note: Multiplier is supplied by caller; payout token transfer is assumed to be handled externally
   */
  cash_out: ({player, bet_id, current_multiplier}: {player: string, bet_id: u64, current_multiplier: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a finalize_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Finalize the round (admin only)
   * 
   * Validation & Security:
   * - Requires admin authorization
   * - Verifies round is currently InProgress
   * - Transitions round status to Ended with timestamp
   * - Automatically creates next round with next_server_seed_hash in Waiting status
   * - Note: Does not mutate uncashed bets in storage (uncashed bets remain un-cashed)
   */
  finalize_round: ({round_id, next_server_seed_hash, betting_window_seconds}: {round_id: u64, next_server_seed_hash: Buffer, betting_window_seconds: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get round details
   */
  get_round: ({round_id}: {round_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Round>>>

  /**
   * Construct and simulate a get_bet transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get bet details
   */
  get_bet: ({bet_id}: {bet_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Bet>>>

  /**
   * Construct and simulate a get_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get pool statistics
   */
  get_pool: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Pool>>

  /**
   * Construct and simulate a get_current_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current active round
   */
  get_current_round: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Round>>>

  /**
   * Construct and simulate a get_current_round_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current round ID
   */
  get_current_round_id: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<u64>>>

  /**
   * Construct and simulate a can_start_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if current round can be started
   * Returns true if round is Waiting and betting window has expired
   */
  can_start_round: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<boolean>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADwAAAA9Sb3VuZCBub3QgZm91bmQAAAAADVJvdW5kTm90Rm91bmQAAAAAAAABAAAAFFJvdW5kIGFscmVhZHkgZXhpc3RzAAAAElJvdW5kQWxyZWFkeUV4aXN0cwAAAAAAAgAAACdJbnZhbGlkIHJvdW5kIHN0YXR1cyBmb3IgdGhpcyBvcGVyYXRpb24AAAAAEkludmFsaWRSb3VuZFN0YXR1cwAAAAAAAwAAABhJbnZhbGlkIHNlcnZlciBzZWVkIGhhc2gAAAAVSW52YWxpZFNlcnZlclNlZWRIYXNoAAAAAAAABAAAABhJbnZhbGlkIG11bHRpcGxpZXIgdmFsdWUAAAARSW52YWxpZE11bHRpcGxpZXIAAAAAAAAFAAAAEkludmFsaWQgYmV0IGFtb3VudAAAAAAAEEludmFsaWRCZXRBbW91bnQAAAAGAAAAIUJldCBhbHJlYWR5IHBsYWNlZCBmb3IgdGhpcyByb3VuZAAAAAAAABBCZXRBbHJlYWR5UGxhY2VkAAAABwAAAA1CZXQgbm90IGZvdW5kAAAAAAAAC0JldE5vdEZvdW5kAAAAAAgAAAARQmV0IGlzIG5vdCBhY3RpdmUAAAAAAAAMQmV0Tm90QWN0aXZlAAAACQAAABZVbmF1dGhvcml6ZWQgb3BlcmF0aW9uAAAAAAAMVW5hdXRob3JpemVkAAAACgAAABVSb3VuZCBhbHJlYWR5IGNyYXNoZWQAAAAAAAAOQWxyZWFkeUNyYXNoZWQAAAAAAAsAAAAPVHJhbnNmZXIgZmFpbGVkAAAAAA5UcmFuc2ZlckZhaWxlZAAAAAAADAAAABVBZG1pbiBub3QgaW5pdGlhbGl6ZWQAAAAAAAATQWRtaW5Ob3RJbml0aWFsaXplZAAAAAANAAAALFJvdW5kIGFscmVhZHkgYWN0aXZlIChXYWl0aW5nIG9yIEluUHJvZ3Jlc3MpAAAAElJvdW5kQWxyZWFkeUFjdGl2ZQAAAAAADgAAABVObyBhY3RpdmUgcm91bmQgZm91bmQAAAAAAAANTm9BY3RpdmVSb3VuZAAAAAAAAA8=",
        "AAAAAgAAAAAAAAAAAAAAC1JvdW5kU3RhdHVzAAAAAAMAAAAAAAAAAAAAAAdXYWl0aW5nAAAAAAAAAAAAAAAACkluUHJvZ3Jlc3MAAAAAAAAAAAAAAAAABUVuZGVkAAAA",
        "AAAAAQAAAAAAAAAAAAAABVJvdW5kAAAAAAAADAAAAAAAAAAJYmV0X2NvdW50AAAAAAAABAAAAAAAAAASYmV0dGluZ193aW5kb3dfZW5kAAAAAAAGAAAAAAAAAAxjbGllbnRfc2VlZHMAAAPqAAAD7gAAACAAAAAAAAAAEGNyYXNoX211bHRpcGxpZXIAAAAGAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAAAAAAAhlbmRlZF9hdAAAAAYAAAAAAAAAAmlkAAAAAAAGAAAAAAAAABBzZXJ2ZXJfc2VlZF9oYXNoAAAD7gAAACAAAAAAAAAACnN0YXJ0ZWRfYXQAAAAAAAYAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAtSb3VuZFN0YXR1cwAAAAAAAAAAEHRvdGFsX2JldF9hbW91bnQAAAALAAAAAAAAAAx0b3RhbF9wYXlvdXQAAAAL",
        "AAAAAgAAAAAAAAAAAAAACUJldFN0YXR1cwAAAAAAAAMAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAACUNhc2hlZE91dAAAAAAAAAAAAAAAAAAABExvc3Q=",
        "AAAAAQAAAAAAAAAAAAAAA0JldAAAAAAIAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAE2Nhc2hfb3V0X211bHRpcGxpZXIAAAAABgAAAAAAAAACaWQAAAAAAAYAAAAAAAAABnBheW91dAAAAAAACwAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAlCZXRTdGF0dXMAAAAAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAABFBvb2wAAAADAAAAAAAAAAp0b3RhbF9iZXRzAAAAAAALAAAAAAAAABR0b3RhbF9ob3VzZV9lYXJuaW5ncwAAAAsAAAAAAAAADXRvdGFsX3BheW91dHMAAAAAAAAL",
        "AAAAAAAAACpJbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIGFkbWluIGFkZHJlc3MAAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAABlHZXQgY3VycmVudCBhZG1pbiBhZGRyZXNzAAAAAAAABWFkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAIJDcmVhdGUgYSBuZXcgcm91bmQgKGFkbWluIG9ubHkpCgpTZWN1cml0eTogT25seSBhZG1pbiBjYW4gY3JlYXRlIHJvdW5kcyB0byBwcmV2ZW50IHNwYW0KRW5zdXJlcyBvbmx5IG9uZSByb3VuZCBpcyBhY3RpdmUgYXQgYSB0aW1lAAAAAAAMY3JlYXRlX3JvdW5kAAAAAwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAAAAABBzZXJ2ZXJfc2VlZF9oYXNoAAAD7gAAACAAAAAAAAAAFmJldHRpbmdfd2luZG93X3NlY29uZHMAAAAAAAYAAAABAAAD6QAAB9AAAAAFUm91bmQAAAAAAAAD",
        "AAAAAAAAAG9TdGFydCB0aGUgcm91bmQgd2l0aCBzZXJ2ZXIgc2VlZCAoYWRtaW4gb25seSkKClNlY3VyaXR5OiBTZXJ2ZXIgc2VlZCBtdXN0IG1hdGNoIGhhc2gsIG11bHRpcGxpZXIgcHJlLWRldGVybWluZWQAAAAAC3N0YXJ0X3JvdW5kAAAAAAMAAAAAAAAACHJvdW5kX2lkAAAABgAAAAAAAAALc2VydmVyX3NlZWQAAAAD7gAAACAAAAAAAAAAEGNyYXNoX211bHRpcGxpZXIAAAAGAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
        "AAAAAAAAAKlQbGFjZSBhIGJldCBpbiB0aGUgY3VycmVudCByb3VuZAoKU2VjdXJpdHk6Ci0gQ2hlY2tzIHBsYXllciBiYWxhbmNlCi0gVmFsaWRhdGVzIGJldCBhbW91bnQgKG1pbi9tYXgpCi0gUHJldmVudHMgYmV0dGluZyBhZnRlciByb3VuZCBzdGFydGVkCi0gVXNlcyB0b2tlbiB0cmFuc2ZlciBmb3IgWExNAAAAAAAACXBsYWNlX2JldAAAAAAAAAQAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAC2NsaWVudF9zZWVkAAAAA+4AAAAgAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAL1DYXNoIG91dCBhIGJldCBhdCBjdXJyZW50IG11bHRpcGxpZXIKClNlY3VyaXR5OgotIFZlcmlmaWVzIGJldCBvd25lcnNoaXAKLSBDaGVja3MgYmV0IGlzIGFjdGl2ZQotIFZhbGlkYXRlcyBtdWx0aXBsaWVyIGhhc24ndCBjcmFzaGVkCi0gQ2FsY3VsYXRlcyBwYXlvdXQgd2l0aCBob3VzZSBlZGdlCi0gUHJldmVudHMgcmUtZW50cnkAAAAAAAAIY2FzaF9vdXQAAAADAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAABmJldF9pZAAAAAAABgAAAAAAAAASY3VycmVudF9tdWx0aXBsaWVyAAAAAAAGAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAAL9GaW5hbGl6ZSB0aGUgcm91bmQgKGFkbWluIG9ubHkpCgpTZWN1cml0eToKLSBPbmx5IGFkbWluIGNhbiBmaW5hbGl6ZQotIFZlcmlmaWVzIHJvdW5kIGlzIGluIHByb2dyZXNzCi0gTWFya3MgYWxsIHVuY2FzaGVkIGJldHMgYXMgbG9zdAotIFJlY29yZHMgZmluYWwgc3RhdHMKLSBBdXRvbWF0aWNhbGx5IGNyZWF0ZXMgbmV4dCByb3VuZAAAAAAOZmluYWxpemVfcm91bmQAAAAAAAMAAAAAAAAACHJvdW5kX2lkAAAABgAAAAAAAAAVbmV4dF9zZXJ2ZXJfc2VlZF9oYXNoAAAAAAAD7gAAACAAAAAAAAAAFmJldHRpbmdfd2luZG93X3NlY29uZHMAAAAAAAYAAAABAAAD6QAAAAYAAAAD",
        "AAAAAAAAABFHZXQgcm91bmQgZGV0YWlscwAAAAAAAAlnZXRfcm91bmQAAAAAAAABAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAABAAAD6QAAB9AAAAAFUm91bmQAAAAAAAAD",
        "AAAAAAAAAA9HZXQgYmV0IGRldGFpbHMAAAAAB2dldF9iZXQAAAAAAQAAAAAAAAAGYmV0X2lkAAAAAAAGAAAAAQAAA+kAAAfQAAAAA0JldAAAAAAD",
        "AAAAAAAAABNHZXQgcG9vbCBzdGF0aXN0aWNzAAAAAAhnZXRfcG9vbAAAAAAAAAABAAAH0AAAAARQb29s",
        "AAAAAAAAABhHZXQgY3VycmVudCBhY3RpdmUgcm91bmQAAAARZ2V0X2N1cnJlbnRfcm91bmQAAAAAAAAAAAAAAQAAA+kAAAfQAAAABVJvdW5kAAAAAAAAAw==",
        "AAAAAAAAABRHZXQgY3VycmVudCByb3VuZCBJRAAAABRnZXRfY3VycmVudF9yb3VuZF9pZAAAAAAAAAABAAAD6AAAAAY=",
        "AAAAAAAAAGVDaGVjayBpZiBjdXJyZW50IHJvdW5kIGNhbiBiZSBzdGFydGVkClJldHVybnMgdHJ1ZSBpZiByb3VuZCBpcyBXYWl0aW5nIGFuZCBiZXR0aW5nIHdpbmRvdyBoYXMgZXhwaXJlZAAAAAAAAA9jYW5fc3RhcnRfcm91bmQAAAAAAAAAAAEAAAPpAAAAAQAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<string>,
        create_round: this.txFromJSON<Result<Round>>,
        start_round: this.txFromJSON<Result<void>>,
        place_bet: this.txFromJSON<Result<u64>>,
        cash_out: this.txFromJSON<Result<i128>>,
        finalize_round: this.txFromJSON<Result<u64>>,
        get_round: this.txFromJSON<Result<Round>>,
        get_bet: this.txFromJSON<Result<Bet>>,
        get_pool: this.txFromJSON<Pool>,
        get_current_round: this.txFromJSON<Result<Round>>,
        get_current_round_id: this.txFromJSON<Option<u64>>,
        can_start_round: this.txFromJSON<Result<boolean>>
  }
}