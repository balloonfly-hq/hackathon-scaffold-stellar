import { describe, expect, it } from "vitest";
import { shortenContractId } from "./contract";

describe("shortenContractId", () => {
  it("returns strings shorter than or equal to default threshold (9 characters) unchanged", () => {
    expect(shortenContractId("")).toBe("");
    expect(shortenContractId("1234")).toBe("1234");
    expect(shortenContractId("12345678")).toBe("12345678");
    expect(shortenContractId("123456789")).toBe("123456789");
  });

  it("shortens a 10-character string at the boundary", () => {
    expect(shortenContractId("1234567890")).toBe("12345…7890");
  });

  it("shortens a canonical 56-character Stellar contract ID to first5…last4", () => {
    const stellarContractId =
      "CA3D5KRYMCMCZVACQ3VOQBNOBCKUETG626DPP3NOJBJA2XOM2PPNOQHN";
    expect(shortenContractId(stellarContractId)).toBe("CA3D5…OQHN");
  });

  it("respects custom prefixLength and suffixLength parameters", () => {
    const id = "ABCDEFGHIJ"; // 10 chars
    // prefix 3, suffix 2 -> threshold 5; shortened to ABC…IJ
    expect(shortenContractId(id, 3, 2)).toBe("ABC…IJ");
    // prefix 6, suffix 4 -> threshold 10; exactly at threshold, returns unchanged
    expect(shortenContractId(id, 6, 4)).toBe("ABCDEFGHIJ");
    // prefix 7, suffix 4 -> threshold 11; length <= 11, returns unchanged
    expect(shortenContractId(id, 7, 4)).toBe("ABCDEFGHIJ");
  });

  it("handles custom prefix/suffix with smaller inputs", () => {
    expect(shortenContractId("hello", 2, 1)).toBe("he…o");
    expect(shortenContractId("hi", 2, 1)).toBe("hi");
  });
});
