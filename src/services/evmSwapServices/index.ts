/**
 * EVM Swap Services for 3Dpass Network
 * Handles EVM-based swap transactions through the AssetConversion precompile
 * Compatible with Uniswap V2 interface for MetaMask integration
 */

import { ApiPromise } from "@polkadot/api";
import { ethers } from "ethers";
import { convertAssetIdToEVMAddress, ensureChecksummedAddress } from "../../app/util/assetAddressConverter";
import { type MetamaskAccount } from "../metamaskServices";

// AssetConversion precompile address on 3Dpass network
const ASSET_CONVERSION_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000902";

// Uniswap V2 compatible function selectors
const FUNCTION_SELECTORS = {
  swapExactTokensForTokens: "0x38ed1739",
  swapTokensForExactTokens: "0x8803dbee",
  getAmountsOut: "0xd06ca61f",
  getAmountsIn: "0x1f00ca74",
} as const;

// Default deadline offset in minutes
const DEFAULT_DEADLINE_OFFSET_MINUTES = 10;

/**
 * Swap parameters interface
 */
export interface SwapParams {
  assetIn: string;
  assetOut: string;
  amount: string;
  minReceive: string;
  recipient?: string;
  deadline?: number;
  isExactInput?: boolean; // true for exact input, false for exact output
}

/**
 * EVM-converted swap parameters
 */
export interface EVMSwapParams {
  assetInAddress: string;
  assetOutAddress: string;
  amount: string;
  minReceive: string;
  recipient: string;
  deadline: number;
}

/**
 * Swap quote interface
 */
export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  minimumReceived: string;
}

/**
 * Transaction interface
 */
export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Gas estimation with display information
 */
export interface GasEstimateWithDisplay extends GasEstimate {
  gasLimitFormatted: string;
  gasPriceFormatted?: string;
  maxFeePerGasFormatted?: string;
  maxPriorityFeePerGasFormatted?: string;
  estimatedCost?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Gets the current block timestamp from the blockchain using Polkadot.js API
 */
export const getCurrentBlockTime = async (api: any): Promise<number> => {
  try {
    // Use Polkadot.js API to get the current timestamp
    const timestamp = await api.query.timestamp.now();

    // Convert to number (timestamp is in milliseconds)
    const blockTimestamp = timestamp.toNumber();
    const systemTime = Date.now();

    // Convert blockchain timestamp from milliseconds to seconds for comparison
    const blockTimestampSeconds = Math.floor(blockTimestamp / 1000);
    const systemTimeSeconds = Math.floor(systemTime / 1000);

    console.log("=== POLKADOT TIMESTAMP ===");
    console.log(`Polkadot timestamp: ${blockTimestamp} (${new Date(blockTimestamp).toISOString()})`);
    console.log(`System time: ${systemTime} (${new Date(systemTime).toISOString()})`);
    console.log(`Time difference: ${systemTimeSeconds - blockTimestampSeconds} seconds`);
    console.log("=========================");

    // Use system time if blockchain time is significantly behind
    if (systemTimeSeconds - blockTimestampSeconds > 60) {
      console.warn(
        `Blockchain time is ${systemTimeSeconds - blockTimestampSeconds}s behind system time, using system time`
      );
      return systemTime;
    }

    return blockTimestamp;
  } catch (error) {
    console.error("Failed to get current block time from Polkadot API:", error);
    // Fallback to system time if blockchain call fails
    return Date.now();
  }
};

/**
 * Gets the blockchain deadline using Polkadot.js API
 */
const getBlockchainDeadline = async (api: any): Promise<number> => {
  try {
    // Use Polkadot.js API to get the current timestamp
    const timestamp = await api.query.timestamp.now();

    // Convert to number (timestamp is in milliseconds)
    const blockTimestamp = timestamp.toNumber();
    const systemTime = Date.now();

    // Convert blockchain timestamp from milliseconds to seconds for comparison
    const blockTimestampSeconds = Math.floor(blockTimestamp / 1000);
    const systemTimeSeconds = Math.floor(systemTime / 1000);
    const timeDifference = blockTimestampSeconds - systemTimeSeconds;

    console.log("=== BLOCKCHAIN DEADLINE ===");
    console.log(`Polkadot timestamp: ${blockTimestamp} (${new Date(blockTimestamp).toISOString()})`);
    console.log(
      `Block timestamp (seconds): ${blockTimestampSeconds} (${new Date(blockTimestampSeconds * 1000).toISOString()})`
    );
    console.log(`Current system time: ${systemTimeSeconds} (${new Date(systemTimeSeconds * 1000).toISOString()})`);
    console.log(`Time difference: ${timeDifference} seconds (${timeDifference / 3600} hours)`);

    // Check if timestamp is reasonable (within 1 hour of system time)
    if (Math.abs(timeDifference) > 3600) {
      console.warn(
        `⚠️ WARNING: Block timestamp is ${Math.abs(timeDifference / 3600).toFixed(1)} hours ${timeDifference > 0 ? "ahead" : "behind"} system time!`
      );
      console.warn(`This might indicate a blockchain timestamp issue.`);
    } else if (timeDifference < 0) {
      console.warn(`⚠️ WARNING: Block timestamp is ${Math.abs(timeDifference)} seconds behind system time!`);
      console.warn(`This might cause deadline issues. Consider using system time instead.`);
    }

    // Use system time if blockchain time is significantly behind
    const baseTime = timeDifference < -60 ? systemTime : blockTimestamp;
    const deadline = baseTime + DEFAULT_DEADLINE_OFFSET_MINUTES * 60 * 1000;

    if (timeDifference < -60) {
      console.log(`Using system time as base (blockchain is ${Math.abs(timeDifference)}s behind)`);
    }

    console.log(`Calculated deadline: ${deadline} (${new Date(deadline).toISOString()})`);
    console.log("===========================");

    return deadline;
  } catch (error) {
    console.error("Failed to get blockchain deadline from Polkadot API:", error);
    // Fallback to system time if blockchain call fails
    const systemTime = Date.now();
    const fallbackDeadline = systemTime + DEFAULT_DEADLINE_OFFSET_MINUTES * 60 * 1000;
    console.warn("Using system time fallback for deadline:", fallbackDeadline);
    return fallbackDeadline;
  }
};

/**
 * Converts Substrate asset IDs to EVM addresses and prepares parameters for EVM transactions
 */
export const convertSwapParamsToEVM = async (params: SwapParams): Promise<EVMSwapParams> => {
  const assetInAddress = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.assetIn));
  const assetOutAddress = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.assetOut));

  // Log the conversion for debugging
  console.log("=== ASSET ADDRESS CONVERSION ===");
  console.log(`Asset ID ${params.assetIn} → ${assetInAddress}`);
  console.log(`Asset ID ${params.assetOut} → ${assetOutAddress}`);
  console.log("=================================");

  // Use provided deadline or calculate fresh one right before transaction
  const finalDeadline = params.deadline || 0; // Will be calculated fresh during transaction creation

  return {
    assetInAddress,
    assetOutAddress,
    amount: params.amount,
    minReceive: params.minReceive,
    recipient: params.recipient
      ? ensureChecksummedAddress(params.recipient)
      : "0x0000000000000000000000000000000000000000",
    deadline: finalDeadline,
  };
};

/**
 * Gets function selectors for Uniswap V2 compatible functions
 */
export const getFunctionSelectors = () => {
  return { ...FUNCTION_SELECTORS };
};

/**
 * Creates transaction data for swapExactTokensForTokens (exact input swap)
 */
export const createSwapExactTokensForTokensData = (params: EVMSwapParams): string => {
  const path = [params.assetInAddress, params.assetOutAddress];

  // Encode function call: swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "uint256", "address[]", "address", "uint256"],
    [params.amount, params.minReceive, path, params.recipient, params.deadline]
  );

  return FUNCTION_SELECTORS.swapExactTokensForTokens + encoded.slice(2);
};

/**
 * Creates transaction data for swapTokensForExactTokens (exact output swap)
 */
export const createSwapTokensForExactTokensData = (params: EVMSwapParams): string => {
  const path = [params.assetInAddress, params.assetOutAddress];

  // Encode function call: swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "uint256", "address[]", "address", "uint256"],
    [params.amount, params.minReceive, path, params.recipient, params.deadline]
  );

  return FUNCTION_SELECTORS.swapTokensForExactTokens + encoded.slice(2);
};

/**
 * Creates transaction data for swap operations
 */
export const createSwapTransactionData = async (params: SwapParams, isExactInput: boolean = true): Promise<string> => {
  const evmParams = await convertSwapParamsToEVM(params);

  // Use isExactInput from params if provided, otherwise use the parameter
  const actualIsExactInput = params.isExactInput !== undefined ? params.isExactInput : isExactInput;

  // Log the swap method and amounts
  const functionName = actualIsExactInput ? "swapExactTokensForTokens" : "swapTokensForExactTokens";
  const functionSelector = actualIsExactInput ? "0x38ed1739" : "0x8803dbee";

  console.log("=== SWAP METHOD SELECTION ===");
  console.log(`Swap method: ${functionName}`);
  console.log(`Function selector: ${functionSelector} (${functionName})`);
  console.log(`Input type: ${actualIsExactInput ? "Exact Input" : "Exact Output"}`);
  console.log("");
  console.log("=== TRANSACTION AMOUNTS (MIN UNITS) ===");
  console.log(`Asset In: ${params.assetIn} → ${evmParams.assetInAddress}`);
  console.log(`Asset Out: ${params.assetOut} → ${evmParams.assetOutAddress}`);
  console.log(`Amount: ${params.amount} (min units)`);
  console.log(`Min Receive: ${params.minReceive} (min units)`);
  console.log(`Recipient: ${evmParams.recipient}`);
  console.log(`Deadline: ${evmParams.deadline} (${new Date(evmParams.deadline).toISOString()})`);
  console.log("================================");

  if (actualIsExactInput) {
    return createSwapExactTokensForTokensData(evmParams);
  } else {
    return createSwapTokensForExactTokensData(evmParams);
  }
};

/**
 * Creates a complete swap transaction object
 */
export const createSwapTransaction = async (
  params: SwapParams,
  account: MetamaskAccount,
  api: any,
  isExactInput: boolean = true,
  gasLimit: string
): Promise<SwapTransaction> => {
  if (account.walletType !== "metamask") {
    throw new Error("Account must be a MetaMask account for EVM transactions");
  }

  const evmParams = await convertSwapParamsToEVM(params);

  // Calculate fresh deadline right before transaction creation
  const freshDeadline = await getBlockchainDeadline(api);
  evmParams.deadline = freshDeadline;

  console.log("=== FRESH DEADLINE FOR TRANSACTION ===");
  console.log(`Fresh deadline: ${freshDeadline} (${new Date(freshDeadline).toISOString()})`);
  console.log("=====================================");

  // Use isExactInput from params if provided, otherwise use the parameter
  const actualIsExactInput = params.isExactInput !== undefined ? params.isExactInput : isExactInput;

  const transactionData = actualIsExactInput
    ? createSwapExactTokensForTokensData(evmParams)
    : createSwapTokensForExactTokensData(evmParams);

  const transaction: SwapTransaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0",
  };

  // Set the gas limit (always provided from estimation)
  transaction.gas = gasLimit;

  // Note: AssetConversion precompile is not payable, so value should always be 0x0
  // Native token swaps are handled through the precompile's internal logic

  // Log the final transaction for debugging
  // Decode transaction data for debugging
  try {
    const functionSelector = transaction.data.substring(0, 10);
    const encodedParams = transaction.data.substring(10);

    let decodedParams;
    if (functionSelector === "0x38ed1739") {
      // swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)
      decodedParams = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "uint256", "address[]", "address", "uint256"],
        "0x" + encodedParams
      );
    } else if (functionSelector === "0x8803dbee") {
      // swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline)
      decodedParams = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "uint256", "address[]", "address", "uint256"],
        "0x" + encodedParams
      );
    }

    // Determine function name for logging
    const functionName = functionSelector === "0x38ed1739" ? "swapExactTokensForTokens" : "swapTokensForExactTokens";

    console.log("=== FINAL TRANSACTION ===");
    console.log("From:", transaction.from);
    console.log("To:", transaction.to);
    console.log("Value:", transaction.value);
    console.log("Gas:", transaction.gas);
    console.log("Data length:", transaction.data.length);
    console.log(`Function selector: ${functionSelector} (${functionName})`);
    console.log("");
    console.log("=== DECODED PARAMETERS ===");
    if (decodedParams) {
      if (functionSelector === "0x38ed1739") {
        console.log("amountIn:", decodedParams[0].toString());
        console.log("amountOutMin:", decodedParams[1].toString());
        console.log("path:", decodedParams[2]);
        console.log("to:", decodedParams[3]);
        console.log(
          "deadline:",
          decodedParams[4].toString(),
          `(${new Date(parseInt(decodedParams[4].toString())).toISOString()})`
        );
      } else {
        console.log("amountOut:", decodedParams[0].toString());
        console.log("amountInMax:", decodedParams[1].toString());
        console.log("path:", decodedParams[2]);
        console.log("to:", decodedParams[3]);
        console.log(
          "deadline:",
          decodedParams[4].toString(),
          `(${new Date(parseInt(decodedParams[4].toString())).toISOString()})`
        );
      }
    }
    console.log("Full transaction data:", transaction.data);
    console.log("========================");
  } catch (decodeError) {
    const functionSelector = transaction.data.substring(0, 10);
    const functionName = functionSelector === "0x38ed1739" ? "swapExactTokensForTokens" : "swapTokensForExactTokens";

    console.log("=== FINAL TRANSACTION ===");
    console.log("From:", transaction.from);
    console.log("To:", transaction.to);
    console.log("Value:", transaction.value);
    console.log("Gas:", transaction.gas);
    console.log("Data length:", transaction.data.length);
    console.log(`Function selector: ${functionSelector} (${functionName})`);
    console.log("Failed to decode parameters:", decodeError);
    console.log("Full transaction data:", transaction.data);
    console.log("========================");
  }

  return transaction;
};

/**
 * Formats gas values for display
 */
export const formatGasValue = (value: string): string => {
  if (!value) return "N/A";
  const num = parseInt(value, 16);
  return num.toLocaleString();
};

/**
 * Formats gas price for display in Gwei
 */
export const formatGasPrice = (value: string): string => {
  if (!value) return "N/A";
  const num = parseInt(value, 16);
  const gwei = num / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
};

/**
 * Creates a gas estimate with formatted display values
 */
export const createGasEstimateWithDisplay = (estimate: GasEstimate): GasEstimateWithDisplay => {
  const gasLimitFormatted = formatGasValue(estimate.gasLimit);
  const gasPriceFormatted = estimate.gasPrice ? formatGasPrice(estimate.gasPrice) : undefined;
  const maxFeePerGasFormatted = estimate.maxFeePerGas ? formatGasPrice(estimate.maxFeePerGas) : undefined;
  const maxPriorityFeePerGasFormatted = estimate.maxPriorityFeePerGas
    ? formatGasPrice(estimate.maxPriorityFeePerGas)
    : undefined;

  // Calculate estimated cost (simplified - in reality this would be more complex)
  let estimatedCost: string | undefined;
  if (estimate.maxFeePerGas) {
    const gasLimit = parseInt(estimate.gasLimit, 16);
    const maxFee = parseInt(estimate.maxFeePerGas, 16);
    const cost = gasLimit * maxFee;
    estimatedCost = `${(cost / 1e18).toFixed(6)} ETH`;
  } else if (estimate.gasPrice) {
    const gasLimit = parseInt(estimate.gasLimit, 16);
    const gasPrice = parseInt(estimate.gasPrice, 16);
    const cost = gasLimit * gasPrice;
    estimatedCost = `${(cost / 1e18).toFixed(6)} ETH`;
  }

  return {
    ...estimate,
    gasLimitFormatted,
    gasPriceFormatted,
    maxFeePerGasFormatted,
    maxPriorityFeePerGasFormatted,
    estimatedCost,
  };
};

/**
 * Estimates gas for a swap transaction
 */
export const estimateSwapGas = async (params: SwapParams, account: MetamaskAccount, api: any): Promise<GasEstimate> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available for gas estimation");
  }

  console.log("=== GAS ESTIMATION START ===");
  console.log("Input parameters:", params);
  console.log("===========================");

  // Create a temporary transaction for gas estimation (without gas limit)
  const evmParams = await convertSwapParamsToEVM(params);

  // Calculate fresh deadline for gas estimation
  const freshDeadline = await getBlockchainDeadline(api);
  evmParams.deadline = freshDeadline;

  console.log("=== FRESH DEADLINE FOR GAS ESTIMATION ===");
  console.log(`Fresh deadline: ${freshDeadline} (${new Date(freshDeadline).toISOString()})`);
  console.log("=========================================");

  // Use the same function as the actual transaction for gas estimation
  const actualIsExactInput = params.isExactInput !== undefined ? params.isExactInput : true;
  const functionName = actualIsExactInput ? "swapExactTokensForTokens" : "swapTokensForExactTokens";
  const functionSelector = actualIsExactInput ? "0x38ed1739" : "0x8803dbee";

  console.log("=== GAS ESTIMATION TRANSACTION DATA ===");
  console.log(`Using ${functionName} for gas estimation`);
  console.log(`Function selector: ${functionSelector} (${functionName})`);

  const transactionData = actualIsExactInput
    ? createSwapExactTokensForTokensData(evmParams)
    : createSwapTokensForExactTokensData(evmParams);

  const transaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0",
  };

  console.log("=== GAS ESTIMATION TRANSACTION ===");
  console.log("From:", transaction.from);
  console.log("To:", transaction.to);
  console.log("Data length:", transaction.data.length);
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (${functionName})`);
  console.log("================================");

  try {
    console.log("🔄 Calling eth_estimateGas...");
    // Estimate gas limit
    const gasLimit = await window.ethereum.request({
      method: "eth_estimateGas",
      params: [transaction],
    });

    // Get current gas price
    const gasPrice = await window.ethereum.request({
      method: "eth_gasPrice",
    });

    // Try to get EIP-1559 gas parameters
    let maxFeePerGas: string | undefined;
    let maxPriorityFeePerGas: string | undefined;

    try {
      const feeHistory = await window.ethereum.request({
        method: "eth_feeHistory",
        params: ["0x1", "latest", [25, 50, 75]],
      });

      if (feeHistory && feeHistory.baseFeePerGas && feeHistory.baseFeePerGas.length > 0) {
        const baseFee = parseInt(feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1], 16);
        const avgPriorityFee = parseInt(feeHistory.reward[0][1], 16); // 50th percentile

        // Ensure minimum priority fee of 10 wei for proper miner incentives
        const priorityFee = Math.max(avgPriorityFee, 10);

        maxFeePerGas = ethers.utils.hexlify(baseFee * 2 + priorityFee);
        maxPriorityFeePerGas = ethers.utils.hexlify(priorityFee);
      }
    } catch (eip1559Error) {
      console.warn("EIP-1559 gas estimation failed, using legacy gas price:", eip1559Error);
    }

    return {
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  } catch (error: any) {
    console.error("Gas estimation failed:", error);
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
};

/**
 * Gets gas estimation with formatted display values
 */
export const getGasEstimateWithDisplay = async (
  params: SwapParams,
  account: MetamaskAccount,
  api: any
): Promise<GasEstimateWithDisplay> => {
  const estimate = await estimateSwapGas(params, account, api);
  return createGasEstimateWithDisplay(estimate);
};

/**
 * Creates a swap transaction with gas estimation
 */
export const createSwapTransactionWithGasEstimation = async (
  params: SwapParams,
  account: MetamaskAccount,
  api: any,
  isExactInput: boolean = true
): Promise<SwapTransaction> => {
  const gasEstimate = await estimateSwapGas(params, account, api);
  const transaction = await createSwapTransaction(params, account, api, isExactInput, gasEstimate.gasLimit);

  // Add gas parameters
  if (gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas) {
    transaction.maxFeePerGas = gasEstimate.maxFeePerGas;
    transaction.maxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas;
  } else if (gasEstimate.gasPrice) {
    transaction.gasPrice = gasEstimate.gasPrice;
  }

  return transaction;
};

/**
 * Gets a swap quote using the Substrate API
 */
export const getSwapQuote = async (
  assetIn: string,
  assetOut: string,
  amount: string,
  api: ApiPromise
): Promise<SwapQuote> => {
  try {
    // Use the existing token services for accurate quotes
    let amountOut: string;

    if (assetIn === "0" && assetOut !== "0") {
      // Native to Asset swap
      const { getAssetTokenFromNativeToken } = await import("../tokenServices");
      const result = await getAssetTokenFromNativeToken(api, assetOut, amount);
      amountOut = result?.toString() || "0";
    } else if (assetIn !== "0" && assetOut === "0") {
      // Asset to Native swap
      const { getNativeTokenFromAssetToken } = await import("../tokenServices");
      const result = await getNativeTokenFromAssetToken(api, assetIn, amount);
      amountOut = result?.toString() || "0";
    } else if (assetIn !== "0" && assetOut !== "0") {
      // Asset to Asset swap
      const { getAssetTokenBFromAssetTokenA } = await import("../tokenServices");
      const result = await getAssetTokenBFromAssetTokenA(api, amount, assetIn, assetOut);
      amountOut = result?.toString() || "0";
    } else {
      throw new Error("Invalid asset pair: both assets cannot be native");
    }

    const priceImpact = 0; // TODO: Calculate actual price impact
    const minimumReceived = amountOut; // TODO: Apply slippage tolerance

    return {
      amountIn: amount,
      amountOut,
      priceImpact,
      minimumReceived,
    };
  } catch (error: any) {
    console.error("Failed to get swap quote:", error);
    throw new Error(`Failed to get swap quote: ${error.message}`);
  }
};

/**
 * Validates swap parameters
 */
export const validateSwapParams = (params: SwapParams): ValidationResult => {
  const errors: string[] = [];

  // Validate asset IDs
  if (!params.assetIn || !params.assetOut) {
    errors.push("Asset IDs are required");
  }

  if (params.assetIn === params.assetOut) {
    errors.push("Asset in and asset out must be different");
  }

  // Validate amounts
  if (!params.amount || params.amount === "0") {
    errors.push("Amount must be greater than 0");
  }

  if (!params.minReceive || params.minReceive === "0") {
    errors.push("Minimum receive amount must be greater than 0");
  }

  // Validate numeric values
  try {
    const amount = ethers.BigNumber.from(params.amount);
    const minReceive = ethers.BigNumber.from(params.minReceive);

    if (amount.lte(0)) {
      errors.push("Amount must be greater than 0");
    }

    if (minReceive.lte(0)) {
      errors.push("Minimum receive amount must be greater than 0");
    }
  } catch (error) {
    errors.push("Invalid amount format");
  }

  // Validate deadline if provided
  if (params.deadline) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (params.deadline <= currentTime) {
      errors.push("Deadline has already passed");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates swap parameters with deadline validation using reliable external UTC time
 */
export const validateSwapParamsWithDeadline = async (params: SwapParams, api: any): Promise<ValidationResult> => {
  const basicValidation = validateSwapParams(params);

  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const errors: string[] = [...basicValidation.errors];

  // Validate deadline using blockchain time
  try {
    const currentBlockTime = await getCurrentBlockTime(api);

    if (params.deadline && params.deadline <= currentBlockTime) {
      errors.push("Deadline has already passed");
    }
  } catch (error: any) {
    console.warn("Failed to validate deadline with blockchain time:", error);
    // Fallback to basic validation
    if (params.deadline) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (params.deadline <= currentTime) {
        errors.push("Deadline has already passed");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculates slippage percentage
 */
export const calculateSlippage = (expectedAmount: string, actualAmount: string): number => {
  try {
    const expected = ethers.BigNumber.from(expectedAmount);
    const actual = ethers.BigNumber.from(actualAmount);

    if (expected.eq(0)) {
      return 0;
    }

    const difference = expected.sub(actual);
    const slippage = difference.mul(10000).div(expected); // Convert to basis points

    return slippage.toNumber() / 100; // Convert to percentage
  } catch (error) {
    console.error("Error calculating slippage:", error);
    return 0;
  }
};

/**
 * Formats amount for display
 */
export const formatAmount = (amount: string, decimals: number = 18): string => {
  try {
    const formatted = ethers.utils.formatUnits(amount, decimals);
    return parseFloat(formatted).toFixed(6);
  } catch (error) {
    console.error("Error formatting amount:", error);
    return "0.000000";
  }
};

/**
 * Converts amount to wei
 */
export const toWei = (amount: string, decimals: number = 18): string => {
  try {
    return ethers.utils.parseUnits(amount, decimals).toString();
  } catch (error) {
    console.error("Error converting to wei:", error);
    throw new Error(`Invalid amount format: ${amount}`);
  }
};

/**
 * Creates swap parameters with safe deadline
 */
export const createSwapParamsWithSafeDeadline = async (params: Omit<SwapParams, "deadline">): Promise<SwapParams> => {
  // Don't calculate deadline here - it will be calculated fresh during transaction creation
  console.log("Creating swap params - deadline will be calculated fresh during transaction creation");

  return {
    ...params,
    deadline: 0, // Placeholder - will be replaced with fresh deadline
  };
};
