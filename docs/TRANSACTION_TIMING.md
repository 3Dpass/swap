# Transaction Timing Guide

This guide explains the simplified countdown system for swap transactions.

## How it Works

The application shows a countdown timer for specific stages of swap transactions. The timer displays remaining seconds in brackets after the status text (e.g., "Sending to Network (~60s)", "Waiting for Finalization (~59s)"...). Each stage that requires blockchain processing gets its own countdown that resets when moving to the next stage. This corresponds to the ~60 second block time on The Ledger of Things network.

## Simplified Timing System

The system now uses a simplified approach:

### Configuration
- **Block Time Constant**: `BLOCK_TIME_MS = 60000` (60 seconds)
- **Stage-Based Countdown**: Each blockchain stage shows one block worth of countdown
- **No Accumulation**: Each stage resets the countdown independently

### Stages with Countdown
Only blockchain-dependent stages show countdown:
- **Sending to Network**: ~60s countdown
- **Waiting for Confirmation**: ~60s countdown  
- **Waiting for Finalization**: ~60s countdown

### Stages without Countdown
- **Preparing**: Instant, no countdown needed
- **Signing**: User-dependent, unpredictable timing
- **Finalizing**: Instant, no countdown needed

## Configuration File

The timing is controlled in `src/config/transactionTiming.ts`:

```typescript
export const BLOCK_TIME_MS = 60000; // 60 seconds per block

export const SWAP_STAGE_DURATIONS: Record<TransactionStatus, number> = {
  [TransactionStatus.sendingToNetwork]: BLOCK_TIME_MS, // ~1 block
  [TransactionStatus.waitingForFinalization]: BLOCK_TIME_MS, // ~1 block
  // Other stages set to 0 (no countdown)
};
```

## How Countdown Works

1. When a stage starts, countdown begins at 60 seconds
2. Timer ticks down: "~60s", "~59s", "~58s"...
3. When moving to next stage, countdown resets to 60s
4. Display format: "Status Text (~45s)"

## Important Notes

- **Block Time**: The network generates blocks approximately every minute
- **Simplified Design**: Each blockchain stage = one block countdown (60s)
- **Stage Reset**: Countdown resets when moving between stages
- **User Interface**: Time shown in brackets with tilde symbol (~45s)
- **No User Timing**: Signing stage excluded as it depends on user speed