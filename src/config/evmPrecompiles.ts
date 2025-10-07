/**
 * EVM Precompile addresses for 3Dpass network
 * These are special contract addresses that map to native Substrate functionality
 */

export const EVM_PRECOMPILES = {
  /**
   * AssetConversion precompile address
   * Used for asset conversion operations on the 3Dpass network
   */
  ASSET_CONVERSION: "0x0000000000000000000000000000000000000902",
} as const;

/**
 * Type for EVM precompile addresses
 */
export type EvmPrecompileAddress = (typeof EVM_PRECOMPILES)[keyof typeof EVM_PRECOMPILES];
