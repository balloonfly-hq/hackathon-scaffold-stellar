import { describe, expect, it } from "vitest";
import { formatAmount } from "./formatAmount";

describe("formatAmount", () => {
  it("formats whole numbers with at least one decimal digit", () => {
    expect(formatAmount(1)).toBe("1.0");
    expect(formatAmount(0)).toBe("0.0");
    expect(formatAmount(42)).toBe("42.0");
  });

  it("preserves one-decimal values", () => {
    expect(formatAmount(1.5)).toBe("1.5");
    expect(formatAmount(0.1)).toBe("0.1");
  });

  it("preserves values with up to seven decimal places", () => {
    expect(formatAmount(0.1234567)).toBe("0.1234567");
    expect(formatAmount(1.0000001)).toBe("1.0000001");
    expect(formatAmount(5.12345)).toBe("5.12345");
  });

  it("rounds eight-decimal values to seven decimal places", () => {
    // 0.12345678 rounds up to 0.1234568
    expect(formatAmount(0.12345678)).toBe("0.1234568");
    // 0.12345672 rounds down to 0.1234567
    expect(formatAmount(0.12345672)).toBe("0.1234567");
  });

  it("applies en-US thousands separators", () => {
    expect(formatAmount(1000)).toBe("1,000.0");
    expect(formatAmount(1234567.89)).toBe("1,234,567.89");
    expect(formatAmount(1000000)).toBe("1,000,000.0");
  });

  it("handles negative inputs and negative zero correctly", () => {
    expect(formatAmount(-1)).toBe("-1.0");
    expect(formatAmount(-0.5)).toBe("-0.5");
    expect(formatAmount(-1234.56789)).toBe("-1,234.56789");
    expect(formatAmount(-0)).toBe("-0.0");
  });
});
