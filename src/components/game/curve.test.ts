import { describe, expect, it } from "vitest";
import {
  CURVE_CONTROL_POINTS,
  getPositionOnCurve,
  pointOnCurve,
  tangentAngle,
} from "./curve";

describe("curve math utilities", () => {
  it("evaluates start position at t = 0", () => {
    const point = pointOnCurve(0);
    expect(point.x).toBe(CURVE_CONTROL_POINTS.startX);
    expect(point.y).toBe(CURVE_CONTROL_POINTS.startY);
  });

  it("evaluates end position at t = 1", () => {
    const point = pointOnCurve(1);
    expect(point.x).toBe(CURVE_CONTROL_POINTS.endX);
    expect(point.y).toBe(CURVE_CONTROL_POINTS.endY);
  });

  it("evaluates midpoint strictly within bounds", () => {
    const point = pointOnCurve(0.5);
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(100);
    expect(point.y).toBeGreaterThan(0);
    expect(point.y).toBeLessThan(100);
  });

  it("computes tangentAngle and position combined", () => {
    const pos = getPositionOnCurve(0.5);
    const angle = tangentAngle(0.5);
    expect(pos.angle).toBe(angle);
    expect(Number.isFinite(pos.angle)).toBe(true);
  });

  it("produces identical points between pointOnCurve and getPositionOnCurve", () => {
    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
      const p1 = pointOnCurve(t);
      const p2 = getPositionOnCurve(t);
      expect(p1.x).toBeCloseTo(p2.x, 6);
      expect(p1.y).toBeCloseTo(p2.y, 6);
    }
  });
});
