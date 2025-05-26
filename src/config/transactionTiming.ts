import { TransactionStatus } from "../app/types/enum";

// Network constants
export const BLOCK_TIME_MS = 60000; // 60 seconds per block

/**
 * Stage durations for countdown display
 * Each stage represents approximately one block time
 * Signing stage excluded as it depends on user interaction
 */
export const SWAP_STAGE_DURATIONS: Record<TransactionStatus, number> = {
  [TransactionStatus.idle]: 0,
  [TransactionStatus.preparing]: 0, // No countdown needed
  [TransactionStatus.validatingInputs]: 0,
  [TransactionStatus.checkingBalances]: 0,
  [TransactionStatus.calculatingRoute]: 0,
  [TransactionStatus.signing]: 0, // User interaction - no countdown
  [TransactionStatus.sendingToNetwork]: BLOCK_TIME_MS, // ~1 block
  [TransactionStatus.waitingForConfirmation]: BLOCK_TIME_MS, // ~1 block
  [TransactionStatus.waitingForFinalization]: BLOCK_TIME_MS, // ~1 block
  [TransactionStatus.finalizing]: 0, // No countdown needed
  [TransactionStatus.updatingBalances]: 0,
  [TransactionStatus.success]: 0,
  [TransactionStatus.error]: 0,
};

// Get countdown time for current stage (not cumulative)
export const getCurrentStageTime = (currentStatus: TransactionStatus): number => {
  return SWAP_STAGE_DURATIONS[currentStatus] || 0;
};
