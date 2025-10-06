import { evmToAddress } from "@polkadot/util-crypto";

/**
 * Converts an Ethereum (H160) address to a Substrate (SS58) address
 * This function prefixes the Ethereum address with 'evm:', hashes it using Blake2,
 * and encodes it to the SS58 format for use in Substrate-based applications.
 *
 * @param evmAddress - The Ethereum address (H160 format) starting with 0x
 * @param ss58Format - The SS58 format to use for encoding (should come from network config)
 * @returns The converted Substrate address in SS58 format
 *
 * @example
 * const evmAddress = '0x067Fac51f31Dc80263D55f9980DF1358357DC10d';
 * const { ss58Format } = useGetNetwork();
 * const substrateAddress = convertEvmToSubstrateAddress(evmAddress, ss58Format);
 * console.log(substrateAddress); // 3Dpass SS58 format address
 */
export const convertEvmToSubstrateAddress = (evmAddress: string, ss58Format: number): string => {
  try {
    // Remove 0x prefix if present
    const cleanEvmAddress = evmAddress.startsWith("0x") ? evmAddress.slice(2) : evmAddress;

    // Add 0x prefix back for proper formatting
    const formattedEvmAddress = `0x${cleanEvmAddress}`;

    // Convert using polkadot's evmToAddress function
    return evmToAddress(formattedEvmAddress, ss58Format);
  } catch (error) {
    console.error("Error converting EVM address to Substrate address:", error);
    throw new Error(`Failed to convert EVM address ${evmAddress} to Substrate address: ${error}`);
  }
};

/**
 * Validates if an address is a valid Ethereum address format
 * @param address - The address to validate
 * @returns true if the address is a valid Ethereum address format
 */
export const isValidEvmAddress = (address: string): boolean => {
  // Ethereum address should be 42 characters long (including 0x prefix)
  // and contain only hexadecimal characters
  const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmAddressRegex.test(address);
};

/**
 * Validates if an address is a valid Substrate address format
 * @param address - The address to validate
 * @returns true if the address is a valid Substrate address format
 */
export const isValidSubstrateAddress = (address: string): boolean => {
  // Substrate addresses typically start with specific characters and have variable length
  // This is a basic validation - more sophisticated validation would require decoding
  return address.length > 40 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
};
