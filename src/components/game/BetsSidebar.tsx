import React, { useState, useMemo, useRef, useEffect } from "react";
import { useBalloonFlyContext } from "../../contexts/BalloonFlyContext";
import { RoundStatus } from "../../hooks/useBalloonFly";

const BetsSidebar: React.FC = () => {
  // Use ref to persist tab state across re-renders
  const tabStateRef = useRef<{
    activeTab: "bets" | "previous" | "top";
    topSortBy: "multiplier" | "payout" | "rounds";
    topTimeFilter: "day" | "month" | "year";
  }>({
    activeTab: "bets",
    topSortBy: "multiplier",
    topTimeFilter: "day",
  });

  // Initialize state from ref (only on mount)
  const [activeTab, setActiveTabState] = useState<"bets" | "previous" | "top">(
    () => {
      // Try to restore from localStorage first
      const saved = localStorage.getItem("balloonfly_active_tab");
      if (saved && ["bets", "previous", "top"].includes(saved)) {
        tabStateRef.current.activeTab = saved as "bets" | "previous" | "top";
        return saved as "bets" | "previous" | "top";
      }
      return tabStateRef.current.activeTab;
    },
  );

  const [topSortBy, setTopSortByState] = useState<
    "multiplier" | "payout" | "rounds"
  >(() => {
    const saved = localStorage.getItem("balloonfly_top_sort");
    if (saved && ["multiplier", "payout", "rounds"].includes(saved)) {
      tabStateRef.current.topSortBy = saved as
        | "multiplier"
        | "payout"
        | "rounds";
      return saved as "multiplier" | "payout" | "rounds";
    }
    return tabStateRef.current.topSortBy;
  });

  const [topTimeFilter, setTopTimeFilterState] = useState<
    "day" | "month" | "year"
  >(() => {
    const saved = localStorage.getItem("balloonfly_top_time");
    if (saved && ["day", "month", "year"].includes(saved)) {
      tabStateRef.current.topTimeFilter = saved as "day" | "month" | "year";
      return saved as "day" | "month" | "year";
    }
    return tabStateRef.current.topTimeFilter;
  });

  // Wrapper functions that update both state and ref
  const setActiveTab = (tab: "bets" | "previous" | "top") => {
    tabStateRef.current.activeTab = tab;
    setActiveTabState(tab);
    localStorage.setItem("balloonfly_active_tab", tab);
  };

  const setTopSortBy = (sort: "multiplier" | "payout" | "rounds") => {
    tabStateRef.current.topSortBy = sort;
    setTopSortByState(sort);
    localStorage.setItem("balloonfly_top_sort", sort);
  };

  const setTopTimeFilter = (filter: "day" | "month" | "year") => {
    tabStateRef.current.topTimeFilter = filter;
    setTopTimeFilterState(filter);
    localStorage.setItem("balloonfly_top_time", filter);
  };

  // Sync ref with state on every render to ensure consistency
  useEffect(() => {
    tabStateRef.current.activeTab = activeTab;
    tabStateRef.current.topSortBy = topSortBy;
    tabStateRef.current.topTimeFilter = topTimeFilter;
  }, [activeTab, topSortBy, topTimeFilter]);

  const {
    pool,
    formatXLM,
    currentRound,
    userBet,
    pastRounds,
    multiplierToNumber,
  } = useBalloonFlyContext();

  // Get the most recent ended round for Previous tab
  const mostRecentRound = useMemo(() => {
    return pastRounds
      .filter((r) => r.status === RoundStatus.Ended)
      .sort(
        (a, b) =>
          Number(b.ended_at || b.started_at || b.created_at) -
          Number(a.ended_at || a.started_at || a.created_at),
      )[0];
  }, [pastRounds]);

  // Get rounds data for Top tab with filters
  const getTopRoundsData = () => {
    let filtered = pastRounds.filter(
      (r) => r.status === RoundStatus.Ended && r.total_payout > 0n,
    );

    // Time filter
    const now = Date.now();
    const timeFilters = {
      day: 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };

    filtered = filtered.filter((round) => {
      const roundTime =
        Number(round.ended_at || round.started_at || round.created_at) * 1000;
      return now - roundTime <= timeFilters[topTimeFilter];
    });

    // Sort
    filtered.sort((a, b) => {
      if (topSortBy === "multiplier") {
        const multA = multiplierToNumber(a.crash_multiplier);
        const multB = multiplierToNumber(b.crash_multiplier);
        return multB - multA;
      } else if (topSortBy === "payout") {
        const payoutA = Number(a.total_payout);
        const payoutB = Number(b.total_payout);
        return payoutB - payoutA;
      } else {
        // rounds - by ID (most recent first)
        return Number(b.id) - Number(a.id);
      }
    });

    return filtered.slice(0, 10);
  };

  const topRoundsData = activeTab === "top" ? getTopRoundsData() : [];

  const getMultiplierColor = (mult: number | null) => {
    if (!mult) return "";
    if (mult < 2.0) return "#3B82F6";
    if (mult < 10.0) return "#A855F7";
    return "#EF4444";
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  const maskAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 1)}***${address.slice(-1)}`;
  };

  return (
    <div
      style={{
        width: "340px",
        background: "#1e2130",
        borderRight: "1px solid #2a2d3e",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Bets sidebar views"
        style={{
          display: "flex",
          background: "#252837",
          padding: "8px",
          gap: "4px",
        }}
      >
        {(["bets", "previous", "top"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: activeTab === tab ? "#1e2130" : "transparent",
              border: "none",
              color: activeTab === tab ? "#fff" : "#8b8fa3",
              cursor: "pointer",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s",
              outline: "none",
            }}
          >
            {tab === "bets" ? "Bets" : tab === "previous" ? "Previous" : "Top"}
          </button>
        ))}
      </div>

      {/* Total Win Widget - Only show for Bets tab */}
      {activeTab === "bets" && (
        <div
          style={{
            background: "linear-gradient(135deg, #2d1b4e 0%, #1e1535 100%)",
            padding: "16px",
            margin: "12px",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              {["🎈", "🎯", "⭐"].map((emoji) => (
                <div
                  key={emoji}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "2px solid #1e2130",
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    marginLeft: i > 0 ? "-10px" : "0",
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>
              {pool ? formatXLM(pool.total_payouts) : "0.00"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#8b8fa3",
            }}
          >
            <span>
              <strong style={{ color: "#fff" }}>
                {currentRound?.bet_count || 0}
              </strong>{" "}
              Bets
            </span>
            <span>Total Prize XLM</span>
          </div>
          <div
            style={{
              height: "4px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "2px",
              marginTop: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
                width: "60.9%",
                borderRadius: "2px",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      {/* Previous Tab: Round Result Header */}
      {activeTab === "previous" && mostRecentRound && (
        <div
          style={{
            background: "#252837",
            padding: "20px 16px",
            borderBottom: "1px solid #2a2d3e",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#8b8fa3",
              marginBottom: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Round Result
          </div>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#3B82F6",
              lineHeight: 1,
            }}
          >
            {multiplierToNumber(mostRecentRound.crash_multiplier).toFixed(2)}x
          </div>
        </div>
      )}

      {/* Top Tab: Filter Buttons */}
      {activeTab === "top" && (
        <div
          style={{
            background: "#252837",
            padding: "12px 16px",
            borderBottom: "1px solid #2a2d3e",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Sort by row */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["multiplier", "payout", "rounds"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setTopSortBy(sort)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  background:
                    topSortBy === sort
                      ? "rgba(139, 92, 246, 0.2)"
                      : "transparent",
                  border: `1px solid ${topSortBy === sort ? "#8b5cf6" : "#2a2d3e"}`,
                  borderRadius: "6px",
                  color: topSortBy === sort ? "#8b5cf6" : "#8b8fa3",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {sort === "multiplier"
                  ? "X"
                  : sort === "payout"
                    ? "Prize"
                    : "Rounds"}
              </button>
            ))}
          </div>
          {/* Time filter row */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["day", "month", "year"] as const).map((time) => (
              <button
                key={time}
                onClick={() => setTopTimeFilter(time)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  background:
                    topTimeFilter === time
                      ? "rgba(139, 92, 246, 0.2)"
                      : "transparent",
                  border: `1px solid ${topTimeFilter === time ? "#8b5cf6" : "#2a2d3e"}`,
                  borderRadius: "6px",
                  color: topTimeFilter === time ? "#8b5cf6" : "#8b8fa3",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {time === "day" ? "Day" : time === "month" ? "Month" : "Year"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List Header - Dynamic based on tab */}
      {activeTab !== "previous" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              activeTab === "bets"
                ? "2fr 1fr 1fr 1fr"
                : "auto 1fr 1fr 1fr 1fr 1fr auto",
            padding: "12px 16px",
            background: "#252837",
            fontSize: "11px",
            color: "#8b8fa3",
            textTransform: "uppercase",
            fontWeight: 600,
            gap: "8px",
          }}
        >
          {activeTab === "bets" ? (
            <>
              <span>Player</span>
              <span>Bet</span>
              <span>X</span>
              <span>Prize</span>
            </>
          ) : (
            <>
              <span></span>
              <span>Player</span>
              <span>Date</span>
              <span>Bet</span>
              <span>Prize</span>
              <span>Result</span>
              <span></span>
            </>
          )}
        </div>
      )}

      {/* Previous Tab: Player List Header */}
      {activeTab === "previous" && mostRecentRound && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "12px 16px",
            background: "#252837",
            fontSize: "11px",
            color: "#8b8fa3",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span>Player</span>
          <span>Bet</span>
          <span>X</span>
          <span>Prize</span>
        </div>
      )}

      {/* List Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {activeTab === "bets" ? (
          // Bets tab - show user's bet
          !userBet ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#8b8fa3",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎈</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: "#fff",
                }}
              >
                No bets yet
              </div>
              <div style={{ fontSize: "12px" }}>
                Be the first to place a bet!
              </div>
            </div>
          ) : (
            (() => {
              const bet = userBet;
              const multiplier =
                bet.cash_out_multiplier > 0n
                  ? Number(bet.cash_out_multiplier) / 100
                  : null;
              const payout =
                bet.payout > 0n ? Number(bet.payout) / 10_000_000 : null;
              const playerAddress = bet.player;
              const shortAddress =
                playerAddress.length > 12
                  ? `${playerAddress.slice(0, 6)}...${playerAddress.slice(-6)}`
                  : playerAddress;

              // Generate avatar emoji from address
              const avatars = ["🎈", "🎯", "⭐", "💎", "🚀", "🌟", "🎲", "🏆"];
              const avatarIndex =
                parseInt(playerAddress.slice(-2) || "0", 16) % avatars.length;
              const avatar = avatars[avatarIndex];

              return (
                <div
                  key={bet.id.toString()}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    padding: "12px 16px",
                    borderBottom: "1px solid #252837",
                    alignItems: "center",
                    background: payout
                      ? "rgba(124, 58, 237, 0.05)"
                      : "transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      {avatar}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#fff",
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      {shortAddress}
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#8b8fa3" }}>
                    {formatXLM(bet.amount)}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: multiplier
                        ? getMultiplierColor(multiplier)
                        : "#8b8fa3",
                      fontWeight: multiplier ? 600 : 400,
                    }}
                  >
                    {multiplier ? `${multiplier.toFixed(2)}x` : ""}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: payout ? "#10b981" : "#8b8fa3",
                      fontWeight: payout ? 600 : 400,
                    }}
                  >
                    {payout ? `${payout.toFixed(2)}` : ""}
                  </span>
                </div>
              );
            })()
          )
        ) : activeTab === "previous" ? (
          // Previous tab - show round result and players
          !mostRecentRound ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#8b8fa3",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📊</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: "#fff",
                }}
              >
                No previous rounds yet
              </div>
              <div style={{ fontSize: "12px" }}>
                Rounds will appear here after they end
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 16px",
                textAlign: "center",
                color: "#8b8fa3",
                fontSize: "12px",
              }}
            >
              {/* Note: Individual player bets are not available from contract */}
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ color: "#fff" }}>
                  {mostRecentRound.bet_count}
                </strong>{" "}
                players participated
              </div>
              <div>
                Total payout:{" "}
                <strong style={{ color: "#10b981" }}>
                  {formatXLM(mostRecentRound.total_payout)} XLM
                </strong>
              </div>
            </div>
          )
        ) : // Top tab - show top rounds with detailed info
        topRoundsData.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#8b8fa3",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏆</div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "4px",
                color: "#fff",
              }}
            >
              No top rounds yet
            </div>
            <div style={{ fontSize: "12px" }}>
              Top rounds will appear here based on{" "}
              {topSortBy === "multiplier"
                ? "multipliers"
                : topSortBy === "payout"
                  ? "payouts"
                  : "rounds"}
            </div>
          </div>
        ) : (
          topRoundsData.map((round) => {
            const crashMult = multiplierToNumber(round.crash_multiplier);
            const payout = Number(round.total_payout) / 10_000_000;
            const date = round.ended_at
              ? formatDate(round.ended_at)
              : round.started_at
                ? formatDate(round.started_at)
                : formatDate(round.created_at);

            // Generate avatar from round ID
            const avatars = [
              "🎈",
              "🎯",
              "⭐",
              "💎",
              "🚀",
              "🌟",
              "🎲",
              "🏆",
              "🐕",
              "🌿",
              "🦁",
              "🌙",
            ];
            const avatarIndex = Number(round.id) % avatars.length;
            const avatar = avatars[avatarIndex];

            // Mock player address from round ID (since we don't have individual bets)
            const mockAddress = `R${round.id.toString().slice(-6)}`;
            const maskedAddress = maskAddress(mockAddress);

            return (
              <div
                key={round.id.toString()}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr 1fr 1fr 1fr 1fr auto",
                  padding: "12px 16px",
                  borderBottom: "1px solid #252837",
                  alignItems: "center",
                  background:
                    payout > 0 ? "rgba(124, 58, 237, 0.05)" : "transparent",
                  transition: "background 0.2s",
                  gap: "8px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  {avatar}
                </div>

                {/* Player (masked) */}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#fff",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {maskedAddress}
                </span>

                {/* Date */}
                <span style={{ fontSize: "12px", color: "#8b8fa3" }}>
                  {date}
                </span>

                {/* Bet (average bet amount) */}
                <span style={{ fontSize: "12px", color: "#8b8fa3" }}>
                  {round.bet_count > 0
                    ? formatXLM(
                        round.total_bet_amount / BigInt(round.bet_count),
                      )
                    : "0.00"}
                </span>

                {/* Prize */}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#10b981",
                    fontWeight: 600,
                  }}
                >
                  {formatXLM(round.total_payout)}
                </span>

                {/* Result (crash multiplier) - Pink */}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#ec4899",
                    fontWeight: 600,
                  }}
                >
                  {crashMult.toFixed(2)}x
                </span>

                {/* Icons */}
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  <span style={{ fontSize: "14px", cursor: "pointer" }}>
                    💬
                  </span>
                  <span style={{ fontSize: "14px", cursor: "pointer" }}>
                    🛡️
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          background: "#252837",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #2a2d3e",
        }}
      >
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid #3a3f5c",
            borderRadius: "6px",
            color: "#8b8fa3",
            fontSize: "11px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🔒 Provably Fair Game
        </button>
        <span style={{ color: "#8b8fa3", fontSize: "11px" }}>
          Powered by Stellar
        </span>
      </div>
    </div>
  );
};

export default BetsSidebar;
