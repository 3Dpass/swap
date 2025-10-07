import { useState, useCallback } from "react";
import { useAppContext } from "../../state";
import {
  AddLiquidityParams,
  RemoveLiquidityParams,
  createAddLiquidityTransactionWithGasEstimation,
  createRemoveLiquidityTransactionWithGasEstimation,
} from "../../services/evmLiquidityServices";
import { isMetamaskAccount } from "../../services/metamaskServices";
import { useNetworkValidation } from "./useNetworkValidation";
import { ActionType, TransactionStatus } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import dotAcpToast from "../../app/util/toast";

/**
 * Parses Mint event from transaction receipt
 * Event signature: Mint(address indexed sender, uint amount0, uint amount1)
 * Event selector: 0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f
 */
const parseMintEvent = (receipt: any) => {
  if (!receipt.logs || !Array.isArray(receipt.logs)) {
    return null;
  }

  // Look for Mint event (selector: 0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f)
  const mintEvent = receipt.logs.find(
    (log: any) => log.topics && log.topics[0] === "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f"
  );

  if (!mintEvent) {
    return null;
  }

  try {
    // Parse the event data
    // topics[0] = event signature
    // topics[1] = sender (indexed)
    // data = amount0, amount1 (32 bytes each)

    const sender = "0x" + mintEvent.topics[1].slice(26); // Remove padding

    // Parse data (2 * 32 bytes = 64 bytes total)
    const data = mintEvent.data.slice(2); // Remove 0x prefix
    const amount0 = "0x" + data.slice(0, 64);
    const amount1 = "0x" + data.slice(64, 128);

    return {
      sender,
      amount0: parseInt(amount0, 16).toString(),
      amount1: parseInt(amount1, 16).toString(),
      contractAddress: mintEvent.address,
    };
  } catch (error) {
    console.error("Error parsing Mint event:", error);
    return null;
  }
};

/**
 * Parses Burn event from transaction receipt
 * Event signature: Burn(address indexed sender, uint amount0, uint amount1, address indexed to)
 * Event selector: 0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496
 */
const parseBurnEvent = (receipt: any) => {
  if (!receipt.logs || !Array.isArray(receipt.logs)) {
    return null;
  }

  // Look for Burn event (selector: 0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496)
  const burnEvent = receipt.logs.find(
    (log: any) => log.topics && log.topics[0] === "0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496"
  );

  if (!burnEvent) {
    return null;
  }

  try {
    // Parse the event data
    // topics[0] = event signature
    // topics[1] = sender (indexed)
    // topics[2] = to (indexed)
    // data = amount0, amount1 (32 bytes each)

    const sender = "0x" + burnEvent.topics[1].slice(26); // Remove padding
    const to = "0x" + burnEvent.topics[2].slice(26); // Remove padding

    // Parse data (2 * 32 bytes = 64 bytes total)
    const data = burnEvent.data.slice(2); // Remove 0x prefix
    const amount0 = "0x" + data.slice(0, 64);
    const amount1 = "0x" + data.slice(64, 128);

    return {
      sender,
      to,
      amount0: parseInt(amount0, 16).toString(),
      amount1: parseInt(amount1, 16).toString(),
      contractAddress: burnEvent.address,
    };
  } catch (error) {
    console.error("Error parsing Burn event:", error);
    return null;
  }
};

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
 * Hook for handling EVM-based liquidity operations through the AssetConversion precompile
 * Works specifically with MetaMask connected accounts
 */
export const useEVMLiquidity = () => {
  const { state, dispatch } = useAppContext();
  const { validateCurrentNetwork, getCurrentChainId } = useNetworkValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLiquidityEvent, setLastLiquidityEvent] = useState<any>(null);

  /**
   * Executes an add liquidity transaction through MetaMask with proper status progression
   */
  const executeAddLiquidity = useCallback(
    async (params: AddLiquidityParams): Promise<boolean> => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return false;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("EVM liquidity operations require MetaMask connection");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        setLastLiquidityEvent(null);

        // Set global loading state to trigger transaction status system
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: true });

        // Start with preparing status
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.preparing });

        // Validate parameters
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.validatingInputs });

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
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.calculatingRoute });

        // Create transaction with gas estimation
        const transaction = await createAddLiquidityTransactionWithGasEstimation(params, state.selectedAccount);

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

        console.log("MetaMask add liquidity transaction object:", metamaskTransaction);

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

        // Signing status (user interaction)
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.signing });

        // Request MetaMask to send the transaction
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [metamaskTransaction],
        });

        console.log("Add liquidity transaction submitted, waiting for confirmation:", txHash);
        dotAcpToast.success(`Add liquidity transaction submitted: ${txHash.substring(0, 10)}...`);

        // Waiting for new block
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.waitingForNewBlock });

        // Wait for transaction confirmation
        try {
          const receipt = await waitForTransactionConfirmation(txHash);

          if (receipt.status === "0x1") {
            console.log("✅ Add liquidity transaction confirmed successfully");

            // Waiting for confirmation
            dispatch({
              type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS,
              payload: TransactionStatus.waitingForConfirmation,
            });

            // Parse Mint event from the transaction receipt
            const mintEvent = parseMintEvent(receipt);

            if (mintEvent) {
              console.log("Mint event parsed successfully:", mintEvent);

              // Store the mint event data for UI access
              setLastLiquidityEvent(mintEvent);

              // Log detailed mint information
              console.log("=== MINT EVENT DETAILS ===");
              console.log("Sender:", mintEvent.sender);
              console.log("Amount0:", mintEvent.amount0);
              console.log("Amount1:", mintEvent.amount1);
              console.log("Contract:", mintEvent.contractAddress);
              console.log("========================");

              // Format amounts for success modal display
              // The amounts from the Mint event are in minimum units and need proper formatting
              // We need to determine which amount corresponds to which token based on the transaction parameters

              console.log("=== FORMATTED AMOUNTS FOR SUCCESS MODAL ===");
              console.log("Raw Amount0:", mintEvent.amount0);
              console.log("Raw Amount1:", mintEvent.amount1);
              console.log("Transaction params:", params);

              // For add liquidity, we know the order from the transaction parameters
              // Amount0 should correspond to asset1 (first token in the transaction)
              // Amount1 should correspond to asset2 (second token in the transaction)

              // The success modal expects human-readable amounts, not raw minimum units
              // We need to format them using the token decimals
              // For add liquidity, we need to determine which token corresponds to which amount
              // and get their respective decimals

              // TODO: Get actual token decimals from the transaction parameters
              // For now, we'll use default decimals (P3D = 12, other tokens = 18)
              // This is a temporary solution until we can properly map the amounts to tokens

              // Parse the amounts as numbers to handle scientific notation
              const amount0Num = parseFloat(mintEvent.amount0);
              const amount1Num = parseFloat(mintEvent.amount1);

              // Use default decimals for now (this should be improved to get actual decimals)
              const defaultDecimals = "12"; // P3D decimals
              const assetDecimals = "18"; // Most asset tokens use 18 decimals

              // Format the amounts using formatDecimalsFromToken
              const formattedAmount0 = formatDecimalsFromToken(amount0Num, defaultDecimals);
              const formattedAmount1 = formatDecimalsFromToken(amount1Num, assetDecimals);

              console.log("Formatted Amount0 (Asset1):", formattedAmount0);
              console.log("Formatted Amount1 (Asset2):", formattedAmount1);
              console.log("==========================================");

              // Set the amounts in global state for success modal
              // Note: The success modal will map these to the correct tokens based on the selected tokens
              dispatch({ type: ActionType.SET_EXACT_NATIVE_TOKEN_ADD_LIQUIDITY, payload: formattedAmount0 });
              dispatch({ type: ActionType.SET_EXACT_ASSET_TOKEN_ADD_LIQUIDITY, payload: formattedAmount1 });
            } else {
              console.warn("No Mint event found in transaction receipt");
              setLastLiquidityEvent(null);
            }

            // Waiting for finalization
            dispatch({
              type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS,
              payload: TransactionStatus.waitingForFinalization,
            });

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
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.finalizing });

            // Update balances (handled by MetaMask)
            dispatch({
              type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS,
              payload: TransactionStatus.updatingBalances,
            });

            // Show success modal
            dispatch({ type: ActionType.SET_SUCCESS_MODAL_OPEN, payload: true });

            // Clear gas fees
            dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_GAS_FEE, payload: "" });

            // Stop loading
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: null });

            return true;
          } else {
            // Transaction failed
            console.error("Add liquidity transaction failed:", receipt);
            dotAcpToast.error(`Add liquidity transaction failed! Tx: ${txHash.substring(0, 10)}...`);
            setError("Add liquidity transaction failed on blockchain");
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
          error.code === 4001 ? "Transaction rejected by user" : `Add liquidity failed: ${error.message}`;
        setError(errorMessage);
        console.error("Add liquidity transaction error:", error);

        if (error.code === 4001) {
          dotAcpToast.error("Transaction rejected by user");
        } else {
          dotAcpToast.error(`Add liquidity failed: ${error.message}`);
        }
        return false;
      } finally {
        setIsLoading(false);
        // Clear global loading state
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
      }
    },
    [state.selectedAccount, dispatch, getCurrentChainId, validateCurrentNetwork, state.api]
  );

  /**
   * Executes a remove liquidity transaction through MetaMask with proper status progression
   */
  const executeRemoveLiquidity = useCallback(
    async (params: RemoveLiquidityParams): Promise<boolean> => {
      if (!state.selectedAccount) {
        dotAcpToast.error("No wallet connected");
        return false;
      }

      if (!isMetamaskAccount(state.selectedAccount)) {
        dotAcpToast.error("EVM liquidity operations require MetaMask connection");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        setLastLiquidityEvent(null);

        // Set global loading state to trigger transaction status system
        dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: true });

        // Start with preparing status
        dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.preparing });

        // Validate parameters
        dispatch({
          type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
          payload: TransactionStatus.validatingInputs,
        });

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
        dispatch({
          type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
          payload: TransactionStatus.calculatingRoute,
        });

        // Create transaction with gas estimation
        const transaction = await createRemoveLiquidityTransactionWithGasEstimation(params, state.selectedAccount);

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

        console.log("MetaMask remove liquidity transaction object:", metamaskTransaction);

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

        // Signing status (user interaction)
        dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.signing });

        // Request MetaMask to send the transaction
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [metamaskTransaction],
        });

        console.log("Remove liquidity transaction submitted, waiting for confirmation:", txHash);
        dotAcpToast.success(`Remove liquidity transaction submitted: ${txHash.substring(0, 10)}...`);

        // Waiting for new block
        dispatch({
          type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
          payload: TransactionStatus.waitingForNewBlock,
        });

        // Wait for transaction confirmation
        try {
          const receipt = await waitForTransactionConfirmation(txHash);

          if (receipt.status === "0x1") {
            console.log("✅ Remove liquidity transaction confirmed successfully");

            // Waiting for confirmation
            dispatch({
              type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
              payload: TransactionStatus.waitingForConfirmation,
            });

            // Parse Burn event from the transaction receipt
            const burnEvent = parseBurnEvent(receipt);

            if (burnEvent) {
              console.log("Burn event parsed successfully:", burnEvent);

              // Store the burn event data for UI access
              setLastLiquidityEvent(burnEvent);

              // Log detailed burn information
              console.log("=== BURN EVENT DETAILS ===");
              console.log("Sender:", burnEvent.sender);
              console.log("To:", burnEvent.to);
              console.log("Amount0:", burnEvent.amount0);
              console.log("Amount1:", burnEvent.amount1);
              console.log("Contract:", burnEvent.contractAddress);
              console.log("========================");
            } else {
              console.warn("No Burn event found in transaction receipt");
              setLastLiquidityEvent(null);
            }

            // Waiting for finalization
            dispatch({
              type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
              payload: TransactionStatus.waitingForFinalization,
            });

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
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.finalizing });

            // Update balances (handled by MetaMask)
            dispatch({
              type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
              payload: TransactionStatus.updatingBalances,
            });

            // Show success modal
            dispatch({ type: ActionType.SET_SUCCESS_MODAL_OPEN, payload: true });

            // Clear gas fees
            dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_GAS_FEE, payload: "" });

            // Stop loading
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: null });

            return true;
          } else {
            // Transaction failed
            console.error("Remove liquidity transaction failed:", receipt);
            dotAcpToast.error(`Remove liquidity transaction failed! Tx: ${txHash.substring(0, 10)}...`);
            setError("Remove liquidity transaction failed on blockchain");
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
          error.code === 4001 ? "Transaction rejected by user" : `Remove liquidity failed: ${error.message}`;
        setError(errorMessage);
        console.error("Remove liquidity transaction error:", error);

        if (error.code === 4001) {
          dotAcpToast.error("Transaction rejected by user");
        } else {
          dotAcpToast.error(`Remove liquidity failed: ${error.message}`);
        }
        return false;
      } finally {
        setIsLoading(false);
        // Clear global loading state
        dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
      }
    },
    [state.selectedAccount, dispatch, getCurrentChainId, validateCurrentNetwork, state.api]
  );

  /**
   * Checks if EVM liquidity operations can be performed
   */
  const canPerformEVMLiquidity = useCallback((): boolean => {
    return !!(state.selectedAccount && isMetamaskAccount(state.selectedAccount) && state.api);
  }, [state.selectedAccount, state.api]);

  return {
    executeAddLiquidity,
    executeRemoveLiquidity,
    canPerformEVMLiquidity,
    isLoading,
    error,
    lastLiquidityEvent,
  };
};
