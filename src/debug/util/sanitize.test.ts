import { describe, expect, it } from "vitest";
import { isEmptyObject } from "./isEmptyObject";
import { sanitizeObject } from "./sanitizeObject";
import { sanitizeArray } from "./sanitizeArray";

describe("isEmptyObject", () => {
  it("returns true for empty objects", () => {
    expect(isEmptyObject({})).toBe(true);
  });

  it("returns false for objects with keys, even if the value is undefined or null", () => {
    expect(isEmptyObject({ a: undefined })).toBe(false);
    expect(isEmptyObject({ a: null })).toBe(false);
    expect(isEmptyObject({ a: 1 })).toBe(false);
  });
});

describe("sanitizeObject", () => {
  it("drops falsy values by default while keeping populated entries", () => {
    const input = {
      name: "balloon",
      emptyStr: "",
      nullVal: null,
      undefVal: undefined,
      num: 42,
    };
    expect(sanitizeObject(input)).toEqual({
      name: "balloon",
      num: 42,
    });
  });

  it("retains empty object values when noEmptyObj is false", () => {
    const input = {
      nestedEmpty: {},
      populated: { x: 1 },
    };
    expect(sanitizeObject(input, false)).toEqual({
      nestedEmpty: {},
      populated: { x: 1 },
    });
  });

  it("drops empty object values when noEmptyObj is true", () => {
    const input = {
      nestedEmpty: {},
      populated: { x: 1 },
    };
    expect(sanitizeObject(input, true)).toEqual({
      populated: { x: 1 },
    });
  });
});

describe("sanitizeArray", () => {
  it("filters out falsy entries including 0, empty string, and false", () => {
    const input = ["hello", 0, "", false, null, undefined, 42, true];
    // Explicitly pins current Boolean() casting behaviour
    expect(sanitizeArray(input)).toEqual(["hello", 42, true]);
  });

  it("preserves valid truthy values in empty or populated arrays", () => {
    expect(sanitizeArray([])).toEqual([]);
    expect(sanitizeArray([1, "a", {}])).toEqual([1, "a", {}]);
  });
});
