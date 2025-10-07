import {
  getFunctionSelectors,
  convertSwapParamsToEVM,
  createSwapTransactionData,
  getSwapQuote,
} from "../../services/evmSwapServices";

describe("EVM Swap Services", () => {
  describe("getFunctionSelectors", () => {
    it("should return correct function selectors", () => {
      const selectors = getFunctionSelectors();

      // These are the actual function selectors generated from the ABI
      expect(selectors.swapExactTokensForTokens).toBeDefined();
      expect(selectors.swapTokensForExactTokens).toBeDefined();

      // Function selectors should be 4 bytes (8 hex characters)
      expect(selectors.swapExactTokensForTokens).toMatch(/^0x[0-9a-fA-F]{8}$/);
      expect(selectors.swapTokensForExactTokens).toMatch(/^0x[0-9a-fA-F]{8}$/);
    });
  });

  describe("convertSwapParamsToEVM", () => {
    it("should convert Substrate asset IDs to EVM addresses", async () => {
      const params = {
        assetIn: "0",
        assetOut: "1",
        amount: "1000000000000000000",
        minReceive: "900000000000000000",
        recipient: "0x1234567890123456789012345678901234567890",
        deadline: 1234567890,
      };

      const result = await convertSwapParamsToEVM(params);

      expect(result.assetInAddress).toBe("0x0000000000000000000000000000000000000802");
      expect(result.assetOutAddress).toBe("0xfbfBfbFa00000000000000000000000000000001");
      expect(result.amount).toBe("1000000000000000000");
      expect(result.minReceive).toBe("900000000000000000");
      expect(result.recipient).toBe("0x1234567890123456789012345678901234567890");
      expect(result.deadline).toBe(1234567890);
    });
  });

  describe("createSwapTransactionData", () => {
    it("should create valid transaction data for swap", async () => {
      const params = {
        assetIn: "0",
        assetOut: "1",
        amount: "1000000000000000000",
        minReceive: "900000000000000000",
        recipient: "0x1234567890123456789012345678901234567890",
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const transactionData = await createSwapTransactionData(params, true);

      // Should be a valid hex string starting with 0x
      expect(transactionData).toMatch(/^0x[0-9a-fA-F]+$/);

      // Should be longer than just the function selector (4 bytes)
      expect(transactionData.length).toBeGreaterThan(10);
    });
  });

  describe("getSwapQuote", () => {
    it("should return a valid quote structure", async () => {
      // Mock API for testing
      const mockApi = {
        call: {
          assetConversionApi: {
            quotePriceExactTokensForTokens: jest.fn().mockResolvedValue("1000000000000000000"),
            quotePriceTokensForExactTokens: jest.fn().mockResolvedValue("1000000000000000000"),
          },
        },
        rpc: {
          state: {
            call: jest.fn().mockResolvedValue("0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"), // Mock response
          },
        },
        createType: jest.fn().mockImplementation(() => ({
          toU8a: jest.fn().mockReturnValue(new Uint8Array(32)), // Mock 32-byte array
          toHuman: jest.fn().mockReturnValue("1000000000000000000"), // Mock human-readable value
        })),
      };

      const quote = await getSwapQuote("0", "1", "1000000000000000000", mockApi as any);

      expect(quote).toHaveProperty("amountIn");
      expect(quote).toHaveProperty("amountOut");
      expect(quote).toHaveProperty("priceImpact");
      expect(quote).toHaveProperty("minimumReceived");

      expect(quote.amountIn).toBe("1000000000000000000");
    });
  });
});
