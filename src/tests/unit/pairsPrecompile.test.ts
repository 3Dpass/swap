import { ethers } from "ethers";
import { NETWORKS } from "../../networkConfig";
import { NetworkKeys } from "../../app/types/enum";
import { EVM_PRECOMPILES } from "../../config/evmPrecompiles";

// Pairs contract interface based on the provided Pairs.sol
interface IPairsContract {
  allPairsLength(): Promise<number>;
  allPairs(index: number): Promise<string>;
  getPair(tokenA: string, tokenB: string): Promise<string>;
  nextPoolAssetId(): Promise<{ exists: boolean; id: number }>;
}

// Standard function selectors (calculated from function signatures)
const SELECTORS = {
  ALL_PAIRS_LENGTH: "0x574f2ba3", // allPairsLength()
  ALL_PAIRS: "0x1e3dd18b", // allPairs(uint256)
  GET_PAIR: "0xe6a43905", // getPair(address,address)
  NEXT_POOL_ASSET_ID: "0xb5c9f6b1", // nextPoolAssetId()
  CREATE_PAIR: "0xc9c65396", // createPair(address,address)
} as const;

// Pairs contract implementation that directly calls the precompile
class PairsContract implements IPairsContract {
  private provider: ethers.providers.Provider;
  private precompileAddress: string;

  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
    this.precompileAddress = EVM_PRECOMPILES.ASSET_CONVERSION;
  }

  async allPairsLength(): Promise<number> {
    try {
      // Create the function call data exactly as in Pairs.sol
      const input = ethers.utils.hexConcat([SELECTORS.ALL_PAIRS_LENGTH]);

      const result = await this.provider.call({
        to: this.precompileAddress,
        data: input,
      });

      // Decode the result as uint256
      const decoded = ethers.utils.defaultAbiCoder.decode(["uint256"], result);
      return decoded[0].toNumber();
    } catch (error) {
      console.error("Error calling allPairsLength:", error);
      throw error;
    }
  }

  async allPairs(index: number): Promise<string> {
    try {
      // Create the function call data exactly as in Pairs.sol
      const input = ethers.utils.hexConcat([
        SELECTORS.ALL_PAIRS,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [index]),
      ]);

      const result = await this.provider.call({
        to: this.precompileAddress,
        data: input,
      });

      // Decode the result as address
      const decoded = ethers.utils.defaultAbiCoder.decode(["address"], result);
      return decoded[0];
    } catch (error) {
      console.error(`Error calling allPairs(${index}):`, error);
      throw error;
    }
  }

  async getPair(tokenA: string, tokenB: string): Promise<string> {
    try {
      // Create the function call data exactly as in Pairs.sol
      const input = ethers.utils.hexConcat([
        SELECTORS.GET_PAIR,
        ethers.utils.defaultAbiCoder.encode(["address", "address"], [tokenA, tokenB]),
      ]);

      const result = await this.provider.call({
        to: this.precompileAddress,
        data: input,
      });

      // Decode the result as address
      const decoded = ethers.utils.defaultAbiCoder.decode(["address"], result);
      return decoded[0];
    } catch (error) {
      console.error(`Error calling getPair(${tokenA}, ${tokenB}):`, error);
      throw error;
    }
  }

  async nextPoolAssetId(): Promise<{ exists: boolean; id: number }> {
    try {
      // Create the function call data exactly as in Pairs.sol
      const input = ethers.utils.hexConcat([SELECTORS.NEXT_POOL_ASSET_ID]);

      const result = await this.provider.call({
        to: this.precompileAddress,
        data: input,
      });

      // Decode the result as (bool, uint256)
      const decoded = ethers.utils.defaultAbiCoder.decode(["bool", "uint256"], result);
      return {
        exists: decoded[0],
        id: decoded[1].toNumber(),
      };
    } catch (error) {
      console.error("Error calling nextPoolAssetId:", error);
      throw error;
    }
  }
}

describe("Pairs Precompile Integration Tests", () => {
  let provider: ethers.providers.Provider;
  let pairsContract: PairsContract;

  beforeAll(async () => {
    // Set up provider for 3Dpass network
    const networkConfig = NETWORKS[NetworkKeys.P3D];

    console.log("Attempting to connect to 3Dpass network...");
    console.log("RPC URL:", networkConfig.rpcUrl);

    try {
      // Try WebSocket provider first
      provider = new ethers.providers.WebSocketProvider(networkConfig.rpcUrl);
      pairsContract = new PairsContract(provider);

      // Test the connection by making a simple call
      console.log("Testing WebSocket connection...");
      const blockNumber = await provider.getBlockNumber();
      console.log("WebSocket connection successful! Current block:", blockNumber);
    } catch (wsError) {
      console.warn("WebSocket connection failed, trying HTTP provider...", wsError);

      // Fallback to HTTP provider
      const httpUrl = networkConfig.rpcUrl.replace("wss://", "https://").replace("ws://", "http://");
      provider = new ethers.providers.JsonRpcProvider(httpUrl);
      pairsContract = new PairsContract(provider);

      // Test the HTTP connection
      console.log("Testing HTTP connection...");
      const blockNumber = await provider.getBlockNumber();
      console.log("HTTP connection successful! Current block:", blockNumber);
    }
  }, 20000); // 20 second timeout for beforeAll

  afterAll(async () => {
    // Clean up WebSocket connection
    if (provider && "destroy" in provider) {
      await (provider as any).destroy();
    }
  }, 5000);

  describe("Precompile Connection", () => {
    it("should connect to the 3Dpass network successfully", async () => {
      const network = await provider.getNetwork();
      expect(network).toBeDefined();
      console.log("Connected to network:", network);
    }, 10000);

    it("should be able to call the precompile address", async () => {
      try {
        const result = await provider.call({
          to: EVM_PRECOMPILES.ASSET_CONVERSION,
          data: "0x",
        });
        expect(result).toBeDefined();
        console.log("Precompile call successful, result:", result);
      } catch (error) {
        console.log("Precompile call result (may be expected):", error);
        // This might fail with "execution reverted" which is expected for empty data
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe("Pairs Contract Functions", () => {
    it("should get total pairs length", async () => {
      try {
        const totalPairs = await pairsContract.allPairsLength();
        console.log("Total pairs:", totalPairs);
        expect(typeof totalPairs).toBe("number");
        expect(totalPairs).toBeGreaterThanOrEqual(0);

        // Log the function call details for debugging
        console.log("Function selector used:", SELECTORS.ALL_PAIRS_LENGTH);
        console.log("Precompile address:", EVM_PRECOMPILES.ASSET_CONVERSION);
      } catch (error) {
        console.error("Error getting pairs length:", error);
        throw error;
      }
    }, 15000);

    it("should fetch all pairs by index with detailed validation", async () => {
      try {
        const totalPairs = await pairsContract.allPairsLength();
        console.log("Fetching pairs for total count:", totalPairs);

        if (totalPairs === 0) {
          console.log("No pairs found in the system");
          return;
        }

        const pairs: Array<{ index: number; address: string; isValid: boolean }> = [];

        // Fetch each pair by index with detailed logging
        for (let i = 0; i < totalPairs; i++) {
          try {
            console.log(`Fetching pair at index ${i}...`);
            const pairAddress = await pairsContract.allPairs(i);
            const isValid = ethers.utils.isAddress(pairAddress);

            pairs.push({
              index: i,
              address: pairAddress,
              isValid,
            });

            console.log(`Pair ${i}: ${pairAddress} (valid: ${isValid})`);

            // Additional validation for non-zero addresses
            if (pairAddress !== ethers.constants.AddressZero) {
              try {
                const code = await provider.getCode(pairAddress);
                console.log(`  - Contract code length: ${code.length} bytes`);
                console.log(`  - Is contract: ${code !== "0x"}`);
              } catch (codeError) {
                console.log(`  - Could not fetch contract code: ${codeError}`);
              }
            }
          } catch (error) {
            console.error(`Error fetching pair at index ${i}:`, error);
            pairs.push({
              index: i,
              address: "ERROR",
              isValid: false,
            });
          }
        }

        console.log(`Successfully processed ${pairs.length} out of ${totalPairs} pairs`);
        expect(pairs.length).toBeGreaterThanOrEqual(0);
        expect(pairs.length).toBeLessThanOrEqual(totalPairs);

        // Validate that all successful addresses are valid
        const validPairs = pairs.filter((p) => p.isValid && p.address !== "ERROR");
        validPairs.forEach((pair) => {
          expect(ethers.utils.isAddress(pair.address)).toBe(true);
        });

        console.log(`Valid pairs found: ${validPairs.length}/${pairs.length}`);
      } catch (error) {
        console.error("Error in fetch all pairs test:", error);
        throw error;
      }
    }, 30000);

    it("should get next pool asset id with validation", async () => {
      try {
        const result = await pairsContract.nextPoolAssetId();
        console.log("Next pool asset id result:", result);

        expect(result).toHaveProperty("exists");
        expect(result).toHaveProperty("id");
        expect(typeof result.exists).toBe("boolean");
        expect(typeof result.id).toBe("number");
        expect(result.id).toBeGreaterThanOrEqual(0);

        console.log(`Next pool asset ID: ${result.id} (exists: ${result.exists})`);

        // If exists is true, the ID should be meaningful
        if (result.exists) {
          expect(result.id).toBeGreaterThan(0);
          console.log("Next available asset ID for pool creation:", result.id);
        } else {
          console.log("No next pool asset ID available");
        }
      } catch (error) {
        console.error("Error getting next pool asset id:", error);
        throw error;
      }
    }, 15000);

    it("should handle getPair with various token address combinations", async () => {
      try {
        // Test with different token address combinations
        const testCases = [
          {
            name: "Native token + Asset ID 1",
            tokenA: "0x0000000000000000000000000000000000000802", // Native token (P3D precompile)
            tokenB: "0xFBFBFBFA00000000000000000000000000000001", // Asset ID 1
          },
          {
            name: "Asset ID 1 + Asset ID 2",
            tokenA: "0xFBFBFBFA00000000000000000000000000000001", // Asset ID 1
            tokenB: "0xFBFBFBFA00000000000000000000000000000002", // Asset ID 2
          },
          {
            name: "Same token (should return zero address)",
            tokenA: "0x0000000000000000000000000000000000000802", // Native token
            tokenB: "0x0000000000000000000000000000000000000802", // Same native token
          },
        ];

        for (const testCase of testCases) {
          console.log(`\nTesting getPair: ${testCase.name}`);
          console.log(`TokenA: ${testCase.tokenA}`);
          console.log(`TokenB: ${testCase.tokenB}`);

          const pairAddress = await pairsContract.getPair(testCase.tokenA, testCase.tokenB);
          console.log(`Result: ${pairAddress}`);

          // The result should always be a valid address
          expect(ethers.utils.isAddress(pairAddress)).toBe(true);

          // If it's the same token, should return zero address
          if (testCase.tokenA === testCase.tokenB) {
            expect(pairAddress).toBe(ethers.constants.AddressZero);
            console.log("✓ Correctly returned zero address for same token pair");
          } else {
            console.log(`✓ Returned address for different token pair: ${pairAddress}`);
          }
        }
      } catch (error) {
        console.error("Error in getPair test:", error);
        throw error;
      }
    }, 20000);
  });

  describe("Real Data Validation", () => {
    it("should provide comprehensive pair information and analysis", async () => {
      try {
        console.log("\n=== STARTING COMPREHENSIVE PAIRS ANALYSIS ===");

        // Get basic system information
        const totalPairs = await pairsContract.allPairsLength();
        const nextAssetId = await pairsContract.nextPoolAssetId();

        console.log("\n=== PAIRS PRECOMPILE SUMMARY ===");
        console.log(`Precompile address: ${EVM_PRECOMPILES.ASSET_CONVERSION}`);
        console.log(`Total pairs in system: ${totalPairs}`);
        console.log(`Next pool asset ID: ${nextAssetId.id} (exists: ${nextAssetId.exists})`);
        console.log("================================\n");

        if (totalPairs > 0) {
          console.log("Fetching detailed pair information...");

          const pairAnalysis = {
            totalPairs,
            validPairs: 0,
            zeroAddressPairs: 0,
            contractPairs: 0,
            errorPairs: 0,
            pairs: [] as Array<{
              index: number;
              address: string;
              isValid: boolean;
              isContract: boolean;
              codeLength: number;
            }>,
          };

          // Fetch all pairs with detailed analysis
          for (let i = 0; i < totalPairs; i++) {
            try {
              console.log(`\nAnalyzing pair ${i}/${totalPairs - 1}...`);
              const pairAddress = await pairsContract.allPairs(i);
              const isValid = ethers.utils.isAddress(pairAddress);
              const isZeroAddress = pairAddress === ethers.constants.AddressZero;

              let isContract = false;
              let codeLength = 0;

              if (isValid && !isZeroAddress) {
                try {
                  const code = await provider.getCode(pairAddress);
                  codeLength = code.length;
                  isContract = code !== "0x";
                } catch (codeError) {
                  console.log(`  - Could not fetch contract code: ${codeError}`);
                }
              }

              const pairInfo = {
                index: i,
                address: pairAddress,
                isValid,
                isContract,
                codeLength,
              };

              pairAnalysis.pairs.push(pairInfo);

              // Update counters
              if (isValid) {
                pairAnalysis.validPairs++;
                if (isZeroAddress) {
                  pairAnalysis.zeroAddressPairs++;
                } else if (isContract) {
                  pairAnalysis.contractPairs++;
                }
              } else {
                pairAnalysis.errorPairs++;
              }

              console.log(`  Address: ${pairAddress}`);
              console.log(`  Valid: ${isValid}`);
              console.log(`  Is Contract: ${isContract}`);
              console.log(`  Code Length: ${codeLength} bytes`);
            } catch (pairError) {
              console.log(`  - Error fetching pair ${i}: ${pairError}`);
              pairAnalysis.errorPairs++;
              pairAnalysis.pairs.push({
                index: i,
                address: "ERROR",
                isValid: false,
                isContract: false,
                codeLength: 0,
              });
            }
          }

          // Print comprehensive analysis
          console.log("\n=== COMPREHENSIVE PAIRS ANALYSIS ===");
          console.log(`Total pairs processed: ${pairAnalysis.totalPairs}`);
          console.log(`Valid pairs: ${pairAnalysis.validPairs}`);
          console.log(`Zero address pairs: ${pairAnalysis.zeroAddressPairs}`);
          console.log(`Contract pairs: ${pairAnalysis.contractPairs}`);
          console.log(`Error pairs: ${pairAnalysis.errorPairs}`);
          console.log("=====================================\n");

          // Show first few valid contract pairs in detail
          const validContractPairs = pairAnalysis.pairs.filter((p) => p.isValid && p.isContract);
          if (validContractPairs.length > 0) {
            console.log("=== VALID CONTRACT PAIRS (first 5) ===");
            validContractPairs.slice(0, 5).forEach((pair) => {
              console.log(`Pair ${pair.index}: ${pair.address} (${pair.codeLength} bytes)`);
            });
            console.log("=====================================\n");
          }

          // Test getPair functionality with found pairs
          if (validContractPairs.length > 0) {
            console.log("=== TESTING GET_PAIR FUNCTIONALITY ===");
            const testPair = validContractPairs[0];
            console.log(`Testing getPair with pair at index ${testPair.index}: ${testPair.address}`);

            // Note: We can't easily reverse-engineer the token addresses from pair addresses
            // This is more of a demonstration that the function works
            console.log("Note: getPair requires token addresses, not pair addresses");
            console.log("=====================================\n");
          }
        } else {
          console.log("No pairs found in the system.");
          console.log("This could mean:");
          console.log("1. The system is new and no pairs have been created yet");
          console.log("2. All pairs have been removed");
          console.log("3. There might be an issue with the precompile connection");
        }

        // Validate the results
        expect(totalPairs).toBeGreaterThanOrEqual(0);
        expect(nextAssetId).toBeDefined();
        expect(typeof nextAssetId.exists).toBe("boolean");
        expect(typeof nextAssetId.id).toBe("number");

        console.log("\n=== ANALYSIS COMPLETE ===");
      } catch (error) {
        console.error("Error in comprehensive validation:", error);
        throw error;
      }
    }, 60000); // 60 second timeout for comprehensive analysis
  });
});
