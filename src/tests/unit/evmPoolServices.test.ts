import {
  getPoolFunctionSelectors,
  convertCreatePoolParamsToEVM,
  createCreatePairTransactionData,
  parsePairCreatedEvent,
  validateCreatePoolParams,
  checkPoolExists,
} from "../../services/evmPoolServices";

describe("EVM Pool Services", () => {
  describe("getPoolFunctionSelectors", () => {
    it("should return correct function selectors", () => {
      const selectors = getPoolFunctionSelectors();

      expect(selectors.allPairsLength).toBeDefined();
      expect(selectors.allPairs).toBeDefined();
      expect(selectors.getPair).toBeDefined();
      expect(selectors.createPair).toBeDefined();

      expect(selectors.allPairsLength).toMatch(/^0x[0-9a-fA-F]{8}$/);
      expect(selectors.allPairs).toMatch(/^0x[0-9a-fA-F]{8}$/);
      expect(selectors.getPair).toMatch(/^0x[0-9a-fA-F]{8}$/);
      expect(selectors.createPair).toMatch(/^0x[0-9a-fA-F]{8}$/);
    });
  });

  describe("convertCreatePoolParamsToEVM", () => {
    it("should convert Substrate asset IDs to EVM addresses for pool creation", async () => {
      const params = {
        asset1: "0",
        asset2: "1",
      };

      const result = await convertCreatePoolParamsToEVM(params);

      expect(result.asset1Address).toBe("0x0000000000000000000000000000000000000802");
      expect(result.asset2Address).toBe("0xfbfBfbFa00000000000000000000000000000001");
    });

    it("should handle different asset IDs", async () => {
      const params = {
        asset1: "222",
        asset2: "333",
      };

      const result = await convertCreatePoolParamsToEVM(params);

      expect(result.asset1Address).toBe("0xfBFBfbFA000000000000000000000000000000de");
      expect(result.asset2Address).toBe("0xFbFBFBfA0000000000000000000000000000014D");
    });
  });

  describe("createCreatePairTransactionData", () => {
    it("should create valid transaction data for pool creation", () => {
      const params = {
        asset1Address: "0x0000000000000000000000000000000000000802",
        asset2Address: "0xfbfBfbFa00000000000000000000000000000001",
      };

      const transactionData = createCreatePairTransactionData(params);

      expect(transactionData).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(transactionData.length).toBeGreaterThan(10);
      expect(transactionData.startsWith("0xc9c65396")).toBe(true); // createPair selector
    });

    it("should handle different asset addresses", () => {
      const params = {
        asset1Address: "0xfBFBfbFA000000000000000000000000000000de",
        asset2Address: "0xFbFBFBfA0000000000000000000000000000014D",
      };

      const transactionData = createCreatePairTransactionData(params);

      expect(transactionData).toMatch(/^0x[0-9a-fA-F]+$/);
      expect(transactionData.length).toBeGreaterThan(10);
      expect(transactionData.startsWith("0xc9c65396")).toBe(true); // createPair selector
    });
  });

  describe("parsePairCreatedEvent", () => {
    it("should parse PairCreated event from transaction receipt", () => {
      const mockReceipt = {
        logs: [
          {
            topics: [
              "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", // PairCreated event selector
              "0x0000000000000000000000000000000000000000000000000000000000000802", // token0 (P3D)
              "0x000000000000000000000000fbfbfbfa00000000000000000000000000000001", // token1 (Asset 1)
            ],
            data: "0x000000000000000000000000fbfbfbfb00000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001", // pair address + allPairsLength
            address: "0x0000000000000000000000000000000000000902",
          },
        ],
        transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        blockNumber: "0x12345",
      };

      const result = parsePairCreatedEvent(mockReceipt);

      expect(result).toBeDefined();
      expect(result?.token0).toBe("0x0000000000000000000000000000000000000802");
      expect(result?.token1).toBe("0xfbfbfbfa00000000000000000000000000000001");
      expect(result?.pair).toBe("0xFBFBFBfB00000000000000000000000000000001");
      expect(result?.allPairsLength).toBe("0");
      expect(result?.contractAddress).toBe("0x0000000000000000000000000000000000000902");
      expect(result?.transactionHash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      expect(result?.blockNumber).toBe("0x12345");
    });

    it("should return null if no PairCreated event found", () => {
      const mockReceipt = {
        logs: [
          {
            topics: ["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"],
            data: "0x",
            address: "0x0000000000000000000000000000000000000902",
          },
        ],
      };

      const result = parsePairCreatedEvent(mockReceipt);

      expect(result).toBeNull();
    });

    it("should return null if no logs present", () => {
      const mockReceipt = {
        logs: [],
      };

      const result = parsePairCreatedEvent(mockReceipt);

      expect(result).toBeNull();
    });
  });

  describe("validateCreatePoolParams", () => {
    it("should validate correct parameters", () => {
      const params = {
        asset1: "0",
        asset2: "1",
      };

      const result = validateCreatePoolParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty asset1", () => {
      const params = {
        asset1: "",
        asset2: "1",
      };

      const result = validateCreatePoolParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Asset 1 is required");
    });

    it("should reject empty asset2", () => {
      const params = {
        asset1: "0",
        asset2: "",
      };

      const result = validateCreatePoolParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Asset 2 is required");
    });

    it("should reject same asset IDs", () => {
      const params = {
        asset1: "1",
        asset2: "1",
      };

      const result = validateCreatePoolParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Asset 1 and Asset 2 must be different");
    });

    it("should reject invalid asset IDs", () => {
      const params = {
        asset1: "invalid",
        asset2: "1",
      };

      const result = validateCreatePoolParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Asset 1 must be a valid asset ID");
    });

    it("should reject multiple invalid parameters", () => {
      const params = {
        asset1: "invalid",
        asset2: "also-invalid",
      };

      const result = validateCreatePoolParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Asset 1 must be a valid asset ID");
      expect(result.errors).toContain("Asset 2 must be a valid asset ID");
    });
  });

  describe("checkPoolExists", () => {
    it("should check if pool exists for given token pair", async () => {
      // Mock window.ethereum
      (global as any).window = {
        ethereum: {
          request: jest.fn().mockResolvedValue("0x0000000000000000000000000000000000000000000000000000000000000000"), // Zero address = pool doesn't exist
        },
      };

      const params = { asset1: "0", asset2: "1" };
      const result = await checkPoolExists(params);

      expect(result).toBe(false);
      expect((window as any).ethereum.request).toHaveBeenCalledWith({
        method: "eth_call",
        params: [
          {
            to: "0x0000000000000000000000000000000000000902",
            data: expect.stringMatching(/^0xe6a43905/), // getPair selector
          },
          "latest",
        ],
      });
    });

    it("should return true if pool exists", async () => {
      // Mock window.ethereum with non-zero address (pool exists)
      // The address needs to be 32 bytes (64 hex chars) for proper ABI decoding
      (global as any).window = {
        ethereum: {
          request: jest.fn().mockResolvedValue("0x0000000000000000000000000000000000000000000000000000000000000001"), // Non-zero address = pool exists
        },
      };

      const params = { asset1: "0", asset2: "222" };
      const result = await checkPoolExists(params);

      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      // Mock window.ethereum to throw error
      (global as any).window = {
        ethereum: {
          request: jest.fn().mockRejectedValue(new Error("RPC error")),
        },
      };

      const params = { asset1: "0", asset2: "1" };
      const result = await checkPoolExists(params);

      expect(result).toBe(false);
    });
  });
});
