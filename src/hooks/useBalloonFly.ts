import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "./useWallet";
import balloonFlyClient from "../contracts/balloonfly";
import type { RoundStatus as ContractRoundStatus } from "../../packages/balloonfly/src/index";

// Types matching the Rust contract
export enum RoundStatus {
  Waiting = "Waiting",
  InProgress = "InProgress",
  Ended = "Ended",
}

// Helper to convert contract RoundStatus (tagged union) to enum
export const convertRoundStatus = (status: ContractRoundStatus): RoundStatus => {
  if (typeof status === 'object' && status !== null && 'tag' in status) {
    switch (status.tag) {
      case 'Waiting': return RoundStatus.Waiting;
      case 'InProgress': return RoundStatus.InProgress;
      case 'Ended': return RoundStatus.Ended;
      default: return RoundStatus.Waiting;
    }
  }
  // Fallback for string values
  return status as RoundStatus;
}

export enum BetStatus {
  Active = "Active",
  CashedOut = "CashedOut",
  Lost = "Lost",
}

export interface Round {
  id: bigint;
  status: RoundStatus;
  server_seed_hash: Buffer;
  crash_multiplier: bigint;
  created_at: bigint;
  started_at: bigint;
  ended_at: bigint;
  betting_window_end: bigint; // Timestamp when betting window closes
  total_bet_amount: bigint;
  total_payout: bigint;
  bet_count: number;
  client_seeds: Buffer[];
}

export interface Bet {
  id: bigint;
  round_id: bigint;
  player: string;
  amount: bigint;
  cash_out_multiplier: bigint;
  payout: bigint;
  status: BetStatus;
  timestamp: bigint;
}

export interface Pool {
  total_bets: bigint;
  total_payouts: bigint;
  total_house_earnings: bigint;
}

interface UseBalloonFlyReturn {
  // State
  currentRound: Round | null;
  currentMultiplier: number;
  isFlying: boolean;
  userBet: Bet | null;
  pool: Pool | null;
  pastRounds: Round[];
  loading: boolean;
  error: string | null;

  // Actions
  placeBet: (amount: number) => Promise<void>;
  cashOut: () => Promise<void>;
  fetchRoundDetails: (roundId: bigint) => Promise<Round | null>;
  initializeFirstRound: () => Promise<void>;

  // Auto-bet configuration (shared across betting panels)
  betAmount: number;
  setBetAmount: (amount: number) => void;
  autoBetEnabled: boolean;
  setAutoBetEnabled: (enabled: boolean) => void;
  autoCashOutEnabled: boolean;
  setAutoCashOutEnabled: (enabled: boolean) => void;
  autoCashOutMultiplier: number;
  setAutoCashOutMultiplier: (mult: number) => void;

  // Utilities
  formatXLM: (stroops: bigint) => string;
  multiplierToNumber: (mult: bigint) => number;
}

export const useBalloonFly = (): UseBalloonFlyReturn => {
  const { address } = useWallet();

  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [isFlying, setIsFlying] = useState(false);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [pastRounds, setPastRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-bet settings lifted from BettingPanel so the hook can drive
  // automatic placement and cash-out. Persisted under the same
  // localStorage keys the panel previously used.
  const [betAmount, setBetAmountState] = useState(() => {
    const saved = localStorage.getItem("balloonfly_bet_amount");
    if (saved) {
      const amount = parseFloat(saved);
      if (!isNaN(amount) && amount >= 1.0) {
        return amount;
      }
    }
    return 1.0;
  });

  const [autoBetEnabled, setAutoBetEnabledState] = useState(
    () => localStorage.getItem("balloonfly_auto_bet") === "true",
  );

  const [autoCashOutEnabled, setAutoCashOutEnabledState] = useState(
    () => localStorage.getItem("balloonfly_auto_cashout") === "true",
  );

  const [autoCashOutMultiplier, setAutoCashOutMultiplierState] = useState(
    () => {
      const saved = localStorage.getItem("balloonfly_auto_cashout_mult");
      if (saved) {
        const mult = parseFloat(saved);
        if (!isNaN(mult) && mult >= 1.0) {
          return Math.min(1000.0, mult);
        }
      }
      return 1.1;
    },
  );

  const setBetAmount = useCallback((amount: number) => {
    const clamped = Math.max(1.0, amount);
    setBetAmountState(clamped);
    localStorage.setItem("balloonfly_bet_amount", clamped.toString());
  }, []);

  const setAutoBetEnabled = useCallback((enabled: boolean) => {
    setAutoBetEnabledState(enabled);
    localStorage.setItem("balloonfly_auto_bet", enabled.toString());
  }, []);

  const setAutoCashOutEnabled = useCallback((enabled: boolean) => {
    setAutoCashOutEnabledState(enabled);
    localStorage.setItem("balloonfly_auto_cashout", enabled.toString());
  }, []);

  const setAutoCashOutMultiplier = useCallback((mult: number) => {
    const clamped = Math.max(1.0, Math.min(1000.0, mult));
    setAutoCashOutMultiplierState(clamped);
    localStorage.setItem("balloonfly_auto_cashout_mult", clamped.toString());
  }, []);

  // Utility functions
  const formatXLM = useCallback((stroops: bigint): string => {
    return (Number(stroops) / 10_000_000).toFixed(2);
  }, []);

  const multiplierToNumber = useCallback((mult: bigint): number => {
    return Number(mult) / 100;
  }, []);

  // Fetch pool statistics
  const fetchPool = useCallback(async () => {
    try {
      const poolData = await balloonFlyClient.get_pool();
      if (poolData.result) {
        setPool(poolData.result as unknown as Pool);
      }
    } catch (err) {
      console.error("Error fetching pool:", err);
    }
  }, []);

  // Fetch current round using get_current_round
  const fetchCurrentRound = useCallback(async () => {
    try {
      const roundData = await balloonFlyClient.get_current_round();
      if (roundData.result) {
        const contractRound = roundData.result as unknown as any;

        // Convert contract round to our Round type
        const round: Round = {
          id: BigInt(contractRound.id || 0),
          status: convertRoundStatus(contractRound.status),
          server_seed_hash: contractRound.server_seed_hash,
          crash_multiplier: BigInt(contractRound.crash_multiplier || 0),
          created_at: BigInt(contractRound.created_at || 0),
          started_at: BigInt(contractRound.started_at || 0),
          ended_at: BigInt(contractRound.ended_at || 0),
          betting_window_end: BigInt(contractRound.betting_window_end || 0),
          total_bet_amount: BigInt(contractRound.total_bet_amount || 0),
          total_payout: BigInt(contractRound.total_payout || 0),
          bet_count: contractRound.bet_count || 0,
          client_seeds: contractRound.client_seeds || [],
        };

        // Only update state if round actually changed to prevent unnecessary re-renders
        setCurrentRound(prev => {
          if (!prev) {
            // First time, set flying state
            const isFlyingNow = round.status === RoundStatus.InProgress;
            setIsFlying(isFlyingNow);
            return round;
          }

          // Check if round ID or status changed
          const idChanged = prev.id !== round.id;
          const statusChanged = prev.status !== round.status;

          // Check if other important fields changed
          const fieldsChanged = (
            prev.crash_multiplier !== round.crash_multiplier ||
            prev.total_bet_amount !== round.total_bet_amount ||
            prev.total_payout !== round.total_payout ||
            prev.bet_count !== round.bet_count ||
            prev.started_at !== round.started_at
          );

          // Only update if something actually changed
          if (idChanged || statusChanged || fieldsChanged) {
            // Update flying state if status changed
            if (statusChanged) {
              const wasFlying = prev.status === RoundStatus.InProgress;
              const isFlyingNow = round.status === RoundStatus.InProgress;
              if (wasFlying !== isFlyingNow) {
                setIsFlying(isFlyingNow);
              }

              // When round ends, add to history
              if (round.status === RoundStatus.Ended && prev.status !== RoundStatus.Ended) {
                setPastRounds(prevRounds => {
                  const exists = prevRounds.some(r => r.id === round.id);
                  if (exists) return prevRounds;
                  return [round, ...prevRounds].slice(0, 100);
                });
              }
            }

            return round;
          }

          // No changes, return previous to prevent re-render
          return prev;
        });
      }
    } catch (err) {
      console.error("Error fetching current round:", err);
      // If no active round, set to null
      setCurrentRound(null);
    }
  }, []);

  // Fetch round details (for modal)
  const fetchRoundDetails = useCallback(async (roundId: bigint): Promise<Round | null> => {
    try {
      const roundData = await balloonFlyClient.get_round({ round_id: roundId });
      if (roundData.result) {
        const contractRound = roundData.result as unknown as any;

        // Convert contract round to our Round type
        const round: Round = {
          id: BigInt(contractRound.id || 0),
          status: convertRoundStatus(contractRound.status),
          server_seed_hash: contractRound.server_seed_hash,
          crash_multiplier: BigInt(contractRound.crash_multiplier || 0),
          created_at: BigInt(contractRound.created_at || 0),
          started_at: BigInt(contractRound.started_at || 0),
          ended_at: BigInt(contractRound.ended_at || 0),
          betting_window_end: BigInt(contractRound.betting_window_end || 0),
          total_bet_amount: BigInt(contractRound.total_bet_amount || 0),
          total_payout: BigInt(contractRound.total_payout || 0),
          bet_count: contractRound.bet_count || 0,
          client_seeds: contractRound.client_seeds || [],
        };

        return round;
      }
      return null;
    } catch (err) {
      console.error("Error fetching round details:", err);
      return null;
    }
  }, []);

  // Place bet
  const placeBet = useCallback(async (amount: number) => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!currentRound) {
      setError("No active round");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountInStroops = BigInt(Math.floor(amount * 10_000_000));

      // Generate random client seed
      const clientSeed = new Uint8Array(32);
      crypto.getRandomValues(clientSeed);

      const result = await balloonFlyClient.place_bet({
        player: address,
        round_id: currentRound.id,
        amount: amountInStroops,
        client_seed: Buffer.from(clientSeed),
      });

      console.log("Bet placed:", result);

      // Fetch the bet details
      if (result.result) {
        const betId = result.result as unknown as bigint;
        const betData = await balloonFlyClient.get_bet({ bet_id: betId });
        if (betData.result) {
          setUserBet(betData.result as unknown as Bet);
        }
      }

      // Refresh round data
      await fetchCurrentRound();
    } catch (err: any) {
      console.error("Error placing bet:", err);
      setError(err.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  }, [address, currentRound, fetchCurrentRound]);

  // Cash out
  const cashOut = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!userBet || userBet.status !== BetStatus.Active) {
      setError("No active bet to cash out");
      return;
    }

    if (!isFlying) {
      setError("Round is not in progress");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentMultiplierInContract = BigInt(Math.floor(currentMultiplier * 100));

      const result = await balloonFlyClient.cash_out({
        player: address,
        bet_id: userBet.id,
        current_multiplier: currentMultiplierInContract,
      });

      console.log("Cashed out:", result);

      // Refresh bet data
      const betData = await balloonFlyClient.get_bet({ bet_id: userBet.id });
      if (betData.result) {
        setUserBet(betData.result as unknown as Bet);
      }

      // Refresh round data
      await fetchCurrentRound();
    } catch (err: any) {
      console.error("Error cashing out:", err);
      setError(err.message || "Failed to cash out");
    } finally {
      setLoading(false);
    }
  }, [address, userBet, isFlying, currentMultiplier, currentRound, fetchCurrentRound]);

  // Initialize first round (admin only)
  const initializeFirstRound = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if there's already a current round
      const currentRoundId = await balloonFlyClient.get_current_round_id();
      if (currentRoundId.result) {
        setError("Round already exists");
        setLoading(false);
        return;
      }

      // Generate server seed and hash
      const serverSeed = new Uint8Array(32);
      crypto.getRandomValues(serverSeed);

      // Hash the seed using Web Crypto API
      const hashBuffer = await crypto.subtle.digest('SHA-256', serverSeed);
      const hashArray = new Uint8Array(hashBuffer);
      const serverSeedHash = Buffer.from(hashArray.slice(0, 32));

      // Create first round (ID = 1)
      const roundId = 1n;
      const bettingWindowSeconds = 60n; // 60 seconds betting window

      const result = await balloonFlyClient.create_round({
        round_id: roundId,
        server_seed_hash: serverSeedHash,
        betting_window_seconds: bettingWindowSeconds,
      });

      if (result.result) {
        console.log("First round created:", result.result);
        await fetchCurrentRound();
      }
    } catch (err: any) {
      console.error("Error initializing first round:", err);
      setError(err.message || "Failed to initialize first round. Make sure you are the admin.");
    } finally {
      setLoading(false);
    }
  }, [address, fetchCurrentRound]);

  // Auto-bet: place a bet once per round when the round is in its
  // Waiting (betting window) phase. Tracks the last round handled so a
  // new round triggers exactly one placement.
  const autoBetRoundRef = useRef<bigint | null>(null);
  useEffect(() => {
    if (
      !autoBetEnabled ||
      !address ||
      !currentRound ||
      currentRound.status !== RoundStatus.Waiting ||
      autoBetRoundRef.current === currentRound.id
    ) {
      return;
    }

    const roundId = currentRound.id;
    autoBetRoundRef.current = roundId;
    void placeBet(betAmount);
  }, [autoBetEnabled, address, currentRound, betAmount, placeBet]);

  // Auto cash-out: fire once the live multiplier reaches the configured
  // threshold while the player's bet is active in the current round.
  const autoCashOutBusyRef = useRef(false);
  useEffect(() => {
    const hasActiveBetThisRound =
      !!userBet &&
      userBet.status === BetStatus.Active &&
      !!currentRound &&
      userBet.round_id === currentRound.id;

    if (
      !autoCashOutEnabled ||
      !isFlying ||
      !hasActiveBetThisRound ||
      currentMultiplier < autoCashOutMultiplier ||
      autoCashOutBusyRef.current
    ) {
      return;
    }

    autoCashOutBusyRef.current = true;
    void (async () => {
      try {
        await cashOut();
      } finally {
        autoCashOutBusyRef.current = false;
      }
    })();
  }, [
    autoCashOutEnabled,
    autoCashOutMultiplier,
    currentMultiplier,
    isFlying,
    userBet,
    currentRound,
    cashOut,
  ]);

  // Calculate multiplier based on elapsed time since round started
  // Formula: multiplier = 1 + (time_elapsed^1.55 * 1.6) / 100
  useEffect(() => {
    if (!isFlying || !currentRound || currentRound.started_at === 0n) {
      setCurrentMultiplier(1.0);
      return;
    }

    const interval = setInterval(() => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const startedAt = currentRound.started_at;
      const elapsedSeconds = Number(now - startedAt);

      if (elapsedSeconds < 0) {
        setCurrentMultiplier(1.0);
        return;
      }

      // Calculate multiplier: 1 + (t^1.55 * 1.6) / 100
      const multiplier = 1.0 + (Math.pow(elapsedSeconds, 1.55) * 1.6) / 100;

      // Check if crashed
      if (currentRound.crash_multiplier > 0) {
        const crashMult = multiplierToNumber(currentRound.crash_multiplier);
        if (multiplier >= crashMult) {
          setIsFlying(false);
          setCurrentMultiplier(crashMult);
          return;
        }
      }

      setCurrentMultiplier(multiplier);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isFlying, currentRound, multiplierToNumber]);

  // Fetch current round on mount and poll for updates (optimized to prevent unnecessary re-renders)
  useEffect(() => {
    fetchCurrentRound();

    // Poll for round updates every 2 seconds
    // Only updates if round actually changed (by ID or status)
    const interval = setInterval(() => {
      fetchCurrentRound();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchCurrentRound]);

  // Fetch pool on mount
  useEffect(() => {
    fetchPool();

    // Refresh pool every 10 seconds
    const interval = setInterval(fetchPool, 10000);
    return () => clearInterval(interval);
  }, [fetchPool]);

  return {
    currentRound,
    currentMultiplier,
    isFlying,
    userBet,
    pool,
    pastRounds,
    loading,
    error,
    placeBet,
    cashOut,
    fetchRoundDetails,
    initializeFirstRound,
    betAmount,
    setBetAmount,
    autoBetEnabled,
    setAutoBetEnabled,
    autoCashOutEnabled,
    setAutoCashOutEnabled,
    autoCashOutMultiplier,
    setAutoCashOutMultiplier,
    formatXLM,
    multiplierToNumber,
  };
};
