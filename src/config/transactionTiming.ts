import { TransactionStatus } from "../app/types/enum";
import { getEstimatedBlockTime } from "../services/blockTimeService";

// Get current block time dynamically
export const getBlockTimeMs = (): number => {
  return getEstimatedBlockTime();
};

/**
 * Stage durations for countdown display
 * Each stage represents approximately one block time
 * Signing stage excluded as it depends on user interaction
 */
export const getSwapStageDurations = (): Record<TransactionStatus, number> => {
  const blockTime = getBlockTimeMs();

  return {
    [TransactionStatus.idle]: 0,
    [TransactionStatus.preparing]: 0, // No countdown needed
    [TransactionStatus.validatingInputs]: 0,
    [TransactionStatus.checkingBalances]: 0,
    [TransactionStatus.calculatingRoute]: 0,
    [TransactionStatus.signing]: 0, // User interaction - no countdown
    [TransactionStatus.waitingForNewBlock]: blockTime, // ~1 block
    [TransactionStatus.waitingForConfirmation]: blockTime, // ~1 block
    [TransactionStatus.waitingForFinalization]: blockTime * 2, // ~2 blocks
    [TransactionStatus.finalizing]: 0, // No countdown needed
    [TransactionStatus.updatingBalances]: 0,
    [TransactionStatus.success]: 0,
    [TransactionStatus.error]: 0,
  };
};

// Get countdown time for current stage (not cumulative)
export const getCurrentStageTime = (currentStatus: TransactionStatus): number => {
  const stageDurations = getSwapStageDurations();
  return stageDurations[currentStatus] || 0;
};
