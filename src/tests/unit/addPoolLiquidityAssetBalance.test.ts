import { safeTokenBalanceClean } from "../../app/util/tokenBalance";
import { Decimal } from "decimal.js";

describe("AddPoolLiquidity assetTokenBalance error", () => {
  it("should reproduce the assetTokenBalance?.replace error", () => {
    // This reproduces the exact error from line 348 in AddPoolLiquidity
    // selectedTokenB.assetTokenBalance can now be a number instead of string
    const selectedTokenB: any = {
      assetTokenBalance: 123456789, // This is a number, not a string
      decimals: "12",
      tokenSymbol: "TEST",
    };

    // This should fail because we're calling .replace on a number
    expect(() => {
      new Decimal(selectedTokenB.assetTokenBalance?.replace(/[, ]/g, ""));
    }).toThrow();
  });

  it("should demonstrate the problem in useMemo calculation", () => {
    // The error occurs in getButtonProperties useMemo around line 348
    // where it tries to clean the assetTokenBalance for calculation

    const selectedTokenB: any = {
      assetTokenBalance: 123456789, // Number from our wallet service fixes
      decimals: "12",
      tokenSymbol: "TEST",
    };

    // This is what currently fails
    expect(() => {
      // Line 348: const assetTokenBalance = new Decimal(selectedTokenB.assetTokenBalance?.replace(/[, ]/g, ""));
      const cleanBalance = selectedTokenB.assetTokenBalance?.replace(/[, ]/g, "");
      new Decimal(cleanBalance);
    }).toThrow();
  });

  it("should work with safe token balance cleaner", () => {
    // After fix, should use safeTokenBalanceClean utility
    const selectedTokenB = {
      assetTokenBalance: 123456789, // Number
      decimals: "12",
      tokenSymbol: "TEST",
    };

    // This should NOT throw
    expect(() => {
      const cleanBalance = safeTokenBalanceClean(selectedTokenB.assetTokenBalance);
      new Decimal(cleanBalance);
    }).not.toThrow();

    // And should produce correct result
    const cleanBalance = safeTokenBalanceClean(selectedTokenB.assetTokenBalance);
    const result = new Decimal(cleanBalance);
    expect(result.toString()).toBe("123456789");
  });

  it("should handle both string and number assetTokenBalance", () => {
    // Test with number
    const numberBalance = 123456789;
    const cleanedNumber = safeTokenBalanceClean(numberBalance);
    expect(() => new Decimal(cleanedNumber)).not.toThrow();

    // Test with string
    const stringBalance = "123,456,789";
    const cleanedString = safeTokenBalanceClean(stringBalance);
    expect(() => new Decimal(cleanedString)).not.toThrow();
    expect(cleanedString).toBe("123456789");

    // Test with undefined
    const undefinedBalance = undefined;
    const cleanedUndefined = safeTokenBalanceClean(undefinedBalance);
    expect(() => new Decimal(cleanedUndefined)).not.toThrow();
    expect(cleanedUndefined).toBe("0");
  });

  it("should verify the fix works in AddPoolLiquidity context", () => {
    // Simulate the exact scenario from AddPoolLiquidity getButtonProperties
    const selectedTokenB = {
      assetTokenBalance: 123456789, // Number from wallet service
      decimals: "12",
      tokenSymbol: "TEST",
    };

    // This is the fixed version (line 348 in AddPoolLiquidity)
    expect(() => {
      const assetTokenBalance = new Decimal(safeTokenBalanceClean(selectedTokenB.assetTokenBalance));
      // Simulate the formatDecimalsFromToken call (line 349)
      const formatted = assetTokenBalance.toString(); // Simplified for test
      return formatted;
    }).not.toThrow();

    // Verify it produces correct result
    const assetTokenBalance = new Decimal(safeTokenBalanceClean(selectedTokenB.assetTokenBalance));
    expect(assetTokenBalance.toString()).toBe("123456789");

    // This demonstrates the fix: no more .replace error on numbers
    expect(safeTokenBalanceClean(selectedTokenB.assetTokenBalance)).toBe("123456789");
  });
});
