import { useState, useCallback } from "react";
import { useAppContext } from "../../state";
import {
  CreatePoolParams,
  createCreatePoolTransactionWithGasEstimation,
  parsePairCreatedEvent,
  validateCreatePoolParams,
  checkPoolExists,
} from "../../services/evmPoolServices";
import { isMetamaskAccount } from "../../services/metamaskServices";
import { useNetworkValidation } from "./useNetworkValidation";
import { ActionType, TransactionStatus } from "../../app/types/enum";
import dotAcpToast from "../../app/util/toast";

/**
 * Waits for transaction confirmation
 */
const waitForTransactionConfirmation = async (txHash: string, maxWaitTime: number = 300000): Promise<any> => {
  const startTime = Date.now();

  if (!window.ethereum) {
    throw new Error("MetaMask not available for transaction confirmation");
  }

  console.log(`Waiting for transaction confirmation: ${txHash}`);

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });

      if (receipt) {
        console.log("✅ Transaction confirmed:", receipt);
        return receipt;
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error checking transaction confirmation:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error("Transaction confirmation timeout");
};

/**
 * Waits for block finalization after transaction confirmation
 */
const waitForBlockFinalization = async (blockNumber: string, maxWaitTime: number = 720000): Promise<any> => {
  const startTime = Date.now();

  if (!window.ethereum) {
    throw new Error("MetaMask not available for block finalization");
  }

  console.log(`Waiting for block finalization: ${blockNumber}`);

  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Get the latest block number
      const latestBlock = await window.ethereum.request({
        method: "eth_blockNumber",
      });

      const latestBlockNumber = parseInt(latestBlock, 16);
      const targetBlockNumber = parseInt(blockNumber, 16);

      // Check if we're at least 2 blocks ahead (finalization)
      if (latestBlockNumber >= targetBlockNumber + 2) {
        console.log(`Block finalized: ${blockNumber} (latest: ${latestBlockNumber})`);
        return { finalized: true, blockNumber: latestBlockNumber };
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error checking block finalization:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(`Block finalization timeout after ${maxWaitTime / 1000} seconds`);
};

/**
 * Gets block hash from transaction receipt
 */
const getBlockHashFromReceipt = async (receipt: any): Promise<string | null> => {
  if (!window.ethereum || !receipt.blockNumber) {
    return null;
  }

  try {
    // Get the block by number to extract the block hash
    const block = await window.ethereum.request({
      method: "eth_getBlockByNumber",
      params: [receipt.blockNumber, false], // false = return only block header
    });

    return block?.hash || null;
  } catch (error) {
    console.error("Failed to get block hash from receipt:", error);
    return null;
  }
};

/**
 * Decodes revert reason from failed transaction
 */
const decodeRevertReason = async (txHash: string): Promise<string | null> => {
  if (!window.ethereum) {
    return null;
  }

  try {
    // Get the transaction to get the input data
    const tx = await window.ethereum.request({
      method: "eth_getTransactionByHash",
      params: [txHash],
    });

    if (!tx) {
      return null;
    }

    // Try to call the same transaction to get the revert reason
    await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          from: tx.from,
          to: tx.to,
          data: tx.input,
        },
        tx.blockNumber,
      ],
    });

    return null; // If we get here, the call succeeded
  } catch (error: any) {
    // Extract revert reason from error message
    if (error.message && error.message.includes("revert")) {
      const match = error.message.match(/revert\s+(.+)/);
      if (match) {
        return match[1];
      }
    }

    return error.message || "Unknown revert reason";
  }
};

/**
 * Analyzes failed transaction
 */
const analyzeFailedTransaction = async (txHash: string, receipt: any): Promise<void> => {
  console.log("=== ANALYZING FAILED TRANSACTION ===");
  console.log("Transaction hash:", txHash);
  console.log("Receipt:", receipt);
  console.log("===================================");

  try {
    const revertReason = await decodeRevertReason(txHash);
    if (revertReason) {
      console.log("Revert reason:", revertReason);
    }
  } catch (error) {
    console.error("Failed to analyze transaction:", error);
  }
};

/**
 * Hook for handling EVM-based pool creation through the AssetConversion precompile
 * Works specifically with MetaMask connected accounts
 */
export const useEVMCreatePool = () => {
  const { state, dispatch } = useAppContext();
  const { validateCurrentNetwork, getCurrentChainId } = useNetworkValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPoolCreatedEvent, setLastPoolCreatedEvent] = useState<any>(null);

  /**
   * Executes a create pool transaction through MetaMask with proper status progression
   */
  const executeCreatePool = useCallback(
    async (params: CreatePoolParams): Promise<boolean> => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return false;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("EVM pool creation requires MetaMask connection");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        setLastPoolCreatedEvent(null);

        // Set global loading state to trigger transaction status system
        dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });

        // Start with preparing status
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.preparing });

        // Validate parameters
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.validatingInputs });

        console.log("=== POOL CREATION VALIDATION ===");
        console.log("Parameters:", params);

        const validation = validateCreatePoolParams(params);
        console.log("Validation result:", validation);

        if (!validation.isValid) {
          console.log("❌ Validation failed:", validation.errors);
          dotAcpToast.error(`Invalid pool creation parameters: ${validation.errors.join(", ")}`);
          return false;
        }

        console.log("✅ Validation passed");

        // Check if pool already exists
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.checkingBalances });

        console.log("=== CHECKING POOL EXISTENCE ===");
        console.log("About to call checkPoolExists with params:", params);

        try {
          const poolExists = await checkPoolExists(params);
          console.log("Pool exists result:", poolExists);

          if (poolExists) {
            console.log("❌ Pool already exists, aborting creation");
            dotAcpToast.error("Pool already exists for this token pair");
            return false;
          }

          console.log("✅ Pool doesn't exist, proceeding with creation");
        } catch (error) {
          console.error("❌ Error checking pool existence:", error);
          // Continue with creation attempt if pool check fails
          console.log("⚠️ Continuing with pool creation despite check error");
        }

        // Ensure MetaMask is available and connected
        if (!window.ethereum) {
          throw new Error("MetaMask not detected. Please install MetaMask.");
        }

        // Check if MetaMask is connected
        const isConnected = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (!isConnected || isConnected.length === 0) {
          throw new Error("MetaMask not connected. Please connect your account.");
        }

        // Validate current network
        const chainId = await getCurrentChainId();
        console.log("Current chain ID:", chainId);

        await validateCurrentNetwork();
        console.log("✅ Network validation passed");

        // Calculate route (gas estimation)
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.calculatingRoute });

        // Create transaction with gas estimation
        const transaction = await createCreatePoolTransactionWithGasEstimation(params, state.selectedAccount);

        if (!transaction) {
          throw new Error("Failed to create transaction");
        }

        // Ensure transaction has the correct structure for MetaMask
        const metamaskTransaction = {
          from: transaction.from,
          to: transaction.to,
          data: transaction.data,
          value: transaction.value || "0x0",
          ...(transaction.gas && { gas: transaction.gas }),
          ...(transaction.gasPrice && { gasPrice: transaction.gasPrice }),
          ...(transaction.maxFeePerGas && { maxFeePerGas: transaction.maxFeePerGas }),
          ...(transaction.maxPriorityFeePerGas && { maxPriorityFeePerGas: transaction.maxPriorityFeePerGas }),
        };

        console.log("MetaMask transaction object:", metamaskTransaction);

        // Ensure we have the correct account selected in MetaMask
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found in MetaMask");
        }

        // Verify the account matches
        const currentAccount = accounts[0];
        if (currentAccount.toLowerCase() !== state.selectedAccount.evmAddress.toLowerCase()) {
          throw new Error("MetaMask account does not match selected account");
        }

        // Ensure we're using MetaMask's provider directly
        if (!window.ethereum || !window.ethereum.request) {
          throw new Error("MetaMask provider not available");
        }

        // Signing status (user interaction)
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.signing });

        // Request MetaMask to send the transaction
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [metamaskTransaction],
        });

        console.log("Transaction submitted, waiting for confirmation:", txHash);
        dotAcpToast.success(`Transaction submitted: ${txHash.substring(0, 10)}...`);

        // Waiting for new block
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForNewBlock });

        // Wait for transaction confirmation
        try {
          const receipt = await waitForTransactionConfirmation(txHash);

          if (receipt.status === "0x1") {
            console.log("✅ Transaction confirmed successfully");

            // Waiting for confirmation
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForConfirmation });

            // Parse PairCreated event from the transaction receipt
            const pairCreatedEvent = parsePairCreatedEvent(receipt);

            if (pairCreatedEvent) {
              console.log("PairCreated event parsed successfully:", pairCreatedEvent);

              // Store the pair created event data for UI access
              setLastPoolCreatedEvent(pairCreatedEvent);

              // Log detailed pool creation information
              console.log("=== PAIR CREATED EVENT DETAILS ===");
              console.log("Token0:", pairCreatedEvent.token0);
              console.log("Token1:", pairCreatedEvent.token1);
              console.log("Pair Address:", pairCreatedEvent.pair);
              console.log("All Pairs Length:", pairCreatedEvent.allPairsLength);
              console.log("Contract:", pairCreatedEvent.contractAddress);
              console.log("Transaction Hash:", pairCreatedEvent.transactionHash);
              console.log("Block Number:", pairCreatedEvent.blockNumber);
              console.log("=================================");
            } else {
              console.warn("No PairCreated event found in transaction receipt");
              setLastPoolCreatedEvent(null);
            }

            // Waiting for finalization
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForFinalization });

            // Wait for block finalization (at least 2 blocks ahead)
            const finalizationResult = await waitForBlockFinalization(receipt.blockNumber);
            console.log("✅ Block finalized:", finalizationResult);

            // Get block hash for explorer link
            const blockHash = await getBlockHashFromReceipt(receipt);
            if (blockHash) {
              dispatch({ type: ActionType.SET_BLOCK_HASH_FINALIZED, payload: blockHash });
              console.log("✅ Block hash set for explorer link:", blockHash);
            }

            // Finalizing
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.finalizing });

            // Update balances (handled by MetaMask)
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.updatingBalances });

            // Show success modal
            dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });

            // Clear gas fees
            dispatch({ type: ActionType.SET_SWAP_GAS_FEES_MESSAGE, payload: "" });
            dispatch({ type: ActionType.SET_SWAP_GAS_FEE, payload: "" });

            // Stop loading
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: null });

            return true;
          } else {
            // Transaction failed - analyze and try to get revert reason
            console.error("Transaction failed:", receipt);

            // Analyze the failed transaction
            await analyzeFailedTransaction(txHash, receipt);

            try {
              const revertReason = await decodeRevertReason(txHash);
              const errorMessage = revertReason
                ? `Transaction failed: ${revertReason}`
                : "Transaction failed on blockchain";

              console.error("Revert reason:", revertReason);
              dotAcpToast.error(
                `Pool creation failed! ${revertReason || "Unknown error"}. Tx: ${txHash.substring(0, 10)}...`
              );
              setError(errorMessage);
            } catch (revertError) {
              console.error("Failed to decode revert reason:", revertError);
              dotAcpToast.error(`Pool creation transaction failed! Tx: ${txHash.substring(0, 10)}...`);
              setError("Transaction failed on blockchain");
            }

            return false;
          }
        } catch (confirmationError: any) {
          if (confirmationError.message.includes("timeout")) {
            dotAcpToast.error(`Transaction submitted but confirmation timeout. Check: ${txHash.substring(0, 10)}...`);
            console.warn("Transaction confirmation timeout:", txHash);
            return true; // Still consider it successful since it was submitted
          } else {
            throw confirmationError;
          }
        }
      } catch (error: any) {
        const errorMessage =
          error.code === 4001 ? "Transaction rejected by user" : `Pool creation failed: ${error.message}`;
        setError(errorMessage);
        console.error("Pool creation transaction error:", error);

        if (error.code === 4001) {
          dotAcpToast.error("Transaction rejected by user");
        } else {
          dotAcpToast.error(`Pool creation failed: ${error.message}`);
        }
        return false;
      } finally {
        setIsLoading(false);
        // Clear global loading state
        dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
      }
    },
    [state.selectedAccount, dispatch, getCurrentChainId, validateCurrentNetwork, state.api]
  );

  /**
   * Checks if EVM pool creation can be performed
   */
  const canPerformEVMCreatePool = useCallback(() => {
    return state.selectedAccount && isMetamaskAccount(state.selectedAccount);
  }, [state.selectedAccount]);

  return {
    executeCreatePool,
    canPerformEVMCreatePool,
    isLoading,
    error,
    lastPoolCreatedEvent,
  };
};
