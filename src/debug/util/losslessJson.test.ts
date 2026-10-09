import { describe, expect, it } from "vitest";
import { prettifyJsonString } from "./prettifyJsonString";
import { parseToLosslessJson } from "./parseToLosslessJson";

describe("prettifyJsonString and parseToLosslessJson", () => {
  it("pretty-prints a nested object with 2-space indentation", () => {
    const input = '{"user":{"name":"Alice","score":100}}';
    const expected = [
      "{",
      '  "user": {',
      '    "name": "Alice",',
      '    "score": 100',
      "  }",
      "}",
    ].join("\n");

    expect(prettifyJsonString(input)).toBe(expected);
  });

  it("round-trips a 20-digit integer exceeding Number.MAX_SAFE_INTEGER without precision loss", () => {
    // 20-digit integer exceeding Number.MAX_SAFE_INTEGER (9007199254740991)
    const largeNumberStr = "12345678901234567890";
    const jsonPayload = `{"amount":${largeNumberStr}}`;

    const parsed = parseToLosslessJson(jsonPayload);
    expect(parsed).toEqual({
      amount: 12345678901234567890n,
    });

    const prettified = prettifyJsonString(jsonPayload);
    expect(prettified).toContain(`"amount": ${largeNumberStr}`);
  });

  it("returns invalid JSON string unchanged instead of throwing", () => {
    expect(prettifyJsonString("not a valid json")).toBe("not a valid json");
    expect(prettifyJsonString("{invalid: json")).toBe("{invalid: json");
    expect(prettifyJsonString("")).toBe("");
  });
});
