/**
 * EVM Liquidity Services for 3Dpass Network
 * Handles EVM-based liquidity operations through the AssetConversion precompile
 * Compatible with Uniswap V2 interface for MetaMask integration
 */

import { ethers } from "ethers";
import {
  convertAssetIdToEVMAddress,
  convertAssetIdToLiquidityPoolAddress,
  ensureChecksummedAddress,
} from "../../app/util/assetAddressConverter";
import { type MetamaskAccount } from "../metamaskServices";

// AssetConversion precompile address on 3Dpass network
const ASSET_CONVERSION_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000902";

// AssetConversion precompile function selectors for liquidity operations
// Using selectors calculated from the exact precompile function signatures (without deadline)
const FUNCTION_SELECTORS = {
  addLiquidity: "0xca3d6539", // Calculated from addLiquidity(address,address,uint256,uint256,uint256,uint256,address)
  removeLiquidity: "0xc0e3ee6b", // Calculated from removeLiquidity(address,address,uint256,uint256,uint256,address)
} as const;

/**
 * Add liquidity parameters interface
 */
export interface AddLiquidityParams {
  asset1: string; // Asset ID for first token
  asset2: string; // Asset ID for second token
  amount1Desired: string; // Desired amount for first token (in minimum units)
  amount2Desired: string; // Desired amount for second token (in minimum units)
  amount1Min: string; // Minimum amount for first token (in minimum units)
  amount2Min: string; // Minimum amount for second token (in minimum units)
  mintTo?: string; // Address to mint LP tokens to (optional, defaults to sender)
  deadline?: number; // Transaction deadline (optional)
}

/**
 * Remove liquidity parameters interface
 * Note: LP tokens are burned during withdrawal, not withdrawn to an address
 * The lpTokenBurn parameter specifies how many LP tokens to burn
 */
export interface RemoveLiquidityParams {
  asset1: string; // Asset ID for first token
  asset2: string; // Asset ID for second token
  lpTokenId: string; // LP token ID to burn (from pool data)
  lpTokenBurn: string; // Amount of LP tokens to burn (in minimum units)
  amount1MinReceive: string; // Minimum amount to receive for first token (in minimum units)
  amount2MinReceive: string; // Minimum amount to receive for second token (in minimum units)
  withdrawTo?: string; // Address to withdraw tokens to (optional, defaults to sender)
  deadline?: number; // Transaction deadline (optional)
}

/**
 * EVM-converted add liquidity parameters
 */
export interface EVMAddLiquidityParams {
  asset1Address: string;
  asset2Address: string;
  amount1Desired: string;
  amount2Desired: string;
  amount1Min: string;
  amount2Min: string;
  mintTo: string;
  deadline: number;
}

/**
 * EVM-converted remove liquidity parameters
 */
export interface EVMRemoveLiquidityParams {
  asset1Address: string;
  asset2Address: string;
  lpTokenAddress: string; // LP token H160 address (converted from lpTokenId)
  lpTokenBurn: string;
  amount1MinReceive: string;
  amount2MinReceive: string;
  withdrawTo: string;
  deadline: number;
}

/**
 * Transaction interface for EVM operations
 */
export interface LiquidityTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
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
 * Converts Substrate asset IDs to EVM addresses and prepares parameters for add liquidity
 */
export const convertAddLiquidityParamsToEVM = async (params: AddLiquidityParams): Promise<EVMAddLiquidityParams> => {
  const asset1Address = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.asset1));
  const asset2Address = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.asset2));

  // Log the conversion for debugging
  console.log("=== ADD LIQUIDITY ASSET ADDRESS CONVERSION ===");
  console.log(`Asset ID ${params.asset1} → ${asset1Address}`);
  console.log(`Asset ID ${params.asset2} → ${asset2Address}`);
  console.log("=============================================");

  // Use provided deadline or calculate fresh one right before transaction
  const finalDeadline = params.deadline || 0; // Will be calculated fresh during transaction creation

  return {
    asset1Address,
    asset2Address,
    amount1Desired: params.amount1Desired,
    amount2Desired: params.amount2Desired,
    amount1Min: params.amount1Min,
    amount2Min: params.amount2Min,
    mintTo: params.mintTo ? ensureChecksummedAddress(params.mintTo) : "0x0000000000000000000000000000000000000000",
    deadline: finalDeadline,
  };
};

/**
 * Converts Substrate asset IDs to EVM addresses and prepares parameters for remove liquidity
 */
export const convertRemoveLiquidityParamsToEVM = async (
  params: RemoveLiquidityParams
): Promise<EVMRemoveLiquidityParams> => {
  const asset1Address = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.asset1));
  const asset2Address = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.asset2));
  const lpTokenAddress = ensureChecksummedAddress(convertAssetIdToLiquidityPoolAddress(params.lpTokenId));

  // Log the conversion for debugging
  console.log("=== REMOVE LIQUIDITY ASSET ADDRESS CONVERSION ===");
  console.log(`Asset ID ${params.asset1} → ${asset1Address}`);
  console.log(`Asset ID ${params.asset2} → ${asset2Address}`);
  console.log(`LP Token ID ${params.lpTokenId} → ${lpTokenAddress}`);
  console.log("================================================");

  // Use provided deadline or calculate fresh one right before transaction
  const finalDeadline = params.deadline || 0; // Will be calculated fresh during transaction creation

  return {
    asset1Address,
    asset2Address,
    lpTokenAddress,
    lpTokenBurn: params.lpTokenBurn,
    amount1MinReceive: params.amount1MinReceive,
    amount2MinReceive: params.amount2MinReceive,
    withdrawTo: params.withdrawTo
      ? ensureChecksummedAddress(params.withdrawTo)
      : "0x0000000000000000000000000000000000000000",
    deadline: finalDeadline,
  };
};

/**
 * Gets function selectors for Uniswap V2 compatible liquidity functions
 */
export const getLiquidityFunctionSelectors = () => {
  return { ...FUNCTION_SELECTORS };
};

/**
 * Creates transaction data for add liquidity operations
 */
export const createAddLiquidityData = (evmParams: EVMAddLiquidityParams): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint256", "uint256", "uint256", "uint256", "address"],
    [
      evmParams.asset1Address,
      evmParams.asset2Address,
      evmParams.amount1Desired,
      evmParams.amount2Desired,
      evmParams.amount1Min,
      evmParams.amount2Min,
      evmParams.mintTo,
    ]
  );

  return FUNCTION_SELECTORS.addLiquidity + encoded.slice(2);
};

/**
 * Creates transaction data for remove liquidity operations
 */
export const createRemoveLiquidityData = (evmParams: EVMRemoveLiquidityParams): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint256", "uint256", "uint256", "address"],
    [
      evmParams.asset1Address,
      evmParams.asset2Address,
      evmParams.lpTokenBurn,
      evmParams.amount1MinReceive,
      evmParams.amount2MinReceive,
      evmParams.withdrawTo,
    ]
  );

  return FUNCTION_SELECTORS.removeLiquidity + encoded.slice(2);
};

/**
 * Creates transaction data for add liquidity operations
 */
export const createAddLiquidityTransactionData = async (params: AddLiquidityParams): Promise<string> => {
  const evmParams = await convertAddLiquidityParamsToEVM(params);

  // Log the add liquidity method and amounts
  console.log("=== ADD LIQUIDITY TRANSACTION DATA ===");
  console.log(`Function selector: ${FUNCTION_SELECTORS.addLiquidity} (addLiquidity)`);
  console.log("");
  console.log("=== TRANSACTION AMOUNTS (MIN UNITS) ===");
  console.log(`Asset1: ${params.asset1} → ${evmParams.asset1Address}`);
  console.log(`Asset2: ${params.asset2} → ${evmParams.asset2Address}`);
  console.log(`Amount1 Desired: ${params.amount1Desired} (min units)`);
  console.log(`Amount2 Desired: ${params.amount2Desired} (min units)`);
  console.log(`Amount1 Min: ${params.amount1Min} (min units)`);
  console.log(`Amount2 Min: ${params.amount2Min} (min units)`);
  console.log(`Mint To: ${evmParams.mintTo}`);
  console.log("=====================================");

  return createAddLiquidityData(evmParams);
};

/**
 * Creates transaction data for remove liquidity operations
 */
export const createRemoveLiquidityTransactionData = async (params: RemoveLiquidityParams): Promise<string> => {
  const evmParams = await convertRemoveLiquidityParamsToEVM(params);

  // Log the remove liquidity method and amounts
  console.log("=== REMOVE LIQUIDITY TRANSACTION DATA ===");
  console.log(`Function selector: ${FUNCTION_SELECTORS.removeLiquidity} (removeLiquidity)`);
  console.log("");
  console.log("=== TRANSACTION AMOUNTS (MIN UNITS) ===");
  console.log(`Asset1: ${params.asset1} → ${evmParams.asset1Address}`);
  console.log(`Asset2: ${params.asset2} → ${evmParams.asset2Address}`);
  console.log(`LP Token ID: ${params.lpTokenId} → ${evmParams.lpTokenAddress}`);
  console.log(`LP Token Burn: ${params.lpTokenBurn} (min units)`);
  console.log(`Amount1 Min Receive: ${params.amount1MinReceive} (min units)`);
  console.log(`Amount2 Min Receive: ${params.amount2MinReceive} (min units)`);
  console.log(`Withdraw To: ${evmParams.withdrawTo}`);
  console.log("=======================================");

  return createRemoveLiquidityData(evmParams);
};

/**
 * Creates a complete add liquidity transaction object
 */
export const createAddLiquidityTransaction = async (
  params: AddLiquidityParams,
  account: MetamaskAccount,
  gasLimit: string
): Promise<LiquidityTransaction> => {
  if (account.walletType !== "metamask") {
    throw new Error("Account must be a MetaMask account for EVM transactions");
  }

  const evmParams = await convertAddLiquidityParamsToEVM(params);

  console.log("=== ADD LIQUIDITY TRANSACTION CREATION ===");
  console.log("Using custom interface without deadline parameter");
  console.log("===========================================");

  const transactionData = createAddLiquidityData(evmParams);

  const transaction: LiquidityTransaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0",
  };

  // Set the gas limit (always provided from estimation)
  transaction.gas = gasLimit;

  // Note: AssetConversion precompile is not payable, so value should always be 0x0
  console.log("=== ADD LIQUIDITY TRANSACTION CREATED ===");
  console.log("From:", transaction.from);
  console.log("To:", transaction.to);
  console.log("Data length:", transaction.data.length);
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (addLiquidity)`);
  console.log("Value:", transaction.value);
  console.log("Gas:", transaction.gas);
  console.log("=========================================");

  return transaction;
};

/**
 * Creates a complete remove liquidity transaction object
 */
export const createRemoveLiquidityTransaction = async (
  params: RemoveLiquidityParams,
  account: MetamaskAccount,
  gasLimit: string
): Promise<LiquidityTransaction> => {
  if (account.walletType !== "metamask") {
    throw new Error("Account must be a MetaMask account for EVM transactions");
  }

  const evmParams = await convertRemoveLiquidityParamsToEVM(params);

  console.log("=== REMOVE LIQUIDITY TRANSACTION CREATION ===");
  console.log("Using custom interface without deadline parameter");
  console.log("==============================================");

  const transactionData = createRemoveLiquidityData(evmParams);

  const transaction: LiquidityTransaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0",
  };

  // Set the gas limit (always provided from estimation)
  transaction.gas = gasLimit;

  // Note: AssetConversion precompile is not payable, so value should always be 0x0
  console.log("=== REMOVE LIQUIDITY TRANSACTION CREATED ===");
  console.log("From:", transaction.from);
  console.log("To:", transaction.to);
  console.log("Data length:", transaction.data.length);
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (removeLiquidity)`);
  console.log("Value:", transaction.value);
  console.log("Gas:", transaction.gas);
  console.log("============================================");

  return transaction;
};

/**
 * Estimates gas for add liquidity transaction
 */
export const estimateAddLiquidityGas = async (
  params: AddLiquidityParams,
  account: MetamaskAccount
): Promise<GasEstimate> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available for gas estimation");
  }

  console.log("=== ADD LIQUIDITY GAS ESTIMATION START ===");
  console.log("Input parameters:", params);
  console.log("==========================================");

  // Create a temporary transaction for gas estimation (without gas limit)
  const evmParams = await convertAddLiquidityParamsToEVM(params);

  console.log("=== GAS ESTIMATION PARAMETERS ===");
  console.log("Using custom interface without deadline parameter");
  console.log("=================================");

  const transactionData = createAddLiquidityData(evmParams);

  const transaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0",
  };

  console.log("=== ADD LIQUIDITY GAS ESTIMATION TRANSACTION ===");
  console.log("From:", transaction.from);
  console.log("To:", transaction.to);
  console.log("Data length:", transaction.data.length);
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (addLiquidity)`);
  console.log("==============================================");

  try {
    console.log("🔄 Calling eth_estimateGas for add liquidity...");
    // Estimate gas limit
    const gasLimit = await window.ethereum.request({
      method: "eth_estimateGas",
      params: [transaction],
    });

    console.log("✅ Gas estimation successful");
    console.log("Estimated gas limit:", gasLimit, `(${parseInt(gasLimit, 16)} gas units)`);

    // Try to get EIP-1559 gas parameters
    try {
      console.log("🔄 Attempting EIP-1559 gas estimation...");

      // Get fee history for EIP-1559
      const feeHistory = await window.ethereum.request({
        method: "eth_feeHistory",
        params: ["0x4", "latest", [25, 50, 75]], // Last 4 blocks, 25th, 50th, 75th percentiles
      });

      // Calculate average priority fee
      const priorityFees = feeHistory.reward.flat();
      const avgPriorityFee =
        priorityFees.reduce((sum: bigint, fee: string) => sum + BigInt(fee), 0n) / BigInt(priorityFees.length);

      // Get base fee for next block
      const baseFee = BigInt(feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]);

      // Calculate max fee per gas (base fee * 2 + priority fee)
      const maxFeePerGas = baseFee * 2n + avgPriorityFee;

      // Ensure minimum priority fee of 10 wei
      const minPriorityFee = Math.max(Number(avgPriorityFee), 10);

      console.log("✅ EIP-1559 gas estimation successful");
      console.log("Base fee:", baseFee.toString(), "wei");
      console.log("Average priority fee:", avgPriorityFee.toString(), "wei");
      console.log("Max fee per gas:", maxFeePerGas.toString(), "wei");
      console.log("Max priority fee per gas:", minPriorityFee.toString(), "wei");

      return {
        gasLimit,
        maxFeePerGas: "0x" + maxFeePerGas.toString(16),
        maxPriorityFeePerGas: "0x" + minPriorityFee.toString(16),
      };
    } catch (eip1559Error) {
      console.log("⚠️ EIP-1559 gas estimation failed, falling back to legacy gas price");
      console.error("EIP-1559 error:", eip1559Error);

      // Fallback to legacy gas price
      const gasPrice = await window.ethereum.request({
        method: "eth_gasPrice",
      });

      console.log("Legacy gas price:", gasPrice, `(${parseInt(gasPrice, 16)} wei)`);

      return {
        gasLimit,
        gasPrice,
      };
    }
  } catch (error: any) {
    console.error("❌ Gas estimation failed:", error);
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
};

/**
 * Estimates gas for remove liquidity transaction
 */
export const estimateRemoveLiquidityGas = async (
  params: RemoveLiquidityParams,
  account: MetamaskAccount
): Promise<GasEstimate> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available for gas estimation");
  }

  console.log("=== REMOVE LIQUIDITY GAS ESTIMATION START ===");
  console.log("Input parameters:", params);
  console.log("============================================");

  // Create a temporary transaction for gas estimation (without gas limit)
  const evmParams = await convertRemoveLiquidityParamsToEVM(params);

  console.log("=== GAS ESTIMATION PARAMETERS ===");
  console.log("Using custom interface without deadline parameter");
  console.log("=================================");

  const transactionData = createRemoveLiquidityData(evmParams);

  const transaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0",
  };

  console.log("=== REMOVE LIQUIDITY GAS ESTIMATION TRANSACTION ===");
  console.log("From:", transaction.from);
  console.log("To:", transaction.to);
  console.log("Data length:", transaction.data.length);
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (removeLiquidity)`);
  console.log("=================================================");

  try {
    console.log("🔄 Calling eth_estimateGas for remove liquidity...");
    // Estimate gas limit
    const gasLimit = await window.ethereum.request({
      method: "eth_estimateGas",
      params: [transaction],
    });

    console.log("✅ Gas estimation successful");
    console.log("Estimated gas limit:", gasLimit, `(${parseInt(gasLimit, 16)} gas units)`);

    // Try to get EIP-1559 gas parameters
    try {
      console.log("🔄 Attempting EIP-1559 gas estimation...");

      // Get fee history for EIP-1559
      const feeHistory = await window.ethereum.request({
        method: "eth_feeHistory",
        params: ["0x4", "latest", [25, 50, 75]], // Last 4 blocks, 25th, 50th, 75th percentiles
      });

      // Calculate average priority fee
      const priorityFees = feeHistory.reward.flat();
      const avgPriorityFee =
        priorityFees.reduce((sum: bigint, fee: string) => sum + BigInt(fee), 0n) / BigInt(priorityFees.length);

      // Get base fee for next block
      const baseFee = BigInt(feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]);

      // Calculate max fee per gas (base fee * 2 + priority fee)
      const maxFeePerGas = baseFee * 2n + avgPriorityFee;

      // Ensure minimum priority fee of 10 wei
      const minPriorityFee = Math.max(Number(avgPriorityFee), 10);

      console.log("✅ EIP-1559 gas estimation successful");
      console.log("Base fee:", baseFee.toString(), "wei");
      console.log("Average priority fee:", avgPriorityFee.toString(), "wei");
      console.log("Max fee per gas:", maxFeePerGas.toString(), "wei");
      console.log("Max priority fee per gas:", minPriorityFee.toString(), "wei");

      return {
        gasLimit,
        maxFeePerGas: "0x" + maxFeePerGas.toString(16),
        maxPriorityFeePerGas: "0x" + minPriorityFee.toString(16),
      };
    } catch (eip1559Error) {
      console.log("⚠️ EIP-1559 gas estimation failed, falling back to legacy gas price");
      console.error("EIP-1559 error:", eip1559Error);

      // Fallback to legacy gas price
      const gasPrice = await window.ethereum.request({
        method: "eth_gasPrice",
      });

      console.log("Legacy gas price:", gasPrice, `(${parseInt(gasPrice, 16)} wei)`);

      return {
        gasLimit,
        gasPrice,
      };
    }
  } catch (error: any) {
    console.error("❌ Gas estimation failed:", error);
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
};

/**
 * Creates an add liquidity transaction with gas estimation
 */
export const createAddLiquidityTransactionWithGasEstimation = async (
  params: AddLiquidityParams,
  account: MetamaskAccount
): Promise<LiquidityTransaction> => {
  const gasEstimate = await estimateAddLiquidityGas(params, account);
  const transaction = await createAddLiquidityTransaction(params, account, gasEstimate.gasLimit);

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
 * Creates a remove liquidity transaction with gas estimation
 */
export const createRemoveLiquidityTransactionWithGasEstimation = async (
  params: RemoveLiquidityParams,
  account: MetamaskAccount
): Promise<LiquidityTransaction> => {
  const gasEstimate = await estimateRemoveLiquidityGas(params, account);
  const transaction = await createRemoveLiquidityTransaction(params, account, gasEstimate.gasLimit);

  // Add gas parameters
  if (gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas) {
    transaction.maxFeePerGas = gasEstimate.maxFeePerGas;
    transaction.maxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas;
  } else if (gasEstimate.gasPrice) {
    transaction.gasPrice = gasEstimate.gasPrice;
  }

  return transaction;
};
