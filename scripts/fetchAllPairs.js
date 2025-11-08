import { ethers } from "ethers";

// Precompile address
const PRECOMPILE_ADDR = "0x0000000000000000000000000000000000000902";

// Function selectors - using the selectors from the test file that are known to work
// These are the standard Uniswap V2 compatible selectors
const SELECTOR_ALL_PAIRS_LENGTH = "0x574f2ba3"; // allPairsLength()
const SELECTOR_ALL_PAIRS = "0x1e3dd18b"; // allPairs(uint256)
const SELECTOR_GET_PAIR = "0xe6a43905"; // getPair(address,address)

// WebSocket RPC endpoint
const RPC_URL = "wss://rpc.3dpass.org";

/**
 * Get the total number of pairs
 */
async function getAllPairsLength(provider) {
  try {
    const input = ethers.utils.hexConcat([SELECTOR_ALL_PAIRS_LENGTH]);
    
    const result = await provider.call({
      to: PRECOMPILE_ADDR,
      data: input,
    });

    const decoded = ethers.utils.defaultAbiCoder.decode(["uint256"], result);
    return decoded[0].toNumber();
  } catch (error) {
    console.error("Error calling allPairsLength:", error);
    throw error;
  }
}

/**
 * Get pair address at a specific index
 */
async function getAllPairs(provider, index) {
  try {
    const input = ethers.utils.hexConcat([
      SELECTOR_ALL_PAIRS,
      ethers.utils.defaultAbiCoder.encode(["uint256"], [index]),
    ]);

    const result = await provider.call({
      to: PRECOMPILE_ADDR,
      data: input,
    });

    const decoded = ethers.utils.defaultAbiCoder.decode(["address"], result);
    return decoded[0];
  } catch (error) {
    console.error(`Error calling allPairs(${index}):`, error);
    throw error;
  }
}

/**
 * Get pair address for a specific token pair
 */
async function getPair(provider, tokenA, tokenB) {
  try {
    const input = ethers.utils.hexConcat([
      SELECTOR_GET_PAIR,
      ethers.utils.defaultAbiCoder.encode(["address", "address"], [tokenA, tokenB]),
    ]);

    const result = await provider.call({
      to: PRECOMPILE_ADDR,
      data: input,
    });

    const decoded = ethers.utils.defaultAbiCoder.decode(["address"], result);
    return decoded[0];
  } catch (error) {
    console.error(`Error calling getPair(${tokenA}, ${tokenB}):`, error);
    throw error;
  }
}

/**
 * Main function to fetch and print all pairs
 */
async function main() {
  let provider;
  
  try {
    console.log("Connecting to WebSocket RPC:", RPC_URL);
    provider = new ethers.providers.WebSocketProvider(RPC_URL);

    // Test connection
    const blockNumber = await provider.getBlockNumber();
    console.log("✓ Connected successfully! Current block:", blockNumber);
    console.log("");

    // Fetch pair by token addresses
    const tokenA = "0x0000000000000000000000000000000000000802"; // P3D native
    const tokenB = "0xfBFBfbFA000000000000000000000000000000de"; // wUSDT
    
    console.log("Fetching pair by token addresses...");
    console.log(`TokenA: ${tokenA}`);
    console.log(`TokenB: ${tokenB}`);
    try {
      const pairAddress = await getPair(provider, tokenA, tokenB);
      console.log(`✓ Pair address: ${pairAddress}`);
      
      // Check if it's a zero address (pair doesn't exist)
      if (pairAddress === ethers.constants.AddressZero) {
        console.log("⚠ No pair found for these tokens (returned zero address)");
      } else {
        console.log("✓ Pair exists!");
      }
    } catch (error) {
      console.error(`✗ Error fetching pair:`, error.message);
    }
    console.log("");

    // Get total number of pairs
    console.log("Fetching total number of pairs...");
    const totalPairs = await getAllPairsLength(provider);
    console.log(`✓ Total pairs: ${totalPairs}`);
    console.log("");

    if (totalPairs === 0) {
      console.log("No pairs found in the system.");
      return;
    }

    // Fetch all pairs by index
    console.log("Fetching all pairs by index...");
    console.log("=".repeat(60));
    
    const pairs = [];
    for (let i = 0; i < totalPairs; i++) {
      try {
        const pairAddress = await getAllPairs(provider, i);
        pairs.push({ index: i, address: pairAddress });
        console.log(`Pair ${i}: ${pairAddress}`);
      } catch (error) {
        console.error(`✗ Error fetching pair at index ${i}:`, error.message);
        pairs.push({ index: i, address: "ERROR", error: error.message });
      }
    }

    console.log("=".repeat(60));
    console.log("");
    console.log("Summary:");
    console.log(`Total pairs: ${totalPairs}`);
    console.log(`Successfully fetched: ${pairs.filter(p => p.address !== "ERROR").length}`);
    console.log(`Errors: ${pairs.filter(p => p.address === "ERROR").length}`);
    console.log("");

    // Print all pairs in a formatted way
    console.log("All pairs:");
    pairs.forEach((pair) => {
      if (pair.address === "ERROR") {
        console.log(`  [${pair.index}]: ERROR - ${pair.error}`);
      } else {
        console.log(`  [${pair.index}]: ${pair.address}`);
      }
    });

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    // Clean up WebSocket connection
    if (provider && typeof provider.destroy === "function") {
      await provider.destroy();
      console.log("\n✓ WebSocket connection closed");
    }
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

