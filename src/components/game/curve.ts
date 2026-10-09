export interface Point {
  x: number;
  y: number;
}

export interface CurvePosition extends Point {
  angle: number;
}

export const CURVE_CONTROL_POINTS = {
  startX: 0,
  startY: 100,
  endX: 100,
  endY: 0,
  cp1X: 25,
  cp1Y: 75,
  cp2X: 65,
  cp2Y: 15,
} as const;

export const START_X = CURVE_CONTROL_POINTS.startX;
export const START_Y = CURVE_CONTROL_POINTS.startY;
export const END_X = CURVE_CONTROL_POINTS.endX;
export const END_Y = CURVE_CONTROL_POINTS.endY;
export const CP1_X = CURVE_CONTROL_POINTS.cp1X;
export const CP1_Y = CURVE_CONTROL_POINTS.cp1Y;
export const CP2_X = CURVE_CONTROL_POINTS.cp2X;
export const CP2_Y = CURVE_CONTROL_POINTS.cp2Y;

/**
 * Calculates cubic bezier point (x, y) at parameter t in [0, 1].
 */
export function pointOnCurve(t: number): Point {
  const { startX, startY, endX, endY, cp1X, cp1Y, cp2X, cp2Y } =
    CURVE_CONTROL_POINTS;

  const x =
    Math.pow(1 - t, 3) * startX +
    3 * Math.pow(1 - t, 2) * t * cp1X +
    3 * (1 - t) * Math.pow(t, 2) * cp2X +
    Math.pow(t, 3) * endX;

  const y =
    Math.pow(1 - t, 3) * startY +
    3 * Math.pow(1 - t, 2) * t * cp1Y +
    3 * (1 - t) * Math.pow(t, 2) * cp2Y +
    Math.pow(t, 3) * endY;

  return { x, y };
}

/**
 * Calculates curve tangent rotation angle in degrees at parameter t in [0, 1].
 */
export function tangentAngle(t: number): number {
  const { startX, startY, endX, endY, cp1X, cp1Y, cp2X, cp2Y } =
    CURVE_CONTROL_POINTS;

  const dx =
    3 * Math.pow(1 - t, 2) * (cp1X - startX) +
    6 * (1 - t) * t * (cp2X - cp1X) +
    3 * Math.pow(t, 2) * (endX - cp2X);

  const dy =
    3 * Math.pow(1 - t, 2) * (cp1Y - startY) +
    6 * (1 - t) * t * (cp2Y - cp1Y) +
    3 * Math.pow(t, 2) * (endY - cp2Y);

  return Math.atan2(-dy, dx) * (180 / Math.PI);
}

/**
 * Computes position and tangent angle for balloon tracking along curve.
 */
export function getPositionOnCurve(t: number): CurvePosition {
  const { x, y } = pointOnCurve(t);
  const angle = tangentAngle(t);
  return { x, y, angle };
}
