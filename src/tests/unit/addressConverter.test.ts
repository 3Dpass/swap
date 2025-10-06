import {
  convertEvmToSubstrateAddress,
  isValidEvmAddress,
  isValidSubstrateAddress,
} from "../../app/util/addressConverter";

describe("Address Converter", () => {
  describe("convertEvmToSubstrateAddress", () => {
    it("should convert a valid EVM address to Substrate address", () => {
      const evmAddress = "0xdF4993F7741B1295D6A9b4eced2790C2165f085c";
      const expectedSubstrateAddress = "d1GXHj9QJZVPNot9sFenNrBECQpzetEVRSecPvZwMarmZHYtT";
      const ss58Format = 71; // 3Dpass mainnet format

      const result = convertEvmToSubstrateAddress(evmAddress, ss58Format);
      expect(result).toBe(expectedSubstrateAddress);
    });

    it("should handle EVM address without 0x prefix", () => {
      const evmAddress = "dF4993F7741B1295D6A9b4eced2790C2165f085c";
      const expectedSubstrateAddress = "d1GXHj9QJZVPNot9sFenNrBECQpzetEVRSecPvZwMarmZHYtT";
      const ss58Format = 71; // 3Dpass mainnet format

      const result = convertEvmToSubstrateAddress(evmAddress, ss58Format);
      expect(result).toBe(expectedSubstrateAddress);
    });

    it("should throw error for invalid EVM address", () => {
      const invalidAddress = "invalid-address";
      const ss58Format = 71;

      expect(() => {
        convertEvmToSubstrateAddress(invalidAddress, ss58Format);
      }).toThrow();
    });

    it("should use custom SS58 format when provided", () => {
      const evmAddress = "0xdF4993F7741B1295D6A9b4eced2790C2165f085c";
      const customSs58Format = 0; // Polkadot format
      const expectedSubstrateAddress = "15GaAcGbNfkGBRjY7Q1JKBV8i4GnGktXn4kcLEgDXkgqTg11";

      const result = convertEvmToSubstrateAddress(evmAddress, customSs58Format);
      expect(result).toBe(expectedSubstrateAddress);
    });
  });

  describe("isValidEvmAddress", () => {
    it("should return true for valid EVM addresses", () => {
      expect(isValidEvmAddress("0xdF4993F7741B1295D6A9b4eced2790C2165f085c")).toBe(true);
      expect(isValidEvmAddress("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6")).toBe(true);
    });

    it("should return false for invalid EVM addresses", () => {
      expect(isValidEvmAddress("invalid-address")).toBe(false);
      expect(isValidEvmAddress("0x123")).toBe(false);
      expect(isValidEvmAddress("dF4993F7741B1295D6A9b4eced2790C2165f085c")).toBe(false);
      expect(isValidEvmAddress("")).toBe(false);
    });
  });

  describe("isValidSubstrateAddress", () => {
    it("should return true for valid Substrate addresses", () => {
      expect(isValidSubstrateAddress("d1GXHj9QJZVPNot9sFenNrBECQpzetEVRSecPvZwMarmZHYtT")).toBe(true);
      expect(isValidSubstrateAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")).toBe(true);
    });

    it("should return false for invalid Substrate addresses", () => {
      expect(isValidSubstrateAddress("invalid-address")).toBe(false);
      expect(isValidSubstrateAddress("0xdF4993F7741B1295D6A9b4eced2790C2165f085c")).toBe(false);
      expect(isValidSubstrateAddress("")).toBe(false);
      expect(isValidSubstrateAddress("short")).toBe(false);
    });
  });
});
