import { formatDecimalsFromToken } from "../../app/util/helper";

/**
 * Regression tests for formatDecimalsFromToken
 *
 * These tests prevent a critical bug where Decimal.js throws an error
 * when parsing numbers with commas (e.g., "87,987,100,000").
 *
 * The bug caused the add-liquidity and remove-liquidity pages to crash
 * with "Error: [DecimalError] Invalid argument" when the Polkadot API
 * returned token balances formatted with commas.
 *
 * Fixed by removing commas and spaces from string inputs before parsing.
 */
describe("formatDecimalsFromToken", () => {
  describe("Basic functionality", () => {
    it("should format decimals correctly for valid numeric inputs", () => {
      expect(formatDecimalsFromToken("1000000000000", "12")).toBe("1");
      expect(formatDecimalsFromToken("5000000000000", "12")).toBe("5");
      expect(formatDecimalsFromToken("1234567890000", "12")).toBe("1.23456789");
    });

    it("should handle zero values", () => {
      expect(formatDecimalsFromToken("0", "12")).toBe("0");
      expect(formatDecimalsFromToken(0, "12")).toBe("0");
    });

    it("should handle empty or invalid inputs", () => {
      expect(formatDecimalsFromToken("", "12")).toBe("0");
      expect(formatDecimalsFromToken(null as any, "12")).toBe("0");
      expect(formatDecimalsFromToken(undefined as any, "12")).toBe("0");
    });
  });

  describe("Handling formatted numbers with commas", () => {
    it("should handle numbers with commas correctly", () => {
      // These are the actual formats that come from the Polkadot API
      expect(formatDecimalsFromToken("87,987,100,000", "10")).toBe("8.79871");
      expect(formatDecimalsFromToken("1,234,567,890", "10")).toBe("0.123456789");
      expect(formatDecimalsFromToken("1,000", "10")).toBe("0.0000001");
    });

    it("should handle numbers with spaces correctly", () => {
      expect(formatDecimalsFromToken("87 987 100 000", "10")).toBe("8.79871");
      expect(formatDecimalsFromToken("1 234 567 890", "10")).toBe("0.123456789");
    });

    it("should handle mixed formatting correctly", () => {
      expect(formatDecimalsFromToken("87, 987, 100, 000", "10")).toBe("8.79871");
    });
  });

  describe("Real-world API response scenarios", () => {
    it("should handle token balance from Polkadot API", () => {
      // This is the actual format that caused the bug
      const apiBalance = "87,987,100,000";
      const decimals = "10";

      // Now it should work correctly
      expect(formatDecimalsFromToken(apiBalance, decimals)).toBe("8.79871");
    });

    it("should handle various API balance formats that might occur", () => {
      const testCases = [
        { balance: "1,000,000,000,000", decimals: "12", expected: "1" },
        {
          balance: "999,999,999,999",
          decimals: "12",
          expected: "0.999999999999",
        },
        { balance: "1,234", decimals: "12", expected: "0.000000001234" },
        { balance: "12,345,678", decimals: "10", expected: "0.0012345678" },
      ];

      testCases.forEach(({ balance, decimals, expected }) => {
        expect(formatDecimalsFromToken(balance, decimals)).toBe(expected);
      });
    });
  });

  describe("Edge cases and additional scenarios", () => {
    it("should handle very large numbers with commas", () => {
      expect(formatDecimalsFromToken("1,000,000,000,000", "12")).toBe("1");
      expect(formatDecimalsFromToken("999,999,999,999,999", "12")).toBe("999.999999999999");
    });

    it("should handle numbers without commas as before", () => {
      expect(formatDecimalsFromToken("1000000000000", "12")).toBe("1");
      expect(formatDecimalsFromToken("87987100000", "10")).toBe("8.79871");
    });

    it("should handle decimal numbers with commas", () => {
      // Although unlikely in blockchain contexts, ensure robustness
      expect(formatDecimalsFromToken("1,234.56", "2")).toBe("12.3456");
      expect(formatDecimalsFromToken("1,000,000.123456", "6")).toBe("1.000000123456");
    });
  });
});
