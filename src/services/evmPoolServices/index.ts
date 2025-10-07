/**
 * EVM Pool Creation Services
 * Handles pool creation through the AssetConversion precompile
 * Compatible with Uniswap V2 interface
 */

import { ethers } from "ethers";
import { convertAssetIdToEVMAddress, ensureChecksummedAddress } from "../../app/util/assetAddressConverter";

// AssetConversion precompile address
const ASSET_CONVERSION_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000902";

/**
 * Function selectors for pool operations
 */
export const getPoolFunctionSelectors = () => {
  return {
    // Uniswap V2 compatible selectors
    allPairsLength: "0x574f2ba3", // allPairsLength()
    allPairs: "0x1e3dd18b", // allPairs(uint256)
    getPair: "0xe6a43905", // getPair(address,address)
    createPair: "0xc9c65396", // createPair(address,address)
  } as const;
};

/**
 * Parameters for creating a pool
 */
export interface CreatePoolParams {
  asset1: string; // Asset ID for first token
  asset2: string; // Asset ID for second token
}

/**
 * EVM parameters for creating a pool
 */
export interface EVMCreatePoolParams {
  asset1Address: string;
  asset2Address: string;
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
}

/**
 * Converts Substrate asset IDs to EVM addresses for pool creation
 */
export const convertCreatePoolParamsToEVM = async (params: CreatePoolParams): Promise<EVMCreatePoolParams> => {
  const asset1Address = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.asset1));
  const asset2Address = ensureChecksummedAddress(convertAssetIdToEVMAddress(params.asset2));

  // Log the conversion for debugging
  console.log("=== CREATE POOL ASSET ADDRESS CONVERSION ===");
  console.log(`Asset ID ${params.asset1} → ${asset1Address}`);
  console.log(`Asset ID ${params.asset2} → ${asset2Address}`);
  console.log("===========================================");

  return {
    asset1Address,
    asset2Address,
  };
};

/**
 * Creates transaction data for createPair function
 */
export const createCreatePairTransactionData = (params: EVMCreatePoolParams): string => {
  const { asset1Address, asset2Address } = params;

  // Function selector for createPair: 0xc9c65396
  const functionSelector = "0xc9c65396";

  // Encode parameters: (address tokenA, address tokenB)
  const encodedParams = ethers.utils.defaultAbiCoder.encode(["address", "address"], [asset1Address, asset2Address]);

  const transactionData = functionSelector + encodedParams.slice(2);

  console.log("=== CREATE PAIR TRANSACTION DATA ===");
  console.log(`Function selector: ${functionSelector} (createPair)`);
  console.log("");
  console.log("=== TRANSACTION PARAMETERS ===");
  console.log(`Token A: ${asset1Address}`);
  console.log(`Token B: ${asset2Address}`);
  console.log("===============================");

  return transactionData;
};

/**
 * Creates a complete transaction for pool creation with gas estimation
 */
export const createCreatePoolTransactionWithGasEstimation = async (
  params: CreatePoolParams,
  account: any
): Promise<any> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available for transaction creation");
  }

  console.log("=== CREATE POOL TRANSACTION CREATION ===");
  console.log("Input parameters:", params);
  console.log("========================================");

  // Convert parameters to EVM format
  const evmParams = await convertCreatePoolParamsToEVM(params);

  // Create transaction data
  const transactionData = createCreatePairTransactionData(evmParams);

  // Estimate gas
  const gasEstimate = await estimateCreatePoolGas(params, account);

  // Create transaction object
  const transaction = {
    from: ensureChecksummedAddress(account.evmAddress),
    to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
    data: transactionData,
    value: "0x0", // Pool creation doesn't require ETH
    gas: gasEstimate.gasLimit,
    ...(gasEstimate.maxFeePerGas && { maxFeePerGas: gasEstimate.maxFeePerGas }),
    ...(gasEstimate.maxPriorityFeePerGas && { maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas }),
    ...(gasEstimate.gasPrice && { gasPrice: gasEstimate.gasPrice }),
  };

  console.log("=== FINAL TRANSACTION OBJECT ===");
  console.log("From:", transaction.from);
  console.log("To:", transaction.to);
  console.log("Data length:", transaction.data.length);
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (createPair)`);
  console.log("Gas limit:", transaction.gas);
  console.log("Value:", transaction.value);
  if (transaction.maxFeePerGas) {
    console.log("Max fee per gas:", transaction.maxFeePerGas);
    console.log("Max priority fee per gas:", transaction.maxPriorityFeePerGas);
  }
  if (transaction.gasPrice) {
    console.log("Gas price:", transaction.gasPrice);
  }
  console.log("===============================");

  return transaction;
};

/**
 * Estimates gas for pool creation
 */
export const estimateCreatePoolGas = async (params: CreatePoolParams, account: any): Promise<GasEstimate> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available for gas estimation");
  }

  console.log("=== GAS ESTIMATION START ===");
  console.log("Input parameters:", params);
  console.log("===========================");

  // Create a temporary transaction for gas estimation
  const evmParams = await convertCreatePoolParamsToEVM(params);
  const transactionData = createCreatePairTransactionData(evmParams);

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
  console.log(`Function selector: ${transaction.data.substring(0, 10)} (createPair)`);
  console.log("================================");

  try {
    console.log("🔄 Calling eth_estimateGas...");
    // Estimate gas limit
    const gasLimit = await window.ethereum.request({
      method: "eth_estimateGas",
      params: [transaction],
    });

    console.log("✅ Gas estimation successful");
    console.log("Estimated gas limit:", gasLimit);

    // Try to get EIP-1559 gas parameters
    try {
      console.log("🔄 Getting EIP-1559 gas parameters...");
      const feeHistory = await window.ethereum.request({
        method: "eth_feeHistory",
        params: ["0x4", "latest", [25, 50, 75]], // 4 blocks, 25th, 50th, 75th percentiles
      });

      const baseFeePerGas = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
      const maxPriorityFeePerGas = feeHistory.reward[0][1]; // 50th percentile

      // Calculate maxFeePerGas (base fee + priority fee + buffer)
      const baseFee = parseInt(baseFeePerGas, 16);
      const priorityFee = parseInt(maxPriorityFeePerGas, 16);
      const maxFeePerGas = baseFee + priorityFee + Math.floor(baseFee * 0.1); // 10% buffer

      console.log("✅ EIP-1559 gas parameters obtained");
      console.log("Base fee per gas:", baseFeePerGas);
      console.log("Max priority fee per gas:", maxPriorityFeePerGas);
      console.log("Calculated max fee per gas:", `0x${maxFeePerGas.toString(16)}`);

      return {
        gasLimit,
        maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas,
      };
    } catch (eip1559Error) {
      console.log("⚠️ EIP-1559 not supported, falling back to legacy gas price");

      // Fallback to legacy gas price
      const gasPrice = await window.ethereum.request({
        method: "eth_gasPrice",
      });

      console.log("✅ Legacy gas price obtained:", gasPrice);

      return {
        gasLimit,
        gasPrice,
      };
    }
  } catch (error: any) {
    console.error("❌ Gas estimation failed:", error);

    // Use default gas parameters as fallback
    const defaultGasLimit = "0x895440"; // 9,000,000 wei
    const defaultMaxFeePerGas = "0x64"; // 100 wei
    const defaultMaxPriorityFeePerGas = "0xA"; // 10 wei

    console.log("🔄 Using default gas parameters as fallback");
    console.log("Default gas limit:", defaultGasLimit);
    console.log("Default max fee per gas:", defaultMaxFeePerGas);
    console.log("Default max priority fee per gas:", defaultMaxPriorityFeePerGas);

    return {
      gasLimit: defaultGasLimit,
      maxFeePerGas: defaultMaxFeePerGas,
      maxPriorityFeePerGas: defaultMaxPriorityFeePerGas,
    };
  }
};

/**
 * Parses PairCreated event from transaction receipt
 * Event signature: PairCreated(address indexed token0, address indexed token1, address pair, uint256 allPairsLength)
 * Event selector: 0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9
 */
export const parsePairCreatedEvent = (receipt: any) => {
  if (!receipt.logs || !Array.isArray(receipt.logs)) {
    return null;
  }

  // Look for PairCreated event (selector: 0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9)
  const pairCreatedEvent = receipt.logs.find(
    (log: any) => log.topics && log.topics[0] === "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9"
  );

  if (!pairCreatedEvent) {
    return null;
  }

  try {
    // Decode the event data
    // Event structure: PairCreated(address indexed token0, address indexed token1, address pair, uint256 allPairsLength)
    // topics[0] = event selector
    // topics[1] = token0 (indexed)
    // topics[2] = token1 (indexed)
    // data = pair address + allPairsLength (non-indexed)

    const token0 = "0x" + pairCreatedEvent.topics[1].slice(26); // Remove 0x and first 6 bytes (0x000000000000000000000000)
    const token1 = "0x" + pairCreatedEvent.topics[2].slice(26); // Remove 0x and first 6 bytes (0x000000000000000000000000)

    // Decode the data part (pair address + allPairsLength)
    const decodedData = ethers.utils.defaultAbiCoder.decode(["address", "uint256"], pairCreatedEvent.data);

    const pair = decodedData[0];
    const allPairsLength = decodedData[1].toString();

    return {
      token0,
      token1,
      pair,
      allPairsLength,
      contractAddress: pairCreatedEvent.address,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Failed to parse PairCreated event:", error);
    return null;
  }
};

/**
 * Checks if a pool already exists for the given token pair
 */
export const checkPoolExists = async (params: CreatePoolParams): Promise<boolean> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not available for pool check");
  }

  try {
    // Convert parameters to EVM format
    const evmParams = await convertCreatePoolParamsToEVM(params);
    const { asset1Address, asset2Address } = evmParams;

    // Function selector for getPair: 0xe6a43905
    const functionSelector = "0xe6a43905";

    // Encode parameters: (address tokenA, address tokenB)
    const encodedParams = ethers.utils.defaultAbiCoder.encode(["address", "address"], [asset1Address, asset2Address]);

    const transactionData = functionSelector + encodedParams.slice(2);

    console.log("=== CHECKING IF POOL EXISTS ===");
    console.log(`Function selector: ${functionSelector} (getPair)`);
    console.log(`Token A: ${asset1Address}`);
    console.log(`Token B: ${asset2Address}`);
    console.log("=============================");

    // Call the getPair function
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: ensureChecksummedAddress(ASSET_CONVERSION_PRECOMPILE_ADDRESS),
          data: transactionData,
        },
        "latest",
      ],
    });

    // Decode the result (should return an address)
    const pairAddress = ethers.utils.defaultAbiCoder.decode(["address"], result)[0];

    console.log("Pool address:", pairAddress);

    // If the address is not the zero address, the pool exists
    const poolExists = pairAddress !== "0x0000000000000000000000000000000000000000";
    console.log("Pool exists:", poolExists);

    return poolExists;
  } catch (error) {
    console.error("Error checking if pool exists:", error);
    // If there's an error, assume pool doesn't exist and let the creation attempt proceed
    return false;
  }
};

/**
 * Validates pool creation parameters
 */
export const validateCreatePoolParams = (params: CreatePoolParams): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!params.asset1 || params.asset1 === "") {
    errors.push("Asset 1 is required");
  }

  if (!params.asset2 || params.asset2 === "") {
    errors.push("Asset 2 is required");
  }

  if (params.asset1 === params.asset2) {
    errors.push("Asset 1 and Asset 2 must be different");
  }

  // Validate asset IDs are valid numbers
  if (params.asset1 && isNaN(Number(params.asset1))) {
    errors.push("Asset 1 must be a valid asset ID");
  }

  if (params.asset2 && isNaN(Number(params.asset2))) {
    errors.push("Asset 2 must be a valid asset ID");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
