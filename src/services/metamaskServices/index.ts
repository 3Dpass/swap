import { convertEvmToSubstrateAddress, isValidEvmAddress } from "../../app/util/addressConverter";
import type { WalletAccount } from "@talismn/connect-wallets";

// Extend the window object to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface MetamaskAccount extends Omit<WalletAccount, "wallet"> {
  evmAddress: string;
  substrateAddress: string;
  walletType: "metamask";
  wallet: {
    extensionName: string;
    title: string;
    installUrl: string;
    logo: {
      src: string;
      alt: string;
    };
  };
}

/**
 * Union type for all supported wallet accounts
 */
export type UnifiedWalletAccount = WalletAccount | MetamaskAccount;

/**
 * Type guard to check if an account is a MetaMask account
 */
export const isMetamaskAccount = (account: UnifiedWalletAccount): account is MetamaskAccount => {
  return "walletType" in account && account.walletType === "metamask";
};

/**
 * Converts a unified wallet account to a standard WalletAccount for compatibility
 * This is needed for functions that expect the standard WalletAccount interface
 */
export const toStandardWalletAccount = (account: UnifiedWalletAccount): WalletAccount => {
  if (isMetamaskAccount(account)) {
    // For MetaMask accounts, we need to create a compatible WalletAccount
    // We'll use the substrate address as the main address and create a minimal wallet object
    return {
      ...account,
      address: account.substrateAddress, // Use the converted substrate address
      wallet: {
        extensionName: "metamask",
        title: "MetaMask",
        installUrl: "https://metamask.io/download/",
        logo: {
          src: "/src/assets/img/MetaMask-icon-fox.svg",
          alt: "MetaMask",
        },
        installed: true,
        extension: null, // MetaMask doesn't use the standard extension interface
        signer: null, // MetaMask uses its own signing interface
        enable: async () => {}, // No-op for MetaMask
        getAccounts: async () => [], // No-op for MetaMask
        subscribeAccounts: () => () => {}, // No-op for MetaMask
      } as any, // Type assertion to satisfy the Wallet interface
    };
  }
  return account;
};

/**
 * Checks if MetaMask is installed and available
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask === true;
};

/**
 * Requests connection to MetaMask and returns the connected accounts
 */
export const connectMetaMask = async (): Promise<string[]> => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  try {
    // Request account access
    const accounts = await window.ethereum!.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect an account in MetaMask.");
    }

    return accounts;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection request.");
    }
    throw new Error(`Failed to connect to MetaMask: ${error.message}`);
  }
};

/**
 * Converts MetaMask accounts to WalletAccount format with substrate addresses
 */
export const convertMetaMaskAccountsToWalletAccounts = async (
  evmAccounts: string[],
  ss58Format: number
): Promise<MetamaskAccount[]> => {
  const walletAccounts: MetamaskAccount[] = [];

  for (const evmAddress of evmAccounts) {
    if (!isValidEvmAddress(evmAddress)) {
      console.warn(`Invalid EVM address format: ${evmAddress}`);
      continue;
    }

    try {
      const substrateAddress = convertEvmToSubstrateAddress(evmAddress, ss58Format);

      const walletAccount: MetamaskAccount = {
        address: substrateAddress, // Use substrate address as the main address for UI
        evmAddress: evmAddress, // Keep original EVM address for transactions
        substrateAddress: substrateAddress,
        name: `MetaMask ${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`,
        source: "metamask",
        wallet: {
          extensionName: "metamask",
          title: "MetaMask",
          installUrl: "https://metamask.io/download/",
          logo: {
            src: "/src/assets/img/MetaMask-icon-fox.svg",
            alt: "MetaMask",
          },
        },
        walletType: "metamask",
      };

      walletAccounts.push(walletAccount);
    } catch (error) {
      console.error(`Failed to convert EVM address ${evmAddress}:`, error);
    }
  }

  return walletAccounts;
};
