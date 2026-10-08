import React, { createContext, useContext, ReactNode } from "react";
import { useBalloonFly } from "../hooks/useBalloonFly";
import type { Round, Bet, Pool, BetStatus, RoundStatus } from "../hooks/useBalloonFly";

interface BalloonFlyContextType {
  currentRound: Round | null;
  currentMultiplier: number;
  isFlying: boolean;
  userBet: Bet | null;
  pool: Pool | null;
  pastRounds: Round[];
  loading: boolean;
  error: string | null;
  placeBet: (amount: number) => Promise<void>;
  cashOut: () => Promise<void>;
  fetchRoundDetails: (roundId: bigint) => Promise<Round | null>;
  initializeFirstRound: () => Promise<void>;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  autoBetEnabled: boolean;
  setAutoBetEnabled: (enabled: boolean) => void;
  autoCashOutEnabled: boolean;
  setAutoCashOutEnabled: (enabled: boolean) => void;
  autoCashOutMultiplier: number;
  setAutoCashOutMultiplier: (mult: number) => void;
  formatXLM: (stroops: bigint) => string;
  multiplierToNumber: (mult: bigint) => number;
}

const BalloonFlyContext = createContext<BalloonFlyContextType | undefined>(undefined);

export const BalloonFlyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const balloonFlyState = useBalloonFly();

  return (
    <BalloonFlyContext.Provider value={balloonFlyState}>
      {children}
    </BalloonFlyContext.Provider>
  );
};

export const useBalloonFlyContext = () => {
  const context = useContext(BalloonFlyContext);
  if (context === undefined) {
    throw new Error("useBalloonFlyContext must be used within a BalloonFlyProvider");
  }
  return context;
};

// Re-export types
export type { Round, Bet, Pool, BetStatus, RoundStatus };
