import React from "react";
import {
  CP1_X,
  CP1_Y,
  CP2_X,
  CP2_Y,
  pointOnCurve,
  START_X,
  START_Y,
} from "./curve";

interface ProgressCurveProps {
  progress: number; // 0-1
  color: string;
}

const ProgressCurve: React.FC<ProgressCurveProps> = ({ progress, color }) => {
  const currentPoint = pointOnCurve(progress);

  // Create path of curve up to current point (filled)
  const pathData = `M ${START_X} ${START_Y} 
                    C ${CP1_X} ${CP1_Y}, ${CP2_X} ${CP2_Y}, ${currentPoint.x} ${currentPoint.y}
                    L ${currentPoint.x} ${START_Y}
                    Z`;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none",
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="50%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id="curveGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={pathData} fill="url(#curveGradient)" filter="url(#curveGlow)" />
      {/* Linha da curva (borda) */}
      <path
        d={`M ${START_X} ${START_Y} C ${CP1_X} ${CP1_Y}, ${CP2_X} ${CP2_Y}, ${currentPoint.x} ${currentPoint.y}`}
        fill="none"
        stroke={color}
        strokeWidth="0.3"
        strokeOpacity="0.8"
      />
    </svg>
  );
};

export default ProgressCurve;
