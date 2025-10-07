import { useState, useCallback } from "react";
import { useAppContext } from "../../state";
import {
  SwapParams,
  SwapQuote,
  GasEstimateWithDisplay,
  createSwapTransactionWithGasEstimation,
  estimateSwapGas,
  getGasEstimateWithDisplay,
  getSwapQuote,
  validateSwapParamsWithDeadline,
  calculateSlippage,
  formatAmount,
  toWei,
  getCurrentBlockTime,
} from "../../services/evmSwapServices";
import { isMetamaskAccount } from "../../services/metamaskServices";
import { useNetworkValidation } from "./useNetworkValidation";
import { ActionType, TransactionStatus } from "../../app/types/enum";
import dotAcpToast from "../../app/util/toast";

/**
 * Extracts deadline from transaction data
 */
const extractDeadlineFromTransactionData = (data: string): number | null => {
  try {
    // The deadline is the last parameter in the function call
    // For swapExactTokensForTokens: (uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)
    // The deadline is at offset 266 (0x10A) from the start of the data
    const deadlineHex = data.slice(266, 330); // 64 characters = 32 bytes
    return parseInt(deadlineHex, 16);
  } catch (error) {
    console.error("Failed to extract deadline from transaction data:", error);
    return null;
  }
};

/**
 * Parses Swap event from transaction receipt
 * Event signature: Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)
 * Event selector: 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822
 */
const parseSwapEvent = (receipt: any) => {
  if (!receipt.logs || !Array.isArray(receipt.logs)) {
    return null;
  }

  // Look for Swap event (selector: 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822)
  const swapEvent = receipt.logs.find(
    (log: any) => log.topics && log.topics[0] === "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
  );

  if (!swapEvent) {
    return null;
  }

  try {
    // Parse the event data
    // topics[0] = event signature
    // topics[1] = sender (indexed)
    // topics[2] = to (indexed)
    // data = amount0In, amount1In, amount0Out, amount1Out (32 bytes each)

    const sender = "0x" + swapEvent.topics[1].slice(26); // Remove padding
    const to = "0x" + swapEvent.topics[2].slice(26); // Remove padding

    // Parse data (4 * 32 bytes = 128 bytes total)
    const data = swapEvent.data.slice(2); // Remove 0x prefix
    const amount0In = "0x" + data.slice(0, 64);
    const amount1In = "0x" + data.slice(64, 128);
    const amount0Out = "0x" + data.slice(128, 192);
    const amount1Out = "0x" + data.slice(192, 256);

    return {
      sender,
      to,
      amount0In: parseInt(amount0In, 16).toString(),
      amount1In: parseInt(amount1In, 16).toString(),
      amount0Out: parseInt(amount0Out, 16).toString(),
      amount1Out: parseInt(amount1Out, 16).toString(),
      contractAddress: swapEvent.address,
    };
  } catch (error) {
    console.error("Error parsing Swap event:", error);
    return null;
  }
};

/**
 * Gets transaction details and attempts to decode revert reason
 */
const getTransactionDetails = async (txHash: string) => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available");
  }

  try {
    // Get transaction details
    const tx = await window.ethereum.request({
      method: "eth_getTransactionByHash",
      params: [txHash],
    });

    // Get transaction receipt
    const receipt = await window.ethereum.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });

    return { tx, receipt };
  } catch (error) {
    console.error("Error getting transaction details:", error);
    return null;
  }
};

/**
 * Analyzes a failed transaction to understand what went wrong
 */
const analyzeFailedTransaction = async (txHash: string, receipt: any) => {
  console.log("=== FAILED TRANSACTION ANALYSIS ===");
  console.log("Transaction Hash:", txHash);
  console.log("Block Number:", receipt.blockNumber);
  console.log("Gas Used:", receipt.gasUsed, "(" + parseInt(receipt.gasUsed, 16) + " gas units)");
  console.log("Status:", receipt.status, "(0x0 = failed, 0x1 = success)");
  console.log("Logs Count:", receipt.logs.length);
  console.log("To Address:", receipt.to);
  console.log("From Address:", receipt.from);

  if (receipt.logs.length === 0) {
    console.log("⚠️  No events emitted - transaction was reverted");
  }

  // Try to get the original transaction to see what was sent
  try {
    const txDetails = await getTransactionDetails(txHash);
    if (txDetails && txDetails.tx) {
      const tx = txDetails.tx;
      console.log("Original Transaction Data:");
      console.log("  • Data Length:", tx.input.length, "characters");
      console.log("  • Function Selector:", tx.input.substring(0, 10));
      console.log("  • Value:", tx.value, "wei");
      console.log("  • Gas Limit:", tx.gas, "(" + parseInt(tx.gas, 16) + " gas units)");
      console.log("  • Gas Price:", tx.gasPrice, "(" + parseInt(tx.gasPrice, 16) + " wei)");
    }
  } catch (error) {
    console.warn("Could not get original transaction details:", error);
  }

  console.log("=====================================");
};

/**
 * Attempts to decode the revert reason from a failed transaction
 */
const decodeRevertReason = async (txHash: string): Promise<string | null> => {
  if (!window.ethereum) {
    return null;
  }

  try {
    // Try to call the transaction with eth_call to get revert reason
    const txDetails = await getTransactionDetails(txHash);
    if (!txDetails) {
      return null;
    }

    const { tx } = txDetails;

    // Call the transaction to get revert reason
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [tx, "latest"],
    });

    return result;
  } catch (error: any) {
    // Extract revert reason from error message
    if (error.message && error.message.includes("revert")) {
      const revertMatch = error.message.match(/revert\s+(.+)/);
      if (revertMatch) {
        return revertMatch[1];
      }
    }

    // Try to decode hex revert reason
    if (error.data) {
      try {
        // Remove 0x prefix and decode
        const hexData = error.data.startsWith("0x") ? error.data.slice(2) : error.data;
        if (hexData.startsWith("08c379a0")) {
          // This is a standard revert reason
          const reasonHex = hexData.slice(8); // Remove function selector
          const reason = Buffer.from(reasonHex, "hex").toString("utf8").replace(/\0/g, "");
          return reason;
        }
      } catch (decodeError) {
        console.warn("Failed to decode revert reason:", decodeError);
      }
    }

    return error.message || "Unknown revert reason";
  }
};

/**
 * Gets the block hash from a transaction receipt
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
 * Waits for transaction confirmation on the blockchain
 */
const waitForTransactionConfirmation = async (txHash: string, maxWaitTime: number = 300000): Promise<any> => {
  const startTime = Date.now();

  if (!window.ethereum) {
    throw new Error("MetaMask not available for transaction confirmation");
  }

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });

      if (receipt) {
        return receipt;
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn("Error checking transaction status:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error("Transaction confirmation timeout");
};

/**
 * Hook for handling EVM-based swap transactions through the AssetConversion precompile
 * Works specifically with MetaMask connected accounts
 */
export const useEVMSwap = () => {
  const { state, dispatch } = useAppContext();
  const { validateCurrentNetwork, getCurrentChainId } = useNetworkValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSwapEvent, setLastSwapEvent] = useState<any>(null);
  const [gasEstimate, setGasEstimate] = useState<GasEstimateWithDisplay | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  /**
   * Gets a quote for a swap operation using the existing Substrate quote system
   */
  const getQuote = useCallback(
    async (assetIn: string, assetOut: string, amount: string): Promise<SwapQuote | null> => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return null;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("EVM swaps require MetaMask connection");
        return null;
      }

      if (!state.api) {
        dotAcpToast.error("Substrate API not available for quote calculation");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const swapQuote = await getSwapQuote(assetIn, assetOut, amount, state.api);
        setQuote(swapQuote);
        return swapQuote;
      } catch (error: any) {
        setError(error.message || "Failed to get quote");
        dotAcpToast.error(`Failed to get quote: ${error.message}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [state.selectedAccount, state.api]
  );

  /**
   * Executes a swap transaction through MetaMask with proper status progression
   */
  const executeSwap = useCallback(
    async (params: SwapParams): Promise<boolean> => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return false;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("EVM swaps require MetaMask connection");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        setLastSwapEvent(null);

        // Set global loading state to trigger transaction status system
        dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });

        // Start with preparing status
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.preparing });

        // Validate parameters including deadline validation with reliable external UTC time
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.validatingInputs });

        const validation = await validateSwapParamsWithDeadline(params, state.api);
        if (!validation.isValid) {
          dotAcpToast.error(`Invalid swap parameters: ${validation.errors.join(", ")}`);
          return false;
        }

        // Check balances
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.checkingBalances });

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

        const validationResult = await validateCurrentNetwork();
        console.log("✅ Network validation passed:", validationResult);

        // Calculate route (gas estimation)
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.calculatingRoute });

        // Create transaction with gas estimation
        const transaction = await createSwapTransactionWithGasEstimation(params, state.selectedAccount, state.api);

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

        // Validate deadline is still in the future before submitting (using blockchain time)
        const currentBlockTime = await getCurrentBlockTime(state.api);
        const deadlineFromData = extractDeadlineFromTransactionData(metamaskTransaction.data);
        if (deadlineFromData && deadlineFromData <= currentBlockTime) {
          throw new Error(
            `Transaction deadline has expired. Deadline: ${deadlineFromData} (${new Date(deadlineFromData).toISOString()}), Current block time: ${currentBlockTime} (${new Date(currentBlockTime).toISOString()})`
          );
        }

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

            // Parse Swap event from the transaction receipt
            const swapEvent = parseSwapEvent(receipt);

            if (swapEvent) {
              console.log("Swap event parsed successfully:", swapEvent);

              // Store the swap event data for UI access
              setLastSwapEvent(swapEvent);

              // Log detailed swap information
              console.log("=== SWAP EVENT DETAILS ===");
              console.log("Sender:", swapEvent.sender);
              console.log("Recipient:", swapEvent.to);
              console.log("Amount0 In:", swapEvent.amount0In);
              console.log("Amount1 In:", swapEvent.amount1In);
              console.log("Amount0 Out:", swapEvent.amount0Out);
              console.log("Amount1 Out:", swapEvent.amount1Out);
              console.log("Contract:", swapEvent.contractAddress);
              console.log("==========================");
            } else {
              console.warn("No Swap event found in transaction receipt");
              setLastSwapEvent(null);
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
              dotAcpToast.error(`Swap failed! ${revertReason || "Unknown error"}. Tx: ${txHash.substring(0, 10)}...`);
              setError(errorMessage);
            } catch (revertError) {
              console.error("Failed to decode revert reason:", revertError);
              dotAcpToast.error(`Swap transaction failed! Tx: ${txHash.substring(0, 10)}...`);
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
        const errorMessage = error.code === 4001 ? "Transaction rejected by user" : `Swap failed: ${error.message}`;
        setError(errorMessage);
        console.error("Swap transaction error:", error);

        if (error.code === 4001) {
          dotAcpToast.error("Transaction rejected by user");
        } else {
          dotAcpToast.error(`Swap failed: ${error.message}`);
        }
        return false;
      } finally {
        setIsLoading(false);
        // Clear global loading state
        dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
      }
    },
    [
      state.selectedAccount,
      dispatch,
      validateSwapParamsWithDeadline,
      getCurrentChainId,
      validateCurrentNetwork,
      state.api,
    ]
  );

  /**
   * Estimates gas for a swap transaction
   */
  const estimateGas = useCallback(
    async (params: SwapParams) => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return null;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("Gas estimation requires MetaMask connection");
        return null;
      }

      try {
        setIsLoading(true);
        const gasEstimate = await estimateSwapGas(params, state.selectedAccount, state.api);
        setError(null);
        return gasEstimate;
      } catch (err: any) {
        setError(err.message || "Failed to estimate gas");
        dotAcpToast.error(err.message || "Failed to estimate gas");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [state.selectedAccount]
  );

  /**
   * Gets gas estimation with formatted display values
   */
  const getGasEstimate = useCallback(
    async (params: SwapParams): Promise<GasEstimateWithDisplay | null> => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return null;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("Gas estimation requires MetaMask connection");
        return null;
      }

      try {
        setIsEstimatingGas(true);
        setError(null);
        const gasEstimateWithDisplay = await getGasEstimateWithDisplay(params, state.selectedAccount, state.api);
        setGasEstimate(gasEstimateWithDisplay);
        return gasEstimateWithDisplay;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to estimate gas";
        setError(errorMessage);
        dotAcpToast.error(errorMessage);
        return null;
      } finally {
        setIsEstimatingGas(false);
      }
    },
    [state.selectedAccount]
  );

  /**
   * Creates a swap transaction with gas estimation
   */
  const createTransactionWithGasEstimation = useCallback(
    async (params: SwapParams) => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return null;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("Transaction creation requires MetaMask connection");
        return null;
      }

      try {
        setIsLoading(true);
        const transaction = await createSwapTransactionWithGasEstimation(params, state.selectedAccount, state.api);
        setError(null);
        return transaction;
      } catch (err: any) {
        setError(err.message || "Failed to create transaction");
        dotAcpToast.error(err.message || "Failed to create transaction");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [state.selectedAccount]
  );

  /**
   * Calculates slippage for a swap
   */
  const calculateSwapSlippage = useCallback((expectedAmount: string, actualAmount: string): number => {
    return calculateSlippage(expectedAmount, actualAmount);
  }, []);

  /**
   * Formats amount for display
   */
  const formatSwapAmount = useCallback((amount: string, decimals: number = 18): string => {
    return formatAmount(amount, decimals);
  }, []);

  /**
   * Converts amount to wei
   */
  const convertToWei = useCallback((amount: string, decimals: number = 18): string => {
    return toWei(amount, decimals);
  }, []);

  /**
   * Validates swap parameters with deadline validation using reliable external UTC time
   */
  const validateSwapParamsWithDeadlineCheck = useCallback(
    async (params: SwapParams): Promise<{ isValid: boolean; errors: string[] }> => {
      try {
        return await validateSwapParamsWithDeadline(params, state.api);
      } catch (error: any) {
        return {
          isValid: false,
          errors: [`Validation failed: ${error.message}`],
        };
      }
    },
    []
  );

  /**
   * Checks if the current account supports EVM swaps
   */
  const canPerformEVMSwap = useCallback((): boolean => {
    return !!state.selectedAccount && isMetamaskAccount(state.selectedAccount);
  }, [state.selectedAccount]);

  return {
    // State
    isLoading,
    quote,
    error,
    lastSwapEvent,
    gasEstimate,
    isEstimatingGas,

    // Actions
    getQuote,
    executeSwap,
    estimateGas,
    getGasEstimate,
    createTransactionWithGasEstimation,

    // Validation
    validateSwapParamsWithDeadlineCheck,

    // Utilities
    calculateSwapSlippage,
    formatSwapAmount,
    convertToWei,
    canPerformEVMSwap,
  };
};
