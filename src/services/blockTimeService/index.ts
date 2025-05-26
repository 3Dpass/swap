import type { ApiPromise } from "@polkadot/api";
import type { Header } from "@polkadot/types/interfaces";
import { setupPolkadotApi } from "../polkadotWalletServices";

interface BlockTimeData {
  blockNumber: number;
  timestamp: number;
}

class BlockTimeService {
  private static instance: BlockTimeService;
  private blockTimeHistory: BlockTimeData[] = [];
  private estimatedBlockTime: number = 60000; // Default 60 seconds
  private subscription: (() => void) | null = null;
  private api: ApiPromise | null = null;
  private readonly MAX_HISTORY_LENGTH = 10; // Keep last 10 blocks
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): BlockTimeService {
    if (!BlockTimeService.instance) {
      BlockTimeService.instance = new BlockTimeService();
    }
    return BlockTimeService.instance;
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) return;

    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start new initialization
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      this.api = await setupPolkadotApi();

      // Get expected block time from chain constants
      const expectedBlockTime = this.getExpectedBlockTimeFromChain();
      if (expectedBlockTime) {
        this.estimatedBlockTime = expectedBlockTime;
      }

      // Fetch historical blocks first to calculate initial average
      await this.fetchHistoricalBlocks();

      // Subscribe to new block headers
      const unsubscribe = await this.api.rpc.chain.subscribeNewHeads(async (header: Header) => {
        await this.processNewBlock(header);
      });

      this.subscription = unsubscribe;
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize BlockTimeService:", error);
      // Even if initialization fails, mark as initialized to prevent retries
      this.isInitialized = true;
      throw error; // Re-throw to let callers know initialization failed
    }
  }

  private getExpectedBlockTimeFromChain(): number | null {
    if (!this.api) return null;

    try {
      // Try BABE consensus (Polkadot/Kusama)
      const babeExpectedBlockTime = this.api.consts.babe?.expectedBlockTime;
      if (babeExpectedBlockTime) {
        return babeExpectedBlockTime.toNumber();
      }

      // Try Aura consensus (most parachains)
      const timestampMinimumPeriod = this.api.consts.timestamp?.minimumPeriod;
      if (timestampMinimumPeriod) {
        return timestampMinimumPeriod.toNumber() * 2;
      }

      // Default fallback
      return 60000; // 60 seconds
    } catch (error) {
      console.error("Failed to get expected block time from chain:", error);
      return null;
    }
  }

  private async fetchHistoricalBlocks(): Promise<void> {
    if (!this.api) return;

    try {
      // Get current block number
      const currentHeader = await this.api.rpc.chain.getHeader();
      const currentBlockNumber = currentHeader.number.toNumber();

      // Fetch last 10 blocks
      const blocksToFetch = Math.min(this.MAX_HISTORY_LENGTH, currentBlockNumber);
      const startBlock = Math.max(1, currentBlockNumber - blocksToFetch + 1);

      for (let blockNum = startBlock; blockNum <= currentBlockNumber; blockNum++) {
        try {
          const blockHash = await this.api.rpc.chain.getBlockHash(blockNum);
          const signedBlock = await this.api.rpc.chain.getBlock(blockHash);

          // Extract timestamp from extrinsics
          let timestamp: number | null = null;

          for (const extrinsic of signedBlock.block.extrinsics) {
            if (extrinsic.method.section === "timestamp" && extrinsic.method.method === "set") {
              timestamp = parseInt(extrinsic.method.args[0].toString());
              break;
            }
          }

          if (timestamp) {
            // Check if this block is not already in history
            const exists = this.blockTimeHistory.some((block) => block.blockNumber === blockNum);
            if (!exists) {
              this.blockTimeHistory.push({
                blockNumber: blockNum,
                timestamp,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch block ${blockNum}:`, error);
        }
      }

      // Calculate initial average if we have enough data
      this.calculateAverageBlockTime();
    } catch (error) {
      console.error("Failed to fetch historical blocks:", error);
    }
  }

  private async processNewBlock(header: Header): Promise<void> {
    try {
      if (!this.api) return;

      const blockNumber = header.number.toNumber();
      const blockHash = header.hash;

      // Get the block to extract timestamp
      const signedBlock = await this.api.rpc.chain.getBlock(blockHash);

      // Extract timestamp from extrinsics
      let timestamp: number | null = null;

      for (const extrinsic of signedBlock.block.extrinsics) {
        // Check if this is a timestamp.set inherent
        if (extrinsic.method.section === "timestamp" && extrinsic.method.method === "set") {
          // The timestamp is the first argument
          timestamp = parseInt(extrinsic.method.args[0].toString());
          break;
        }
      }

      if (timestamp) {
        // Check if this block is not already in history
        const exists = this.blockTimeHistory.some((block) => block.blockNumber === blockNumber);
        if (!exists) {
          const blockData: BlockTimeData = {
            blockNumber,
            timestamp,
          };

          this.blockTimeHistory.push(blockData);

          // Keep only the latest blocks
          if (this.blockTimeHistory.length > this.MAX_HISTORY_LENGTH) {
            this.blockTimeHistory.shift();
          }

          // Calculate average block time if we have enough data
          this.calculateAverageBlockTime();
        }
      }
    } catch (error) {
      console.error("Failed to process new block:", error);
    }
  }

  private calculateAverageBlockTime(): void {
    if (this.blockTimeHistory.length < 2) return;

    // Sort by block number to ensure proper order
    const sortedHistory = [...this.blockTimeHistory].sort((a, b) => a.blockNumber - b.blockNumber);

    const intervals: number[] = [];

    // Calculate intervals between consecutive blocks
    for (let i = 1; i < sortedHistory.length; i++) {
      const prevBlock = sortedHistory[i - 1];
      const currentBlock = sortedHistory[i];

      const blockDiff = currentBlock.blockNumber - prevBlock.blockNumber;
      const timeDiff = currentBlock.timestamp - prevBlock.timestamp;

      // Only count consecutive blocks for accuracy
      if (blockDiff === 1 && timeDiff > 0) {
        intervals.push(timeDiff);
      }
    }

    if (intervals.length > 0) {
      // Use 75th percentile for conservative estimation (75% of blocks will be faster)
      const percentile75 = this.calculatePercentile(intervals, 0.75);

      // Add 20% buffer for better UX (under-promise, over-deliver)
      const bufferedTime = percentile75 * 1.2;

      // Only update if the new estimate is reasonable (between 1 second and 8 minutes)
      if (bufferedTime >= 1000 && bufferedTime <= 480000) {
        this.estimatedBlockTime = Math.round(bufferedTime);
      }
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    if (percentile < 0 || percentile > 1) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = percentile * (sorted.length - 1);

    if (Number.isInteger(index)) {
      return sorted[index];
    }

    // Interpolate between two values
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  getEstimatedBlockTime(): number {
    // Always return at least the default if not properly initialized
    return this.estimatedBlockTime || 60000;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  getBlockTimeHistory(): BlockTimeData[] {
    return [...this.blockTimeHistory];
  }

  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.blockTimeHistory = [];
    this.isInitialized = false;
    this.initializationPromise = null;
    this.api = null;
  }
}

export const blockTimeService = BlockTimeService.getInstance();

export const getEstimatedBlockTime = (): number => {
  const blockTime = blockTimeService.getEstimatedBlockTime();
  // Never return 0, always return at least the default 60 seconds
  return blockTime || 60000;
};

export const initializeBlockTimeTracking = async (): Promise<void> => {
  await blockTimeService.initialize();
};
