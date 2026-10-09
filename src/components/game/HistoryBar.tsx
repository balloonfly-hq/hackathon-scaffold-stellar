import React, { useState, useRef } from "react";
import HistoryModal from "./HistoryModal";

interface HistoryItem {
  roundId: bigint;
  multiplier: number;
  timestamp: bigint;
}

interface HistoryBarProps {
  history?: HistoryItem[];
  onRoundClick?: (roundId: bigint) => void;
}

const HistoryBar: React.FC<HistoryBarProps> = ({
  history = [],
  onRoundClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(15);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const PAGE_INCREMENT = 15;
  const visibleHistory = history.slice(0, visibleLimit);
  const hasMore = history.length > visibleLimit;

  const handleLoadMore = () => {
    setVisibleLimit((prev) => Math.min(prev + PAGE_INCREMENT, history.length));
  };

  const handleResetLimit = () => {
    setVisibleLimit(15);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const getMultiplierColor = (mult: number) => {
    if (mult < 2.0)
      return {
        bg: "rgba(59, 130, 246, 0.2)",
        text: "#3B82F6",
        border: "1px solid rgba(59, 130, 246, 0.3)",
      };
    if (mult < 10.0)
      return {
        bg: "rgba(168, 85, 247, 0.2)",
        text: "#A855F7",
        border: "1px solid rgba(168, 85, 247, 0.3)",
      };
    return {
      bg: "rgba(239, 68, 68, 0.2)",
      text: "#EF4444",
      border: "2px solid #EF4444",
    };
  };

  return (
    <>
      <div
        style={{
          padding: "12px 16px",
          background: "#1e2130",
          borderBottom: "1px solid #2a2d3e",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Recent rounds history strip"
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            overflowX: "auto",
            flex: 1,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(139, 92, 246, 0.4) rgba(30, 33, 48, 0.2)",
          }}
        >
          {visibleHistory.length === 0 ? (
            <div
              style={{
                color: "#8b8fa3",
                fontSize: "13px",
                fontStyle: "italic",
              }}
            >
              No history available
            </div>
          ) : (
            visibleHistory.map((item) => {
              const styles = getMultiplierColor(item.multiplier);
              const roundKey = item.roundId.toString();
              return (
                <button
                  type="button"
                  key={roundKey}
                  onClick={() => onRoundClick?.(item.roundId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRoundClick?.(item.roundId);
                    }
                  }}
                  aria-label={`Round ${roundKey}: ${item.multiplier.toFixed(2)}x`}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: styles.bg,
                    color: styles.text,
                    border: styles.border,
                    flexShrink: 0,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.opacity = "0.85";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 2px #8b5cf6";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {item.multiplier.toFixed(2)}x
                </button>
              );
            })
          )}

          {/* Inline Load More Button within container flow */}
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              aria-label={`Load more rounds (${history.length - visibleLimit} remaining)`}
              title={`Load ${Math.min(PAGE_INCREMENT, history.length - visibleLimit)} more rounds`}
              style={{
                background: "rgba(139, 92, 246, 0.2)",
                border: "1px solid #8b5cf6",
                borderRadius: "6px",
                padding: "6px 12px",
                color: "#8b5cf6",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
                height: "32px",
                outline: "none",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139, 92, 246, 0.35)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 2px #8b5cf6";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              ⋯ +{Math.min(PAGE_INCREMENT, history.length - visibleLimit)}
            </button>
          )}

          {visibleLimit > 15 && (
            <button
              type="button"
              onClick={handleResetLimit}
              aria-label="Show latest 15 rounds only"
              title="Collapse history strip"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid #3a3d52",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
                height: "32px",
                outline: "none",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            >
              Show Less
            </button>
          )}
        </div>

        {/* Modal affordance for full history overview */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Open full history modal"
            title="Open full history modal"
            style={{
              background: "transparent",
              border: "1px solid #3a3d52",
              borderRadius: "6px",
              padding: "4px 8px",
              color: "#8b8fa3",
              cursor: "pointer",
              fontSize: "12px",
              flexShrink: 0,
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#8b5cf6";
              e.currentTarget.style.color = "#8b5cf6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3a3d52";
              e.currentTarget.style.color = "#8b8fa3";
            }}
          >
            All ({history.length})
          </button>
        )}
      </div>

      {/* Expanded History Modal */}
      {isModalOpen && (
        <HistoryModal
          history={history}
          onClose={() => setIsModalOpen(false)}
          onRoundClick={onRoundClick}
        />
      )}
    </>
  );
};

export default HistoryBar;
