import React, { useMemo, useCallback } from "react";
import BettingPanel from "./BettingPanel";
import { useBalloonFlyContext } from "../../contexts/BalloonFlyContext";
import { BetStatus } from "../../hooks/useBalloonFly";

const BettingControls: React.FC = () => {
  const {
    placeBet,
    cashOut,
    userBet,
    loading,
    error,
    isFlying,
    currentMultiplier,
    betAmount,
    setBetAmount,
    autoBetEnabled,
    setAutoBetEnabled,
    autoCashOutEnabled,
    setAutoCashOutEnabled,
    autoCashOutMultiplier,
    setAutoCashOutMultiplier,
  } = useBalloonFlyContext();

  // Memoize handlers to prevent re-renders of BettingPanel
  const handleBet1 = useCallback(
    (amount: number) => {
      void (async () => {
        try {
          await placeBet(amount);
        } catch (err) {
          console.error("Error placing bet:", err);
        }
      })();
    },
    [placeBet],
  );

  const handleBet2 = useCallback(
    (amount: number) => {
      void (async () => {
        try {
          await placeBet(amount);
        } catch (err) {
          console.error("Error placing bet:", err);
        }
      })();
    },
    [placeBet],
  );

  const handleCashOut1 = useCallback(() => {
    void (async () => {
      try {
        await cashOut();
      } catch (err) {
        console.error("Error cashing out:", err);
      }
    })();
  }, [cashOut]);

  const handleCashOut2 = useCallback(() => {
    void (async () => {
      try {
        await cashOut();
      } catch (err) {
        console.error("Error cashing out:", err);
      }
    })();
  }, [cashOut]);

  const hasActiveBet = useMemo(() => {
    return userBet && userBet.status === BetStatus.Active && isFlying;
  }, [userBet, isFlying]);

  const panelProps = {
    betAmount,
    onBetAmountChange: setBetAmount,
    currentMultiplier,
    autoBetEnabled,
    onAutoBetEnabledChange: setAutoBetEnabled,
    autoCashOutEnabled,
    onAutoCashOutEnabledChange: setAutoCashOutEnabled,
    autoCashOutMultiplier,
    onAutoCashOutMultiplierChange: setAutoCashOutMultiplier,
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "#1e2130",
        borderTop: "1px solid #2a2d3e",
      }}
    >
      {/* Error Message */}
      {error && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto 16px",
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #EF4444",
            borderRadius: "8px",
            color: "#EF4444",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "16px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <BettingPanel
          isActive={!!hasActiveBet}
          onBet={handleBet1}
          onCashOut={handleCashOut1}
          loading={loading}
          {...panelProps}
        />
        <BettingPanel
          isActive={!!hasActiveBet}
          onBet={handleBet2}
          onCashOut={handleCashOut2}
          loading={loading}
          {...panelProps}
        />
      </div>
    </div>
  );
};

export default BettingControls;
