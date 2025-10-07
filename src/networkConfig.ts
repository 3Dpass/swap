import { NetworkKeys } from "./app/types/enum";
import { EVM_PRECOMPILES } from "./config/evmPrecompiles";

type NetworkConfig = {
  nativeTokenSymbol: string;
  rpcUrl: string;
  parents: number;
  assethubSubscanUrl?: string;
  ss58Format: number;
  evmPrecompiles: typeof EVM_PRECOMPILES;
  chainId: number;
};

export const NETWORKS: Record<NetworkKeys, NetworkConfig> = {
  [NetworkKeys.P3D]: {
    nativeTokenSymbol: "P3D",
    rpcUrl: "wss://rpc.3dpass.org",
    parents: 1,
    assethubSubscanUrl: "https://3dpscan.xyz",
    ss58Format: 71,
    evmPrecompiles: EVM_PRECOMPILES,
    chainId: 1333,
  },
};

/**
 * Gets the network configuration for a given chain ID
 */
export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return Object.values(NETWORKS).find((network) => network.chainId === chainId);
};
