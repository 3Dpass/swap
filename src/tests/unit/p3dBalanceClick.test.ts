import { formatBalanceForMaxClick } from "../../app/util/tokenBalance";
import { formatDecimalsFromToken } from "../../app/util/helper";

describe("P3D Balance Click Bug", () => {
  it("should fix the P3D balance click issue", () => {
    // Situation: UI shows Balance: 24795.503631344215
    // On click should insert exactly this number (or truncated to 12 decimals)

    const displayedBalance = "24795.503631344215"; // What user sees
    const decimals = "12"; // P3D has 12 decimals

    // formatBalanceForMaxClick now intelligently detects already formatted balance
    const result = formatBalanceForMaxClick(displayedBalance, decimals);

    // FIXED: result should be 24795.503631344215 (max 12 decimals)
    // and NOT 0.000000024795 due to double formatting

    // This test should now PASS, showing the fix works
    expect(result).toBe("24795.503631344215");
  });

  it("should handle both raw and formatted balances correctly after fix", () => {
    const decimals = "12";

    // Scenario 1: Raw balance input (should work as before)
    const rawBalance = "24795503631344215"; // 17 digits without decimal point
    const resultFromRaw = formatBalanceForMaxClick(rawBalance, decimals);

    // Scenario 2: Already formatted balance input (should now work correctly)
    const formattedBalance = "24795.503631344215"; // Already has decimal point
    const resultFromFormatted = formatBalanceForMaxClick(formattedBalance, decimals);

    // Both should work correctly now
    expect(resultFromRaw).toContain("24795."); // Should work
    expect(resultFromFormatted).toBe("24795.503631344215"); // Fixed - no longer tiny number
    expect(parseFloat(resultFromFormatted)).toBeGreaterThan(24000); // Reasonable value
  });

  it("should demonstrate the fix prevents double formatting", () => {
    // The problem WAS: formatBalanceForMaxClick expected RAW balance
    // but received FORMATTED balance and applied formatting twice

    const decimals = "12";

    // Scenario: Raw balance handling (should work as before)
    // 1. Raw balance: "24795503631344215"
    // 2. formatBalanceForMaxClick divides by 10^12
    // 3. Result: "24795.503631344215"

    const fromRaw = formatBalanceForMaxClick("24795503631344215", decimals);
    expect(fromRaw).toMatch(/^24795\./);

    // Scenario: Formatted balance handling (NOW FIXED)
    // 1. Formatted balance: "24795.503631344215" (already has decimal point)
    // 2. formatBalanceForMaxClick detects decimal point and returns as-is (or truncates)
    // 3. Result: "24795.503631344215" (NOT "0.000000024795")

    const fromFormatted = formatBalanceForMaxClick("24795.503631344215", decimals);
    expect(parseFloat(fromFormatted)).toBeGreaterThan(24000); // Fixed - no longer tiny number
    expect(fromFormatted).toBe("24795.503631344215"); // Correct result
  });

  it("should demonstrate the solution to pre-formatted native token balance", () => {
    // The issue WAS in polkadotWalletServices/index.ts line 90:
    // const balanceFormatted = formatDecimalsFromToken(balance?.free.toString(), tokenDecimals as string);
    // balance: balanceFormatted, // <-- This is already formatted!

    // Then in AddPoolLiquidity, selectedTokenA.tokenBalance comes from tokenBalances.balance
    // which is already formatted, but formatBalanceForMaxClick used to expect raw balance

    const rawNativeBalance = "24795503631344215"; // What should be stored
    const decimals = "12";

    // First formatting (happens in wallet service)
    const formatted = formatDecimalsFromToken(Number(rawNativeBalance), decimals);
    // Allow for small precision differences in the test
    expect(parseFloat(formatted)).toBeCloseTo(24795.50363, 5);

    // Second formatting (happens in formatBalanceForMaxClick) - NOW FIXED
    const result = formatBalanceForMaxClick(formatted, decimals);
    expect(parseFloat(result)).toBeGreaterThan(24000); // No longer tiny number!
    expect(result).not.toBe("0.000000024795"); // Bug is fixed!

    // The solution: formatBalanceForMaxClick now detects if balance is already formatted
  });

  it("should work correctly after fix - smart format detection", () => {
    const decimals = "12";

    // After fix, formatBalanceForMaxClick should handle both raw and formatted inputs correctly

    // Case 1: Raw balance input (should work as before)
    const rawBalance = "24795503631344215";
    const resultFromRaw = formatBalanceForMaxClick(rawBalance, decimals);

    // Case 2: Already formatted balance input (should return the same or truncate to decimal limit)
    const formattedBalance = "24795.503631344215";
    const resultFromFormatted = formatBalanceForMaxClick(formattedBalance, decimals);

    // Both should give us a reasonable result around 24795
    expect(parseFloat(resultFromRaw)).toBeGreaterThan(24000);
    expect(parseFloat(resultFromFormatted)).toBeGreaterThan(24000);

    // The formatted input should NOT result in tiny number
    expect(parseFloat(resultFromFormatted)).not.toBeLessThan(1);

    // This test will fail until we implement the fix
    expect(resultFromFormatted).not.toBe("0.000000024795");
  });
});
