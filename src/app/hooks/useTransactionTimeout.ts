import { useEffect, useState } from "react";
import { useAppContext } from "../../state";
import { ActionType } from "../types/enum";

interface UseTransactionTimeoutProps {
  loading: boolean;
  timeout?: number;
  actionType:
    | ActionType.SET_SWAP_LOADING
    | ActionType.SET_CREATE_POOL_LOADING
    | ActionType.SET_ADD_LIQUIDITY_LOADING
    | ActionType.SET_WITHDRAW_LIQUIDITY_LOADING;
}

const DEFAULT_TIMEOUT = 180000; // 3 minutes

/**
 * Custom hook to handle transaction timeout logic
 * Sets a timeout when loading starts and clears it when loading stops
 * @param loading - Whether the transaction is currently loading
 * @param timeout - Timeout duration in milliseconds (default: 3 minutes)
 * @param actionType - The action type to dispatch when timeout occurs
 * @returns isTimeout - Whether the transaction has timed out
 */
const useTransactionTimeout = ({
  loading,
  timeout = DEFAULT_TIMEOUT,
  actionType,
}: UseTransactionTimeoutProps): boolean => {
  const { dispatch } = useAppContext();
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  useEffect(() => {
    if (loading) {
      setIsTimeout(false);
      const id = setTimeout(() => {
        if (loading) {
          setIsTimeout(true);
          dispatch({ type: actionType, payload: false });
        }
      }, timeout);
      setTimeoutId(id);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(undefined);
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, timeout, actionType, dispatch]);

  return isTimeout;
};

export default useTransactionTimeout;
