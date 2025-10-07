import {
  convertSwapParamsToEVM,
  createSwapTransactionData,
  createSwapTransaction,
} from "../../services/evmSwapServices";

interface SwapParams {
  assetIn: string;
  assetOut: string;
  amount: string;
  minReceive: string;
  recipient?: string;
  deadline?: number;
}

const mockMetamaskAccount = {
  evmAddress: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
  substrateAddress: "d1GXHj9QJZVPNot9sFenNrBECQpzetEVRSecPvZwMarmZHYtT",
  name: "Test Account",
  source: "metamask",
  address: "d1GXHj9QJZVPNot9sFenNrBECQpzetEVRSecPvZwMarmZHYtT",
  walletType: "metamask" as const,
  wallet: {
    extensionName: "metamask",
    title: "MetaMask",
    installUrl: "https://metamask.io",
    logo: {
      src: "/metamask-logo.png",
      alt: "MetaMask",
    },
  },
};

describe("Swap Transaction Construction", () => {
  describe("convertSwapParamsToEVM", () => {
    it("should convert Substrate asset IDs to EVM addresses correctly", async () => {
      const params: SwapParams = {
        assetIn: "0",
        assetOut: "222",
        amount: "1000000000000000000",
        minReceive: "980000000000000000",
        recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
        deadline: 1704067200,
      };

      const evmParams = await convertSwapParamsToEVM(params);

      expect(evmParams.assetInAddress).toBe("0x0000000000000000000000000000000000000802");
      expect(evmParams.assetOutAddress).toBe("0xFBFBFBFA000000000000000000000000000000DE");
      expect(evmParams.amount).toBe("1000000000000000000");
      expect(evmParams.minReceive).toBe("980000000000000000");
      expect(evmParams.recipient).toBe("0xdF4993F7741B1295D6A9b4eced2790C2165f085c");
      expect(evmParams.deadline).toBe(1704067200);
    });

    it("should handle string asset IDs", async () => {
      const params: SwapParams = {
        assetIn: "1",
        assetOut: "333",
        amount: "500000000000000000",
        minReceive: "490000000000000000",
      };

      const evmParams = await convertSwapParamsToEVM(params);

      expect(evmParams.assetInAddress).toBe("0xFBFBFBFA00000000000000000000000000000001");
      expect(evmParams.assetOutAddress).toBe("0xFBFBFBFA0000000000000000000000000000014D");
    });
  });

  describe("createSwapTransactionData", () => {
    it("should create valid transaction data for exact input swap", async () => {
      const params: SwapParams = {
        assetIn: "0",
        assetOut: "222",
        amount: "1000000000000000000",
        minReceive: "980000000000000000",
        recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
        deadline: 1704067200,
      };

      const transactionData = await createSwapTransactionData(params, true);

      // Should be a valid hex string starting with 0x
      expect(transactionData).toMatch(/^0x[a-fA-F0-9]+$/);
      // Should be longer than just function selector (4 bytes = 8 hex chars)
      expect(transactionData.length).toBeGreaterThan(10);
      // Should start with swapExactTokensForTokens selector (0x38ed1739)
      expect(transactionData).toMatch(/^0x38ed1739/);
    });

    it("should create valid transaction data for exact output swap", async () => {
      const params: SwapParams = {
        assetIn: "0",
        assetOut: "222",
        amount: "1000000000000000000",
        minReceive: "980000000000000000",
        recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
        deadline: 1704067200,
      };

      const transactionData = await createSwapTransactionData(params, false);

      // Should be a valid hex string starting with 0x
      expect(transactionData).toMatch(/^0x[a-fA-F0-9]+$/);
      // Should be longer than just function selector (4 bytes = 8 hex chars)
      expect(transactionData.length).toBeGreaterThan(10);
      // Should start with swapTokensForExactTokens selector (0x8803dbee)
      expect(transactionData).toMatch(/^0x8803dbee/);
    });
  });

  describe("createSwapTransaction", () => {
    it("should create valid transaction object for exact input swap", async () => {
      const params: SwapParams = {
        assetIn: "0",
        assetOut: "222",
        amount: "1000000000000000000",
        minReceive: "980000000000000000",
        recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
        deadline: 1704067200,
      };

      const mockApi = {
        query: {
          timestamp: {
            now: jest.fn().mockResolvedValue(1704067200000),
          },
        },
      };

      const transaction = await createSwapTransaction(params, mockMetamaskAccount, mockApi, true, "0x895440");

      expect(transaction.from).toBe("0xdF4993F7741B1295D6A9b4eced2790C2165f085c");
      expect(transaction.to).toBe("0x0000000000000000000000000000000000000902");
      expect(transaction.data).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(transaction.value).toBe("0x0");
    });

    it("should create valid transaction object for exact output swap", async () => {
      const params: SwapParams = {
        assetIn: "0",
        assetOut: "222",
        amount: "1000000000000000000",
        minReceive: "980000000000000000",
        recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
        deadline: 1704067200,
      };

      const mockApi = {
        query: {
          timestamp: {
            now: jest.fn().mockResolvedValue(1704067200000),
          },
        },
      };

      const transaction = await createSwapTransaction(params, mockMetamaskAccount, mockApi, false, "0x895440");

      expect(transaction.from).toBe("0xdF4993F7741B1295D6A9b4eced2790C2165f085c");
      expect(transaction.to).toBe("0x0000000000000000000000000000000000000902");
      expect(transaction.data).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(transaction.value).toBe("0x0");
    });
  });
});
