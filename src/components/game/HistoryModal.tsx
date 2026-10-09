import React, { useEffect, useRef } from "react";

interface HistoryItem {
  roundId: bigint;
  multiplier: number;
  timestamp: bigint;
}

interface HistoryModalProps {
  history: HistoryItem[];
  onClose: () => void;
  onRoundClick?: (roundId: bigint) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  onClose,
  onRoundClick,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElement.current =
      document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [onClose]);

  const getMultiplierColor = (mult: number) => {
    if (mult < 2.0) return { bg: "rgba(59, 130, 246, 0.2)", text: "#3B82F6" };
    if (mult < 10.0) return { bg: "rgba(168, 85, 247, 0.2)", text: "#A855F7" };
    return { bg: "rgba(239, 68, 68, 0.2)", text: "#EF4444" };
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          zIndex: 1100,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "80vh",
          background: "#1e2130",
          borderRadius: "12px",
          border: "1px solid #2a2d3e",
          zIndex: 1101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #2a2d3e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            id="history-modal-title"
            style={{
              margin: 0,
              color: "#fff",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Round History
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close round history dialog"
            style={{
              background: "transparent",
              border: "none",
              color: "#8b8fa3",
              cursor: "pointer",
              fontSize: "24px",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#8b8fa3";
            }}
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                width: "100%",
                textAlign: "center",
                color: "#8b8fa3",
                padding: "40px 0",
              }}
            >
              No round history available
            </div>
          ) : (
            history.map((item) => {
              const styles = getMultiplierColor(item.multiplier);
              const roundKey = item.roundId.toString();
              return (
                <button
                  type="button"
                  key={roundKey}
                  onClick={() => {
                    onRoundClick?.(item.roundId);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRoundClick?.(item.roundId);
                      onClose();
                    }
                  }}
                  aria-label={`Round ${roundKey}: ${item.multiplier.toFixed(2)}x`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: styles.bg,
                    color: styles.text,
                    border:
                      item.multiplier >= 10
                        ? "2px solid #EF4444"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.08)";
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
        </div>
      </div>
    </>
  );
};

export default HistoryModal;
