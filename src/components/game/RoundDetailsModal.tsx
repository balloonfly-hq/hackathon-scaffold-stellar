import React, { useEffect, useRef } from "react";
import { Round } from "../../contexts/BalloonFlyContext";
import { Buffer } from "buffer";

interface RoundDetailsModalProps {
  round: Round | null;
  onClose: () => void;
}

const RoundDetailsModal: React.FC<RoundDetailsModalProps> = ({
  round,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!round) return;

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
  }, [round, onClose]);

  if (!round) return null;

  const multiplier = Number(round.crash_multiplier) / 100;
  const timestamp = round.ended_at
    ? new Date(Number(round.ended_at) * 1000).toLocaleTimeString()
    : "N/A";

  // Converter Buffer para hex string
  const serverSeedHash = Buffer.from(round.server_seed_hash).toString("hex");
  const clientSeeds = round.client_seeds.map((seed) =>
    Buffer.from(seed).toString("hex"),
  );

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
        aria-labelledby="round-details-modal-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh",
          background: "#1e2130",
          borderRadius: "12px",
          border: "1px solid #2a2d3e",
          zIndex: 1101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
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
          <div>
            <h3
              id="round-details-modal-title"
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              ROUND {round.id.toString()}
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  background:
                    multiplier < 2.0
                      ? "rgba(59, 130, 246, 0.3)"
                      : multiplier < 10.0
                        ? "rgba(168, 85, 247, 0.3)"
                        : "rgba(239, 68, 68, 0.3)",
                  border: multiplier >= 10 ? "2px solid #EF4444" : "none",
                  color:
                    multiplier < 2.0
                      ? "#3B82F6"
                      : multiplier < 10.0
                        ? "#A855F7"
                        : "#EF4444",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {multiplier.toFixed(2)}x
              </span>
              <span style={{ color: "#8b8fa3", fontSize: "12px" }}>
                {timestamp}
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close round details dialog"
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

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {/* Server Seed */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                color: "#8b8fa3",
                fontSize: "12px",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Server Seed (Hash):
            </h4>
            <div
              style={{
                background: "#252837",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#fff",
                fontFamily: "'Courier New', monospace",
                wordBreak: "break-all",
                border: "1px solid #2a2d3e",
              }}
            >
              {serverSeedHash}
            </div>
          </div>

          {/* Client Seeds */}
          {clientSeeds.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  color: "#8b8fa3",
                  fontSize: "12px",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Client Seeds ({clientSeeds.length}):
              </h4>
              {clientSeeds.map((seed) => (
                <div
                  key={`${round.id.toString()}-${seed}`}
                  style={{
                    background: "#252837",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    fontSize: "11px",
                    color: "#fff",
                    fontFamily: "'Courier New', monospace",
                    wordBreak: "break-all",
                    border: "1px solid #2a2d3e",
                  }}
                >
                  {seed}
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                color: "#8b8fa3",
                fontSize: "12px",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Result:
            </h4>
            <div
              style={{
                background: "#252837",
                padding: "16px",
                borderRadius: "6px",
                fontSize: "18px",
                color:
                  multiplier < 2.0
                    ? "#3B82F6"
                    : multiplier < 10.0
                      ? "#A855F7"
                      : "#EF4444",
                fontWeight: 700,
                textAlign: "center",
                border: "1px solid #2a2d3e",
              }}
            >
              {multiplier.toFixed(2)}x
            </div>
          </div>

          {/* Round Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "#252837",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #2a2d3e",
              }}
            >
              <div
                style={{
                  color: "#8b8fa3",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
              >
                Total Bets
              </div>
              <div style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>
                {round.bet_count}
              </div>
            </div>
            <div
              style={{
                background: "#252837",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #2a2d3e",
              }}
            >
              <div
                style={{
                  color: "#8b8fa3",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
              >
                Total Bet Amount
              </div>
              <div style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>
                {(Number(round.total_bet_amount) / 10_000_000).toFixed(2)} XLM
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div
            style={{
              padding: "12px",
              background: "rgba(139, 92, 246, 0.1)",
              borderRadius: "6px",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              fontSize: "11px",
              color: "#8b8fa3",
              textAlign: "center",
            }}
          >
            🔒 Provably Fair Game - All results are verifiable on-chain
          </div>
        </div>
      </div>
    </>
  );
};

export default RoundDetailsModal;
