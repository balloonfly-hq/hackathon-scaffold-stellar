import { describe, expect, it } from "vitest";
import { trim } from "./trim";

describe("trim", () => {
  it("trims leading and trailing whitespace by default", () => {
    expect(trim("  hi  ")).toBe("hi");
    expect(trim("\t\nhello world\n\t")).toBe("hello world");
  });

  it("trims a custom character set", () => {
    expect(trim("__hi__", "_")).toBe("hi");
    expect(trim("---balloon---", "-")).toBe("balloon");
    expect(trim("///stellar///", "/")).toBe("stellar");
  });

  it("handles empty and whitespace-only strings", () => {
    expect(trim("")).toBe("");
    expect(trim("   ")).toBe("");
    expect(trim("_____", "_")).toBe("");
  });

  it("returns strings without matching edge characters unchanged", () => {
    expect(trim("stellar")).toBe("stellar");
    expect(trim("stellar", "_")).toBe("stellar");
  });
});
