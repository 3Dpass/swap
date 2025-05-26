import { useCallback, useEffect, useRef } from "react";
import { t } from "i18next";
import { useAppContext } from "../../state";
import { ActionType, TransactionTypes, TransactionStatus } from "../types/enum";

interface UseTransactionStatusReturn {
  currentStatus: TransactionStatus;
  statusText: string;
  isLoading: boolean;
  setStatus: (status: TransactionStatus, transactionType?: TransactionTypes) => void;
  setStatusWithDelay: (status: TransactionStatus, delay: number, transactionType?: TransactionTypes) => Promise<void>;
  resetStatus: (transactionType?: TransactionTypes) => void;
  simulateStatusSequence: (
    statuses: TransactionStatus[],
    delays: number[],
    transactionType?: TransactionTypes
  ) => Promise<void>;
}

// Map simulation steps to transaction statuses
const SIMULATION_STEP_MAPPING: Record<string, TransactionStatus> = {
  "Initialize Swap": TransactionStatus.preparing,
  "Validate Inputs": TransactionStatus.validatingInputs,
  "Check Balances": TransactionStatus.checkingBalances,
  "Calculate Route": TransactionStatus.calculatingRoute,
  "Sign Transaction": TransactionStatus.signing,
  "Submit to Blockchain": TransactionStatus.sendingToNetwork,
  "Wait for Confirmation": TransactionStatus.waitingForConfirmation,
  "Transaction in Block": TransactionStatus.waitingForFinalization,
  "Finalize Swap": TransactionStatus.finalizing,
  "Update Balances": TransactionStatus.updatingBalances,
  "Show Success": TransactionStatus.success,
};

export const getStatusFromSimulationStep = (stepName: string): TransactionStatus => {
  return SIMULATION_STEP_MAPPING[stepName] || TransactionStatus.idle;
};

export const useTransactionStatus = (
  defaultType: TransactionTypes = TransactionTypes.swap
): UseTransactionStatusReturn => {
  const { state, dispatch } = useAppContext();
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Track if component is mounted to prevent dispatch during initial render
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Get current status based on transaction type
  const getCurrentStatus = useCallback(
    (transactionType: TransactionTypes): TransactionStatus => {
      switch (transactionType) {
        case TransactionTypes.swap:
          if (state.swapLoadingStatus) {
            return state.swapLoadingStatus;
          }
          return state.swapLoading ? TransactionStatus.preparing : TransactionStatus.idle;
        case TransactionTypes.add:
          if (state.addLiquidityLoadingStatus) {
            return state.addLiquidityLoadingStatus;
          }
          return state.addLiquidityLoading ? TransactionStatus.preparing : TransactionStatus.idle;
        case TransactionTypes.withdraw:
          if (state.withdrawLiquidityLoadingStatus) {
            return state.withdrawLiquidityLoadingStatus;
          }
          return state.withdrawLiquidityLoading ? TransactionStatus.preparing : TransactionStatus.idle;
        case TransactionTypes.createPool:
          return state.createPoolLoading ? TransactionStatus.preparing : TransactionStatus.idle;
        default:
          return TransactionStatus.idle;
      }
    },
    [state]
  );

  // Get loading state based on transaction type
  const getIsLoading = useCallback(
    (transactionType: TransactionTypes): boolean => {
      switch (transactionType) {
        case TransactionTypes.swap:
          return state.swapLoading;
        case TransactionTypes.add:
          return state.addLiquidityLoading;
        case TransactionTypes.withdraw:
          return state.withdrawLiquidityLoading;
        case TransactionTypes.createPool:
          return state.createPoolLoading;
        default:
          return false;
      }
    },
    [state]
  );

  const currentStatus = getCurrentStatus(defaultType);
  const isLoading = getIsLoading(defaultType);
  const statusText = t(`transactionStatus.${currentStatus}`);

  // Set status for specific transaction type
  const setStatus = useCallback(
    (status: TransactionStatus, transactionType: TransactionTypes = defaultType) => {
      const operationId =
        status !== TransactionStatus.idle
          ? `${transactionType}-${Date.now()}-${Math.random().toString(36).substring(7)}`
          : null;

      switch (transactionType) {
        case TransactionTypes.swap:
          if (status === TransactionStatus.idle) {
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: null });
            dispatch({ type: ActionType.SET_SWAP_OPERATION_ID, payload: null });
          } else {
            // For new operations, set the operation ID
            if (status === TransactionStatus.preparing && !state.swapOperationId) {
              dispatch({ type: ActionType.SET_SWAP_OPERATION_ID, payload: operationId });
            }
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: status });
          }
          break;
        case TransactionTypes.add:
          if (status === TransactionStatus.idle) {
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: null });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_OPERATION_ID, payload: null });
          } else {
            // For new operations, set the operation ID
            if (status === TransactionStatus.preparing && !state.addLiquidityOperationId) {
              dispatch({ type: ActionType.SET_ADD_LIQUIDITY_OPERATION_ID, payload: operationId });
            }
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: true });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: status });
          }
          break;
        case TransactionTypes.withdraw:
          if (status === TransactionStatus.idle) {
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: null });
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_OPERATION_ID, payload: null });
          } else {
            // For new operations, set the operation ID
            if (status === TransactionStatus.preparing && !state.withdrawLiquidityOperationId) {
              dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_OPERATION_ID, payload: operationId });
            }
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: true });
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: status });
          }
          break;
        case TransactionTypes.createPool:
          dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: status !== TransactionStatus.idle });
          break;
      }
    },
    [dispatch, defaultType, state]
  );

  // Set status with delay
  const setStatusWithDelay = useCallback(
    async (
      status: TransactionStatus,
      delay: number,
      transactionType: TransactionTypes = defaultType
    ): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setStatus(status, transactionType);
          resolve();
        }, delay);
      });
    },
    [setStatus, defaultType]
  );

  // Reset status
  const resetStatus = useCallback(
    (transactionType: TransactionTypes = defaultType) => {
      setStatus(TransactionStatus.idle, transactionType);
    },
    [setStatus, defaultType]
  );

  // Auto-clear error and success status after 5 seconds
  useEffect(() => {
    // Use a small delay to avoid any potential render phase issues
    const timeoutId = setTimeout(() => {
      if (currentStatus === TransactionStatus.error || currentStatus === TransactionStatus.success) {
        // Clear any existing timeout
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }

        // Set new timeout to clear status
        errorTimeoutRef.current = setTimeout(() => {
          // Directly call setStatus instead of resetStatus to avoid circular dependency
          setStatus(TransactionStatus.idle, defaultType);
        }, 5000);
      }
    }, 0);

    // Cleanup on unmount or when status changes
    return () => {
      clearTimeout(timeoutId);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [currentStatus, defaultType, setStatus]);

  // Simulate status sequence (for testing/simulation)
  const simulateStatusSequence = useCallback(
    async (
      statuses: TransactionStatus[],
      delays: number[],
      transactionType: TransactionTypes = defaultType
    ): Promise<void> => {
      for (let i = 0; i < statuses.length; i++) {
        await setStatusWithDelay(statuses[i], delays[i] || 1000, transactionType);
      }
    },
    [setStatusWithDelay, defaultType]
  );

  return {
    currentStatus,
    statusText,
    isLoading,
    setStatus,
    setStatusWithDelay,
    resetStatus,
    simulateStatusSequence,
  };
};
