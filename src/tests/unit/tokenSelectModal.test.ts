import { formatDecimalsFromToken } from "../../app/util/helper";
import { smartBalanceDisplay } from "../../app/util/tokenBalance";

describe("TokenSelectModal balance display", () => {
  it("should reproduce the tiny balance display issue", () => {
    // Simulate token data from wallet service after our fixes
    // The balance is now stored as a number instead of raw string
    const tokenData = {
      tokenId: "24",
      assetTokenMetadata: {
        symbol: "P3D",
        decimals: "12",
      },
      tokenAsset: {
        balance: 24795.5036, // Already formatted number (not raw)
      },
    };

    // This is what happens in TokenSelectModal line 102:
    // formatDecimalsFromToken(item.tokenAsset?.balance || 0, item.assetTokenMetadata?.decimals)
    const displayedBalance = formatDecimalsFromToken(
      tokenData.tokenAsset.balance || 0,
      tokenData.assetTokenMetadata.decimals
    );

    // PROBLEM: This will be a very small number because we're dividing an already formatted number by 10^12
    expect(parseFloat(displayedBalance)).toBeLessThan(1);
    expect(displayedBalance).toMatch(/^0\.0+/); // Starts with 0.000...
  });

  it("should demonstrate what SHOULD happen vs what DOES happen", () => {
    const decimals = "12";

    // Scenario 1: If balance was raw (old behavior)
    const rawBalance = "24795503631344215"; // Raw number as string
    const correctDisplay = formatDecimalsFromToken(Number(rawBalance), decimals);

    // Scenario 2: If balance is already formatted (current problem)
    const formattedBalance = 24795.5036; // Already formatted
    const wrongDisplay = formatDecimalsFromToken(formattedBalance, decimals);

    // Show the problem
    expect(parseFloat(correctDisplay)).toBeGreaterThan(24000); // Should be reasonable
    expect(parseFloat(wrongDisplay)).toBeLessThan(1); // Bug: tiny number
    expect(wrongDisplay).not.toBe(correctDisplay); // They're different
  });

  it("should identify the root cause - double formatting in TokenSelectModal", () => {
    // The issue is the same as with P3D balance click:
    // 1. Wallet service already formats the balance (polkadotWalletServices/index.ts line 90)
    // 2. TokenSelectModal applies formatDecimalsFromToken again (line 102)
    // 3. Result: tiny numbers like 0.000000024795503631344215

    const decimals = "12";

    // What wallet service stores (already formatted)
    const storedBalance = 24795.5036;

    // What TokenSelectModal does (applies formatting again)
    const doubleFormatted = formatDecimalsFromToken(storedBalance, decimals);

    // This is the bug we see in the UI
    expect(parseFloat(doubleFormatted)).toBeLessThan(1);
    expect(doubleFormatted).toMatch(/^0\.0+24795/); // Very small number
  });

  it("should work correctly with smart balance detection", () => {
    // After fix, we should detect if balance is already formatted
    // and handle it appropriately

    const decimals = "12";

    // Test with already formatted balance (the problematic case)
    const formattedBalance = 24795.5036;
    const result = smartBalanceDisplay(formattedBalance, decimals);

    expect(parseFloat(result)).toBeGreaterThan(24000); // Should be reasonable
    expect(result).not.toMatch(/^0\.0+/); // Should not be tiny
    expect(result).toMatch(/^24795/); // Should start with correct number
  });

  it("should fix the TokenSelectModal display issue", () => {
    // Test the exact scenario from TokenSelectModal after fix
    const tokenData = {
      tokenId: "24",
      assetTokenMetadata: {
        symbol: "P3D",
        decimals: "12",
      },
      tokenAsset: {
        balance: 24795.5036, // Already formatted number
      },
    };

    // This is the NEW way (using smartBalanceDisplay)
    const fixedDisplay = smartBalanceDisplay(tokenData.tokenAsset.balance || 0, tokenData.assetTokenMetadata.decimals);

    // Should now show a reasonable balance, not tiny number
    expect(parseFloat(fixedDisplay)).toBeGreaterThan(24000);
    expect(fixedDisplay).not.toMatch(/^0\.0+/); // No longer tiny
    expect(fixedDisplay).toMatch(/^24795/); // Proper display format
  });
});
