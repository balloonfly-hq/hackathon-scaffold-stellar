import { describe, expect, it } from "vitest";
import { clampProgress, getPositionOnCurve } from "./AnimatedBalloon";

describe("AnimatedBalloon position calculation and safety guards", () => {
  it("clamps negative progress to 0 and returns finite position", () => {
    const pos = getPositionOnCurve(-1);
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(100);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.angle)).toBe(true);
  });

  it("clamps progress > 1 to 1 and returns finite position", () => {
    const pos = getPositionOnCurve(2);
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(0);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.angle)).toBe(true);
  });

  it("guards against NaN progress and falls back to t=0", () => {
    const pos = getPositionOnCurve(NaN);
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(100);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.angle)).toBe(true);
  });

  it("guards against Infinity and -Infinity", () => {
    const posInf = getPositionOnCurve(Infinity);
    const posNegInf = getPositionOnCurve(-Infinity);
    expect(posInf.x).toBe(0);
    expect(posInf.y).toBe(100);
    expect(posNegInf.x).toBe(0);
    expect(posNegInf.y).toBe(100);
  });

  it("produces strictly finite numbers across various sample values", () => {
    const testValues = [-100, -0.5, 0, 0.05, 0.25, 0.5, 0.85, 1, 1.5, 100];
    for (const val of testValues) {
      const pos = getPositionOnCurve(val);
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isFinite(pos.angle)).toBe(true);
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(100);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(100);
    }
  });

  it("clampProgress helper behaves predictably", () => {
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(0.42)).toBeCloseTo(0.42, 5);
    expect(clampProgress(5)).toBe(1);
    expect(clampProgress(NaN)).toBe(0);
  });
});
