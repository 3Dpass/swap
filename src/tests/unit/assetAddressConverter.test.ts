import {
  convertAssetIdToEVMAddress,
  convertAssetIdToLiquidityPoolAddress,
  extractAssetIdFromEVMAddress,
  getEVMAddressType,
  isAssetContractAddress,
  isLiquidityPoolTokenAddress,
  isValidAssetEVMAddress,
  batchConvertAssetIds,
} from "../../app/util/assetAddressConverter";

describe("Asset Address Converter", () => {
  describe("convertAssetIdToEVMAddress", () => {
    it("should convert asset ID 222 to correct EVM address", () => {
      const assetId = 222;
      const expectedAddress = "0xfBFBfbFA000000000000000000000000000000de";

      const result = convertAssetIdToEVMAddress(assetId);
      expect(result).toBe(expectedAddress);
    });

    it("should convert asset ID 0 to P3D precompile address", () => {
      const assetId = 0;
      const expectedAddress = "0x0000000000000000000000000000000000000802";

      const result = convertAssetIdToEVMAddress(assetId);
      expect(result).toBe(expectedAddress);
    });

    it("should convert asset ID 1 to correct EVM address", () => {
      const assetId = 1;
      const expectedAddress = "0xfbfBfbFa00000000000000000000000000000001";

      const result = convertAssetIdToEVMAddress(assetId);
      expect(result).toBe(expectedAddress);
    });

    it("should handle string asset IDs", () => {
      const assetId = "222";
      const expectedAddress = "0xfBFBfbFA000000000000000000000000000000de";

      const result = convertAssetIdToEVMAddress(assetId);
      expect(result).toBe(expectedAddress);
    });

    it("should throw error for invalid asset ID", () => {
      expect(() => convertAssetIdToEVMAddress(-1)).toThrow("Invalid asset ID: -1");
      expect(() => convertAssetIdToEVMAddress("invalid")).toThrow("Invalid asset ID: invalid");
    });
  });

  describe("convertAssetIdToLiquidityPoolAddress", () => {
    it("should convert asset ID 222 to correct liquidity pool address", () => {
      const assetId = 222;
      const expectedAddress = "0xfbfBFBFB000000000000000000000000000000dE";

      const result = convertAssetIdToLiquidityPoolAddress(assetId);
      expect(result).toBe(expectedAddress);
    });

    it("should convert asset ID 0 to correct liquidity pool address", () => {
      const assetId = 0;
      const expectedAddress = "0xfbfBfBfb00000000000000000000000000000000";

      const result = convertAssetIdToLiquidityPoolAddress(assetId);
      expect(result).toBe(expectedAddress);
    });
  });

  describe("extractAssetIdFromEVMAddress", () => {
    it("should extract asset ID 222 from asset address", () => {
      const evmAddress = "0xFBFBFBFA000000000000000000000000000000DE";
      const expectedAssetId = 222;

      const result = extractAssetIdFromEVMAddress(evmAddress);
      expect(result).toBe(expectedAssetId);
    });

    it("should extract asset ID 222 from liquidity pool address", () => {
      const evmAddress = "0xFBFBFBFB000000000000000000000000000000DE";
      const expectedAssetId = 222;

      const result = extractAssetIdFromEVMAddress(evmAddress);
      expect(result).toBe(expectedAssetId);
    });

    it("should extract asset ID 0 from P3D precompile address", () => {
      const evmAddress = "0x0000000000000000000000000000000000000802";
      const expectedAssetId = 0;

      const result = extractAssetIdFromEVMAddress(evmAddress);
      expect(result).toBe(expectedAssetId);
    });

    it("should throw error for invalid address format", () => {
      expect(() => extractAssetIdFromEVMAddress("0x1234567890123456789012345678901234567890")).toThrow(
        "Invalid EVM asset address format: 0x1234567890123456789012345678901234567890"
      );
    });
  });

  describe("getEVMAddressType", () => {
    it("should identify asset contract addresses", () => {
      const assetAddress = "0xFBFBFBFA000000000000000000000000000000DE";
      const result = getEVMAddressType(assetAddress);
      expect(result).toBe("asset");
    });

    it("should identify liquidity pool token addresses", () => {
      const poolAddress = "0xFBFBFBFB000000000000000000000000000000DE";
      const result = getEVMAddressType(poolAddress);
      expect(result).toBe("liquidity-pool");
    });

    it("should identify unknown addresses", () => {
      const unknownAddress = "0x1234567890123456789012345678901234567890";
      const result = getEVMAddressType(unknownAddress);
      expect(result).toBe("unknown");
    });
  });

  describe("isAssetContractAddress", () => {
    it("should return true for asset contract addresses", () => {
      const assetAddress = "0xFBFBFBFA000000000000000000000000000000DE";
      expect(isAssetContractAddress(assetAddress)).toBe(true);
    });

    it("should return true for P3D precompile address", () => {
      const p3dAddress = "0x0000000000000000000000000000000000000802";
      expect(isAssetContractAddress(p3dAddress)).toBe(true);
    });

    it("should return false for liquidity pool addresses", () => {
      const poolAddress = "0xFBFBFBFB000000000000000000000000000000DE";
      expect(isAssetContractAddress(poolAddress)).toBe(false);
    });

    it("should return false for other addresses", () => {
      const otherAddress = "0x1234567890123456789012345678901234567890";
      expect(isAssetContractAddress(otherAddress)).toBe(false);
    });
  });

  describe("isLiquidityPoolTokenAddress", () => {
    it("should return true for liquidity pool token addresses", () => {
      const poolAddress = "0xFBFBFBFB000000000000000000000000000000DE";
      expect(isLiquidityPoolTokenAddress(poolAddress)).toBe(true);
    });

    it("should return false for asset contract addresses", () => {
      const assetAddress = "0xFBFBFBFA000000000000000000000000000000DE";
      expect(isLiquidityPoolTokenAddress(assetAddress)).toBe(false);
    });

    it("should return false for other addresses", () => {
      const otherAddress = "0x1234567890123456789012345678901234567890";
      expect(isLiquidityPoolTokenAddress(otherAddress)).toBe(false);
    });
  });

  describe("isValidAssetEVMAddress", () => {
    it("should return true for valid asset addresses", () => {
      const assetAddress = "0xFBFBFBFA000000000000000000000000000000DE";
      expect(isValidAssetEVMAddress(assetAddress)).toBe(true);
    });

    it("should return true for P3D precompile address", () => {
      const p3dAddress = "0x0000000000000000000000000000000000000802";
      expect(isValidAssetEVMAddress(p3dAddress)).toBe(true);
    });

    it("should return true for valid liquidity pool addresses", () => {
      const poolAddress = "0xFBFBFBFB000000000000000000000000000000DE";
      expect(isValidAssetEVMAddress(poolAddress)).toBe(true);
    });

    it("should return false for invalid hex addresses", () => {
      const invalidAddress = "0xINVALID";
      expect(isValidAssetEVMAddress(invalidAddress)).toBe(false);
    });

    it("should return false for addresses with wrong length", () => {
      const shortAddress = "0xFBFBFBFA";
      expect(isValidAssetEVMAddress(shortAddress)).toBe(false);
    });

    it("should return false for addresses with wrong prefix", () => {
      const wrongPrefixAddress = "0x1234567890123456789012345678901234567890";
      expect(isValidAssetEVMAddress(wrongPrefixAddress)).toBe(false);
    });
  });

  describe("batchConvertAssetIds", () => {
    it("should convert multiple asset IDs to asset addresses", () => {
      const assetIds = [0, 1, 222];
      const expected = {
        "0": "0x0000000000000000000000000000000000000802",
        "1": "0xfbfBfbFa00000000000000000000000000000001",
        "222": "0xfBFBfbFA000000000000000000000000000000de",
      };

      const result = batchConvertAssetIds(assetIds, "asset");
      expect(result).toEqual(expected);
    });

    it("should convert multiple asset IDs to liquidity pool addresses", () => {
      const assetIds = [0, 1, 222];
      const expected = {
        "0": "0xfbfBfBfb00000000000000000000000000000000",
        "1": "0xFBFBFBfB00000000000000000000000000000001",
        "222": "0xfbfBFBFB000000000000000000000000000000dE",
      };

      const result = batchConvertAssetIds(assetIds, "liquidity-pool");
      expect(result).toEqual(expected);
    });

    it("should handle mixed valid and invalid asset IDs", () => {
      const assetIds = [0, -1, 222, "invalid"];
      const result = batchConvertAssetIds(assetIds, "asset");

      // Should only include valid conversions
      expect(result).toHaveProperty("0");
      expect(result).toHaveProperty("222");
      expect(result).not.toHaveProperty("-1");
      expect(result).not.toHaveProperty("invalid");
    });
  });
});
