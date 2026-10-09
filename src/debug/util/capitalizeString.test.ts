import { describe, expect, it } from "vitest";
import { capitalizeString } from "./capitalizeString";

describe("capitalizeString", () => {
  it("capitalizes lowercase initial character", () => {
    expect(capitalizeString("balloon")).toBe("Balloon");
    expect(capitalizeString("stellar")).toBe("Stellar");
  });

  it("preserves already capitalised strings", () => {
    expect(capitalizeString("Balloon")).toBe("Balloon");
    expect(capitalizeString("STELLAR")).toBe("STELLAR");
  });

  it("returns empty string without throwing", () => {
    expect(capitalizeString("")).toBe("");
  });

  it("handles single character strings", () => {
    expect(capitalizeString("a")).toBe("A");
    expect(capitalizeString("Z")).toBe("Z");
  });

  it("preserves non-alphabetic leading characters", () => {
    expect(capitalizeString("123abc")).toBe("123abc");
    expect(capitalizeString("-test")).toBe("-test");
  });
});
