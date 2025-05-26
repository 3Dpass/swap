import { formatDecimalsFromToken } from "../../app/util/helper";
import { safeTokenBalanceClean } from "../../app/util/tokenBalance";

describe("TokenAmountInput tokenBalance handling", () => {
  it("should fail when calling replace on a number", () => {
    // This reproduces the exact error from the browser
    const tokenBalance: any = 123456789; // This is a number, not a string

    // This should fail because we're calling .replace on a number
    expect(() => {
      tokenBalance?.replace(/[, ]/g, "");
    }).toThrow();
  });

  it("should use the safe balance formatter utility", () => {
    const testNumber = 123456789;
    const testNumberString = "24795503631344215";

    // Test with number - should not throw and should convert to string
    expect(() => safeTokenBalanceClean(testNumber)).not.toThrow();
    expect(typeof safeTokenBalanceClean(testNumber)).toBe("string");
    expect(safeTokenBalanceClean(testNumber).length).toBeGreaterThan(5);

    // Test with string
    expect(safeTokenBalanceClean(testNumberString)).toBe("24795503631344215");

    // Test with string with commas
    expect(safeTokenBalanceClean("24,795,503,631,344,215")).toBe("24795503631344215");

    // Test with undefined
    expect(safeTokenBalanceClean(undefined)).toBe("0");
  });

  it("should format the cleaned balance correctly with the utility", () => {
    const tokenBalance = 123456789;
    const tokenDecimals = "6";

    const cleanBalance = safeTokenBalanceClean(tokenBalance);
    const result = formatDecimalsFromToken(Number(cleanBalance), tokenDecimals);

    // Should format correctly without throwing
    expect(typeof result).toBe("string");
    expect(parseFloat(result)).toBeGreaterThan(100);
  });

  it("should handle the exact scenario that was failing in TokenAmountInput", () => {
    // Simulate what happens in TokenAmountInput component
    const tokenBalance = 123456789; // This comes as a number from our fixes
    const tokenDecimals = "6";

    // This should not throw an error anymore
    expect(() => {
      const cleaned = safeTokenBalanceClean(tokenBalance);
      const formatted = formatDecimalsFromToken(Number(cleaned), tokenDecimals);
      return formatted;
    }).not.toThrow();

    // And should produce a reasonable result
    const cleaned = safeTokenBalanceClean(tokenBalance);
    const formatted = formatDecimalsFromToken(Number(cleaned), tokenDecimals);
    expect(parseFloat(formatted)).toBeGreaterThan(100);
  });
});
