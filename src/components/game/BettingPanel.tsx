import React, { useState, useRef, useEffect, useCallback } from "react";

interface BettingPanelProps {
  isActive?: boolean;
  onBet?: (amount: number) => void;
  onCashOut?: () => void;
  loading?: boolean;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  currentMultiplier: number;
  autoBetEnabled: boolean;
  onAutoBetEnabledChange: (enabled: boolean) => void;
  autoCashOutEnabled: boolean;
  onAutoCashOutEnabledChange: (enabled: boolean) => void;
  autoCashOutMultiplier: number;
  onAutoCashOutMultiplierChange: (mult: number) => void;
}

const BettingPanel: React.FC<BettingPanelProps> = React.memo(
  ({
    isActive = false,
    onBet,
    onCashOut,
    loading = false,
    betAmount,
    onBetAmountChange,
    currentMultiplier,
    autoBetEnabled,
    onAutoBetEnabledChange,
    autoCashOutEnabled,
    onAutoCashOutEnabledChange,
    autoCashOutMultiplier,
    onAutoCashOutMultiplierChange,
  }) => {
    const [activeTab, setActiveTabState] = useState<"manual" | "auto">(() => {
      const saved = localStorage.getItem("balloonfly_bet_tab");
      if (saved && (saved === "manual" || saved === "auto")) {
        return saved;
      }
      return "manual";
    });

    const setActiveTab = useCallback((tab: "manual" | "auto") => {
      setActiveTabState(tab);
      localStorage.setItem("balloonfly_bet_tab", tab);
    }, []);

    // Editable amount input: raw text while focused, committed value
    // renders formatted. Commits go through the same >= 1.0 clamp as
    // the +/- and quick-amount buttons; non-numeric input is rejected.
    const [amountText, setAmountText] = useState(betAmount.toFixed(2));
    const amountEditingRef = useRef(false);

    useEffect(() => {
      if (!amountEditingRef.current) {
        setAmountText(betAmount.toFixed(2));
      }
    }, [betAmount]);

    const handleAmountTextChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setAmountText(text);
        const parsed = parseFloat(text);
        if (!isNaN(parsed)) {
          onBetAmountChange(parsed);
        }
      },
      [onBetAmountChange],
    );

    const quickAmounts = [10, 20, 50, 100];

    const handleIncrement = useCallback(() => {
      onBetAmountChange(betAmount + 1.0);
    }, [onBetAmountChange, betAmount]);

    const handleDecrement = useCallback(() => {
      onBetAmountChange(Math.max(1.0, betAmount - 1.0));
    }, [onBetAmountChange, betAmount]);

    const handleQuickAmount = useCallback(
      (amount: number) => {
        onBetAmountChange(amount);
      },
      [onBetAmountChange],
    );

    const handleAction = useCallback(() => {
      if (isActive && onCashOut) {
        onCashOut();
      } else if (onBet) {
        onBet(betAmount);
      }
    }, [isActive, onBet, onCashOut, betAmount]);

    // Quick amount buttons use same padding in both tabs
    const buttonPadding = "10px";

    return (
      <div
        style={{
          flex: 1,
          background: "#252837",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          minHeight: "0",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            background: "#1e2130",
            padding: "4px",
            gap: "4px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: activeTab === "manual" ? "#252837" : "transparent",
              border: "none",
              color: activeTab === "manual" ? "#fff" : "#8b8fa3",
              cursor: "pointer",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Bet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("auto")}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: activeTab === "auto" ? "#252837" : "transparent",
              border: "none",
              color: activeTab === "auto" ? "#fff" : "#8b8fa3",
              cursor: "pointer",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Auto
          </button>
        </div>

        {/* Main Content - Side by Side Layout */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flex: 1,
            alignItems: "stretch",
          }}
        >
          {/* Left Section - Bet Amount and Controls */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {/* Spinner - No label above */}
            <div
              style={{
                background: "#1e2130",
                borderRadius: "8px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                border: "2px solid #3a3f5c",
              }}
            >
              <button
                type="button"
                onClick={handleDecrement}
                style={{
                  width: "24px",
                  height: "24px",
                  background: "#3a3f5c",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "20px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#8b5cf6";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3a3f5c";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                −
              </button>
              <input
                type="text"
                value={amountText}
                inputMode="decimal"
                onChange={handleAmountTextChange}
                onFocus={() => {
                  amountEditingRef.current = true;
                }}
                onBlur={() => {
                  amountEditingRef.current = false;
                  setAmountText(betAmount.toFixed(2));
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: 700,
                  flex: 1,
                  textAlign: "center",
                  outline: "none",
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={handleIncrement}
                style={{
                  width: "24px",
                  height: "24px",
                  background: "#3a3f5c",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "20px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#8b5cf6";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3a3f5c";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                +
              </button>
            </div>

            {/* Quick Amount Buttons - Show in BOTH modes, different sizes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  style={{
                    padding: buttonPadding,
                    background: "#3a3f5c",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#8b5cf6";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#3a3f5c";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Right Section - Action Button */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-start",
              minWidth: 0,
            }}
          >
            <button
              type="button"
              onClick={handleAction}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                height: "135px",
                background: isActive
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                animation: isActive ? "pulse 1s ease-in-out infinite" : "none",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive && !loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(16, 185, 129, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {loading
                  ? "Processing..."
                  : isActive
                    ? "💰 Cash Out Now!"
                    : "Bet"}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                {isActive
                  ? `${(betAmount * currentMultiplier).toFixed(2)} XLM`
                  : `${betAmount.toFixed(2)} XLM`}
              </span>
            </button>
          </div>
        </div>

        {activeTab === "auto" && (
          <div style={{ marginTop: "10px" }}>
            {/* Auto Settings - Only show when Auto tab is selected */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "12px",
              }}
            >
              {/* Auto Bet Toggle */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  background: "#1e2130",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  Automatic bet
                </span>
                <button
                  type="button"
                  onClick={() => onAutoBetEnabledChange(!autoBetEnabled)}
                  style={{
                    width: "48px",
                    height: "24px",
                    background: autoBetEnabled ? "#10b981" : "#3a3f5c",
                    border: "none",
                    borderRadius: "12px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    padding: "2px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#fff",
                      borderRadius: "50%",
                      transition: "transform 0.3s",
                      transform: autoBetEnabled
                        ? "translateX(24px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              {/* Auto Cash Out Toggle */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  background: "#1e2130",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  Auto Cash Out
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onAutoCashOutEnabledChange(!autoCashOutEnabled)
                    }
                    style={{
                      width: "48px",
                      height: "24px",
                      background: autoCashOutEnabled ? "#10b981" : "#3a3f5c",
                      border: "none",
                      borderRadius: "12px",
                      position: "relative",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      padding: "2px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        background: "#fff",
                        borderRadius: "50%",
                        transition: "transform 0.3s",
                        transform: autoCashOutEnabled
                          ? "translateX(24px)"
                          : "translateX(0)",
                      }}
                    />
                  </button>
                  <input
                    type="number"
                    min="1.0"
                    max="1000.0"
                    step="0.01"
                    value={autoCashOutMultiplier.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 1.0) {
                        onAutoCashOutMultiplierChange(value);
                      }
                    }}
                    disabled={!autoCashOutEnabled}
                    style={{
                      width: "60px",
                      padding: "6px 8px",
                      background: autoCashOutEnabled ? "#1e2130" : "#2a2d3e",
                      border: "1px solid #3a3f5c",
                      borderRadius: "6px",
                      color: autoCashOutEnabled ? "#fff" : "#8b8fa3",
                      fontSize: "13px",
                      fontWeight: 600,
                      textAlign: "center",
                      outline: "none",
                      cursor: autoCashOutEnabled ? "text" : "not-allowed",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders unless props actually changed
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.loading === nextProps.loading &&
      prevProps.betAmount === nextProps.betAmount &&
      prevProps.currentMultiplier === nextProps.currentMultiplier &&
      prevProps.autoBetEnabled === nextProps.autoBetEnabled &&
      prevProps.autoCashOutEnabled === nextProps.autoCashOutEnabled &&
      prevProps.autoCashOutMultiplier === nextProps.autoCashOutMultiplier
    );
  },
);

BettingPanel.displayName = "BettingPanel";

export default BettingPanel;
