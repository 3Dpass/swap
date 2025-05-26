import { useEffect, useState, useRef } from "react";

interface UseCountdownProps {
  initialTimeMs: number;
  isActive: boolean;
  stageKey?: string; // Add stage identifier to force reset
}

/**
 * Hook for countdown timer that ticks every second
 * Resets countdown when stage changes
 * @param initialTimeMs - Initial time in milliseconds
 * @param isActive - Whether the countdown should be active
 * @param stageKey - Unique identifier for current stage to trigger reset
 * @returns remaining seconds (0 when finished)
 */
export const useCountdown = ({ initialTimeMs, isActive, stageKey }: UseCountdownProps): number => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastStageKeyRef = useRef<string>("");

  useEffect(() => {
    // Clear existing interval when stage changes
    const stageChanged = lastStageKeyRef.current !== stageKey;
    if (stageChanged) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastStageKeyRef.current = stageKey || "";
    }

    if (isActive && initialTimeMs > 0) {
      // Set initial countdown value
      const initialSeconds = Math.ceil(initialTimeMs / 1000);
      setRemainingSeconds(initialSeconds);
      startTimeRef.current = Date.now();

      // Start countdown interval
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, Math.ceil((initialTimeMs - elapsed) / 1000));

          setRemainingSeconds(remaining);

          // Stop when reaching zero
          if (remaining <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }, 1000);
    } else {
      // Reset when not active or no time
      setRemainingSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialTimeMs, isActive, stageKey]);

  return remainingSeconds;
};
