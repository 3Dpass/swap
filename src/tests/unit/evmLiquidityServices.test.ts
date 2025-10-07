import {
  getLiquidityFunctionSelectors,
  convertAddLiquidityParamsToEVM,
  convertRemoveLiquidityParamsToEVM,
  createAddLiquidityTransactionData,
  createRemoveLiquidityTransactionData,
} from "../../services/evmLiquidityServices";

describe("EVM Liquidity Services", () => {
  describe("getLiquidityFunctionSelectors", () => {
    it("should return correct function selectors", () => {
      const selectors = getLiquidityFunctionSelectors();

      expect(selectors.addLiquidity).toBeDefined();
      expect(selectors.removeLiquidity).toBeDefined();

      expect(selectors.addLiquidity).toMatch(/^0x[0-9a-fA-F]{8}$/);
      expect(selectors.removeLiquidity).toMatch(/^0x[0-9a-fA-F]{8}$/);
    });
  });

  describe("convertAddLiquidityParamsToEVM", () => {
    it("should convert Substrate asset IDs to EVM addresses for add liquidity", async () => {
      const params = {
        asset1: "0",
        asset2: "1",
        amount1Desired: "1000000000000000000",
        amount2Desired: "2000000000000000000",
        amount1Min: "900000000000000000",
        amount2Min: "1800000000000000000",
        mintTo: "0x1234567890123456789012345678901234567890",
      };

      const result = await convertAddLiquidityParamsToEVM(params);

      expect(result.asset1Address).toBe("0x0000000000000000000000000000000000000802");
      expect(result.asset2Address).toBe("0xfbfBfbFa00000000000000000000000000000001");
      expect(result.amount1Desired).toBe("1000000000000000000");
      expect(result.amount2Desired).toBe("2000000000000000000");
      expect(result.amount1Min).toBe("900000000000000000");
      expect(result.amount2Min).toBe("1800000000000000000");
      expect(result.mintTo).toBe("0x1234567890123456789012345678901234567890");
    });
  });

  describe("convertRemoveLiquidityParamsToEVM", () => {
    it("should convert Substrate asset IDs to EVM addresses for remove liquidity", async () => {
      const params = {
        asset1: "0",
        asset2: "1",
        lpTokenId: "123",
        lpTokenBurn: "500000000000000000",
        amount1MinReceive: "450000000000000000",
        amount2MinReceive: "900000000000000000",
        withdrawTo: "0x1234567890123456789012345678901234567890",
      };

      const result = await convertRemoveLiquidityParamsToEVM(params);

      expect(result.asset1Address).toBe("0x0000000000000000000000000000000000000802");
      expect(result.asset2Address).toBe("0xfbfBfbFa00000000000000000000000000000001");
      expect(result.lpTokenAddress).toBe("0xFbfbfBFb0000000000000000000000000000007B");
      expect(result.lpTokenBurn).toBe("500000000000000000");
      expect(result.amount1MinReceive).toBe("450000000000000000");
      expect(result.amount2MinReceive).toBe("900000000000000000");
      expect(result.withdrawTo).toBe("0x1234567890123456789012345678901234567890");
    });
  });

  describe("createAddLiquidityTransactionData", () => {
    it("should create valid transaction data for add liquidity with all parameters", async () => {
      const params = {
        asset1: "0",
        asset2: "1",
        amount1Desired: "1000000000000000000",
        amount2Desired: "2000000000000000000",
        amount1Min: "900000000000000000",
        amount2Min: "1800000000000000000",
        mintTo: "0x1234567890123456789012345678901234567890",
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const transactionData = await createAddLiquidityTransactionData(params);

      expect(transactionData).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(transactionData.length).toBeGreaterThan(10);
    });

    it("should throw error for invalid asset IDs", async () => {
      const params = {
        asset1: "invalid",
        asset2: "1",
        amount1Desired: "1000000000000000000",
        amount2Desired: "2000000000000000000",
        amount1Min: "900000000000000000",
        amount2Min: "1800000000000000000",
      };

      await expect(createAddLiquidityTransactionData(params)).rejects.toThrow();
    });
  });

  describe("createRemoveLiquidityTransactionData", () => {
    it("should create valid transaction data for remove liquidity with all parameters", async () => {
      const params = {
        asset1: "0",
        asset2: "1",
        lpTokenId: "123",
        lpTokenBurn: "500000000000000000",
        amount1MinReceive: "450000000000000000",
        amount2MinReceive: "900000000000000000",
        withdrawTo: "0x1234567890123456789012345678901234567890",
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      const transactionData = await createRemoveLiquidityTransactionData(params);

      expect(transactionData).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(transactionData.length).toBeGreaterThan(10);
    });

    it("should throw error for invalid asset IDs", async () => {
      const params = {
        asset1: "invalid",
        asset2: "1",
        lpTokenId: "123",
        lpTokenBurn: "500000000000000000",
        amount1MinReceive: "450000000000000000",
        amount2MinReceive: "900000000000000000",
      };

      await expect(createRemoveLiquidityTransactionData(params)).rejects.toThrow();
    });
  });
});
