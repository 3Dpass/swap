import { NetworkKeys } from "./app/types/enum";

type NetworkConfig = {
  nativeTokenSymbol: string;
  rpcUrl: string;
  parents: number;
  assethubSubscanUrl?: string;
};

export const NETWORKS: Record<NetworkKeys, NetworkConfig> = {
  [NetworkKeys.P3D]: {
    nativeTokenSymbol: "P3D",
    rpcUrl: "wss://rpc.3dpscan.io",
    parents: 1,
    assethubSubscanUrl: "https://explorer.3dpassmining.info/",
  },
};
