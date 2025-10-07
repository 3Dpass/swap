/**
 * Asset Address Converter for 3Dpass Network
 * Converts Substrate asset IDs to EVM H160 contract addresses with EIP-55 checksumming
 */

import { ethers } from "ethers";

/**
 * Converts a Substrate asset ID to an EVM H160 contract address
 * Special case: Asset ID 0 (native P3D token) uses the P3D precompile address
 * Other assets: 0xFBFBFBFA + <assetid in hex> (padded to 32 bytes)
 *
 * @param assetId - The Substrate asset ID (number or string)
 * @returns The EVM H160 contract address
 */
export const convertAssetIdToEVMAddress = (assetId: number | string): string => {
  // Convert to number if string
  const numericAssetId = typeof assetId === "string" ? parseInt(assetId, 10) : assetId;

  // Validate input
  if (isNaN(numericAssetId) || numericAssetId < 0) {
    throw new Error(`Invalid asset ID: ${assetId}`);
  }

  // Special case: Native P3D token (asset ID 0) uses the P3D precompile address
  if (numericAssetId === 0) {
    return ethers.utils.getAddress("0x0000000000000000000000000000000000000802");
  }

  // Convert to hex and remove '0x' prefix if present
  let hexAssetId = numericAssetId.toString(16).toUpperCase();

  // Pad to 32 characters (16 bytes = 32 hex chars)
  // The prefix 0xFBFBFBFA is 4 bytes, so we need 16 bytes for the asset ID to make total 20 bytes
  // Total address length: 4 bytes (prefix) + 16 bytes (asset ID) = 20 bytes = 40 hex chars
  hexAssetId = hexAssetId.padStart(32, "0");

  // Construct the EVM address
  const rawAddress = `0xFBFBFBFA${hexAssetId}`;

  // Apply EIP-55 checksumming
  return ethers.utils.getAddress(rawAddress);
};

/**
 * Converts a Substrate asset ID to an EVM H160 liquidity pool token address
 * Format: 0xFBFBFBFB + <assetid in hex> (padded to 32 bytes)
 *
 * @param assetId - The Substrate asset ID (number or string)
 * @returns The EVM H160 liquidity pool token address
 */
export const convertAssetIdToLiquidityPoolAddress = (assetId: number | string): string => {
  // Convert to number if string
  const numericAssetId = typeof assetId === "string" ? parseInt(assetId, 10) : assetId;

  // Validate input
  if (isNaN(numericAssetId) || numericAssetId < 0) {
    throw new Error(`Invalid asset ID: ${assetId}`);
  }

  // Convert to hex and remove '0x' prefix if present
  let hexAssetId = numericAssetId.toString(16).toUpperCase();

  // Pad to 32 characters (16 bytes = 32 hex chars)
  // The prefix 0xFBFBFBFB is 4 bytes, so we need 16 bytes for the asset ID to make total 20 bytes
  // Total address length: 4 bytes (prefix) + 16 bytes (asset ID) = 20 bytes = 40 hex chars
  hexAssetId = hexAssetId.padStart(32, "0");

  // Construct the EVM address
  const rawAddress = `0xFBFBFBFB${hexAssetId}`;

  // Apply EIP-55 checksumming
  return ethers.utils.getAddress(rawAddress);
};

/**
 * Extracts the asset ID from an EVM H160 contract address
 *
 * @param evmAddress - The EVM H160 contract address
 * @returns The original Substrate asset ID
 */
export const extractAssetIdFromEVMAddress = (evmAddress: string): number => {
  // Normalize the address to lowercase for comparison
  const normalizedAddress = evmAddress.toLowerCase();

  // Special case: P3D precompile address for native token (check both checksummed and lowercase)
  if (normalizedAddress === "0x0000000000000000000000000000000000000802") {
    return 0;
  }

  // Validate address format (check against lowercase prefixes)
  if (!normalizedAddress.startsWith("0xfbfbfbfa") && !normalizedAddress.startsWith("0xfbfbfbfb")) {
    throw new Error(`Invalid EVM asset address format: ${evmAddress}`);
  }

  // Extract the hex part after the prefix (32 characters for the asset ID)
  const hexAssetId = normalizedAddress.slice(10, 42); // Remove '0xfbfbfbfa' or '0xfbfbfbfb' and take 32 chars

  // Convert back to decimal
  const assetId = parseInt(hexAssetId, 16);

  return assetId;
};

/**
 * Checks if an EVM address is an asset contract address
 *
 * @param evmAddress - The EVM address to check
 * @returns True if it's an asset contract address
 */
export const isAssetContractAddress = (evmAddress: string): boolean => {
  const normalizedAddress = evmAddress.toLowerCase();
  return (
    normalizedAddress.startsWith("0xfbfbfbfa") || normalizedAddress === "0x0000000000000000000000000000000000000802"
  );
};

/**
 * Checks if an EVM address is a liquidity pool token address
 *
 * @param evmAddress - The EVM address to check
 * @returns True if it's a liquidity pool token address
 */
export const isLiquidityPoolTokenAddress = (evmAddress: string): boolean => {
  const normalizedAddress = evmAddress.toLowerCase();
  return normalizedAddress.startsWith("0xfbfbfbfb");
};

/**
 * Gets the address type for an EVM address
 *
 * @param evmAddress - The EVM address to check
 * @returns The type of address
 */
export const getEVMAddressType = (evmAddress: string): "asset" | "liquidity-pool" | "unknown" => {
  if (isAssetContractAddress(evmAddress)) {
    return "asset";
  } else if (isLiquidityPoolTokenAddress(evmAddress)) {
    return "liquidity-pool";
  } else {
    return "unknown";
  }
};

/**
 * Batch converts multiple asset IDs to EVM addresses
 *
 * @param assetIds - Array of asset IDs to convert
 * @param type - Type of addresses to generate ('asset' or 'liquidity-pool')
 * @returns Object mapping asset IDs to EVM addresses
 */
export const batchConvertAssetIds = (
  assetIds: (number | string)[],
  type: "asset" | "liquidity-pool" = "asset"
): Record<string, string> => {
  const result: Record<string, string> = {};

  assetIds.forEach((assetId) => {
    const key = assetId.toString();
    try {
      if (type === "asset") {
        result[key] = convertAssetIdToEVMAddress(assetId);
      } else {
        result[key] = convertAssetIdToLiquidityPoolAddress(assetId);
      }
    } catch (error) {
      console.warn(`Failed to convert asset ID ${assetId}:`, error);
    }
  });

  return result;
};

/**
 * Validates an EVM asset address format
 *
 * @param evmAddress - The EVM address to validate
 * @returns True if the address format is valid
 */
export const isValidAssetEVMAddress = (evmAddress: string): boolean => {
  // Check if it's a valid hex address
  if (!/^0x[0-9a-fA-F]{40}$/.test(evmAddress)) {
    return false;
  }

  // Normalize for comparison
  const normalizedAddress = evmAddress.toLowerCase();

  // Check if it has the correct prefix or is the P3D precompile address
  return (
    normalizedAddress.startsWith("0xfbfbfbfa") ||
    normalizedAddress.startsWith("0xfbfbfbfb") ||
    normalizedAddress === "0x0000000000000000000000000000000000000802"
  );
};

/**
 * Ensures an address is properly checksummed according to EIP-55
 *
 * @param address - The address to checksum
 * @returns The EIP-55 checksummed address
 */
export const ensureChecksummedAddress = (address: string): string => {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    throw new Error(`Invalid address format: ${address}`);
  }
};
