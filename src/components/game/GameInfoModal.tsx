import React, { useState, useEffect, useRef } from "react";
import { Pool } from "../../contexts/BalloonFlyContext";

interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool | null;
  formatXLM: (stroops: bigint) => string;
}

const GameInfoModal: React.FC<GameInfoModalProps> = ({
  isOpen,
  onClose,
  pool,
  formatXLM,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Escape key handler, focus trap, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current =
      document.activeElement as HTMLElement | null;

    // Focus close button on open
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
  }, [isOpen, onClose]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  };

  if (!isOpen) return null;

  const HOUSE_EDGE_BPS = 300; // 3% = 300 basis points
  const gameMargin = HOUSE_EDGE_BPS / 100;

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
          zIndex: 998,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-info-modal-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "500px",
          background: "#1e2130",
          borderRadius: "12px",
          border: "1px solid #2a2d3e",
          zIndex: 999,
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
            id="game-info-modal-title"
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Game Information
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close game information dialog"
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
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Game Margin */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#8b8fa3",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Game Margin
            </label>
            <div
              style={{
                background: "#252837",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#8b5cf6",
                border: "1px solid #2a2d3e",
              }}
            >
              {gameMargin}%
            </div>
          </div>

          {/* House Earnings */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#8b8fa3",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              House Earnings
            </label>
            <div
              style={{
                background: "#252837",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#10b981",
                border: "1px solid #2a2d3e",
              }}
            >
              {pool ? formatXLM(pool.total_house_earnings) : "0.00"} XLM
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleFullscreen}
            style={{
              width: "100%",
              padding: "14px",
              background: isFullscreen
                ? "rgba(239, 68, 68, 0.2)"
                : "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              border: `1px solid ${isFullscreen ? "#EF4444" : "transparent"}`,
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isFullscreen) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(139, 92, 246, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isFullscreen) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {isFullscreen ? (
              <>
                <span>⤓</span>
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <span>⤢</span>
                <span>Expand Game</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #2a2d3e",
            textAlign: "center",
            fontSize: "11px",
            color: "#8b8fa3",
          }}
        >
          Powered by <strong style={{ color: "#8b5cf6" }}>Stellar</strong>
        </div>
      </div>
    </>
  );
};

export default GameInfoModal;
