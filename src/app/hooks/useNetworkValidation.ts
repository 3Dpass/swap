import { useCallback } from "react";
import { getNetworkByChainId } from "../../networkConfig";

/**
 * Hook for network validation functionality
 */
export const useNetworkValidation = () => {
  /**
   * Validates if the current MetaMask chain ID matches the expected network
   */
  const validateNetwork = useCallback(async (expectedChainId: number): Promise<boolean> => {
    if (!window.ethereum) {
      throw new Error("MetaMask not available");
    }

    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      const currentChainIdNumber = parseInt(currentChainId, 16);
      return currentChainIdNumber === expectedChainId;
    } catch (error) {
      console.error("Failed to get chain ID:", error);
      return false;
    }
  }, []);

  /**
   * Validates the current network and returns network config if valid
   */
  const validateCurrentNetwork = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not available");
    }

    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      const currentChainIdNumber = parseInt(currentChainId, 16);
      const networkConfig = getNetworkByChainId(currentChainIdNumber);

      if (!networkConfig) {
        throw new Error(
          `Unsupported network. Chain ID ${currentChainIdNumber} is not supported. Please switch to the 3Dpass network (Chain ID: 1333).`
        );
      }

      const isNetworkValid = await validateNetwork(networkConfig.chainId);
      if (!isNetworkValid) {
        throw new Error(
          `Network mismatch. Expected Chain ID ${networkConfig.chainId}, but got ${currentChainIdNumber}. Please switch to the correct network.`
        );
      }

      console.log("✅ Network validation passed:", {
        chainId: currentChainIdNumber,
        network: networkConfig.nativeTokenSymbol,
        rpcUrl: networkConfig.rpcUrl,
      });

      return {
        isValid: true,
        networkConfig,
        chainId: currentChainIdNumber,
      };
    } catch (error) {
      console.error("Network validation failed:", error);
      throw error;
    }
  }, [validateNetwork]);

  /**
   * Gets the current chain ID from MetaMask
   */
  const getCurrentChainId = useCallback(async (): Promise<number> => {
    if (!window.ethereum) {
      throw new Error("MetaMask not available");
    }

    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      return parseInt(currentChainId, 16);
    } catch (error) {
      console.error("Failed to get chain ID:", error);
      throw error;
    }
  }, []);

  return {
    validateNetwork,
    validateCurrentNetwork,
    getCurrentChainId,
  };
};
