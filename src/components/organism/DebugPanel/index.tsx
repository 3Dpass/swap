import { FC, useState, useEffect } from "react";
import { useAppContext } from "../../../state";
import { ActionType, ButtonVariants } from "../../../app/types/enum";
import dotAcpToast from "../../../app/util/toast";
import Button from "../../atom/Button";
import useGetNetwork from "../../../app/hooks/useGetNetwork";

interface SimulationStep {
  name: string;
  status: "pending" | "active" | "completed";
  duration: number;
}

const DebugPanel: FC = () => {
  const { state, dispatch } = useAppContext();
  const { nativeTokenSymbol } = useGetNetwork();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Add keyboard shortcut to toggle debug panel (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const steps: SimulationStep[] = [
    { name: "Initialize Swap", status: "pending", duration: 500 },
    { name: "Validate Inputs", status: "pending", duration: 300 },
    { name: "Check Balances", status: "pending", duration: 400 },
    { name: "Calculate Route", status: "pending", duration: 600 },
    { name: "Sign Transaction", status: "pending", duration: 800 },
    { name: "Submit to Blockchain", status: "pending", duration: 1000 },
    { name: "Wait for Confirmation", status: "pending", duration: 2000 },
    { name: "Transaction in Block", status: "pending", duration: 1500 },
    { name: "Finalize Swap", status: "pending", duration: 500 },
    { name: "Update Balances", status: "pending", duration: 400 },
    { name: "Show Success", status: "pending", duration: 300 },
  ];

  const simulateSwap = async () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationSteps(steps);

    // Start loading
    dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });

    for (let i = 0; i < steps.length; i++) {
      // Update current step to active
      setSimulationSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === i ? "active" : index < i ? "completed" : "pending",
        }))
      );

      // Special actions for certain steps
      if (i === 7) {
        // Transaction in Block
        dotAcpToast.success("Completed at block hash #0x123...abc", {
          style: { maxWidth: "750px" },
        });
      }

      // Wait for the duration
      await new Promise((resolve) => setTimeout(resolve, steps[i].duration));
    }

    // Mark all steps as completed
    setSimulationSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })));

    // Simulate successful swap
    dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });

    // Set token information
    dispatch({
      type: ActionType.SET_SWAP_FROM_TOKEN,
      payload: {
        tokenSymbol: nativeTokenSymbol,
        tokenId: "",
        decimals: "12",
        tokenBalance: "1000",
      },
    });
    dispatch({
      type: ActionType.SET_SWAP_TO_TOKEN,
      payload: {
        tokenSymbol: "TEST",
        tokenId: "1",
        decimals: "10",
        tokenBalance: "5000",
      },
    });

    // Set swap amounts
    dispatch({ type: ActionType.SET_SWAP_EXACT_IN_TOKEN_AMOUNT, payload: "100.5" });
    dispatch({ type: ActionType.SET_SWAP_EXACT_OUT_TOKEN_AMOUNT, payload: "2045.75" });
    dispatch({ type: ActionType.SET_BLOCK_HASH_FINALIZED, payload: "0x123456789abcdef" });
    dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });

    // Show final success toast
    dotAcpToast.success(`Successfully swapped 100.5 ${nativeTokenSymbol} for 2045.75 TEST`, {
      style: { maxWidth: "500px" },
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationSteps([]);
    }, 2000);
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white shadow-2xl transition-all duration-300 ${
        isMinimized ? "w-48" : "w-80"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-700 p-3">
        <h3 className="text-sm font-bold text-white">Debug Panel</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white transition-colors hover:text-gray-300"
        >
          {isMinimized ? "▲" : "▼"}
        </button>
      </div>

      {!isMinimized && (
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Swap Simulation</h4>
            <Button
              variant={ButtonVariants.btnPrimaryPinkSm}
              onClick={simulateSwap}
              disabled={isSimulating || state.swapLoading}
              className="w-full"
            >
              {isSimulating ? "Simulating..." : "Simulate Swap"}
            </Button>
          </div>

          {simulationSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Simulation Steps</h4>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {simulationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`rounded px-2 py-1 text-xs transition-all duration-300 ${
                      step.status === "active"
                        ? "bg-blue-500 text-white"
                        : step.status === "completed"
                          ? "bg-green-500 text-white"
                          : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="inline-block w-4">
                      {step.status === "active" && "▶"}
                      {step.status === "completed" && "✓"}
                      {step.status === "pending" && "○"}
                    </span>
                    {step.name}
                    <span className="float-right text-[10px] text-white/70">{step.duration}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-white">Current State</h4>
            <div className="space-y-2 rounded-lg border border-slate-700 bg-black p-3 font-mono">
              <div className="font-semibold text-emerald-400">Swap States:</div>
              <div className="pl-2 text-white">
                swapLoading:{" "}
                <span className={state.swapLoading ? "text-emerald-400" : "text-slate-500"}>
                  {state.swapLoading ? "✓ true" : "✗ false"}
                </span>
              </div>
              <div className="pl-2 text-white">
                swapFinalized:{" "}
                <span className={state.swapFinalized ? "text-emerald-400" : "text-slate-500"}>
                  {state.swapFinalized ? "✓ true" : "✗ false"}
                </span>
              </div>
              <div className="pl-2 text-white">
                gasFee: <span className="text-amber-400">{state.swapGasFee || "N/A"}</span>
              </div>
              <div className="pl-2 text-white">
                tokenWarning:{" "}
                <span className={state.isTokenCanNotCreateWarningSwap ? "text-amber-400" : "text-slate-500"}>
                  {state.isTokenCanNotCreateWarningSwap ? "✓ true" : "✗ false"}
                </span>
              </div>

              <div className="mt-2 font-semibold text-sky-400">Connection:</div>
              <div className="pl-2 text-white">
                Connected:{" "}
                <span className={state.selectedAccount?.address ? "text-emerald-400" : "text-slate-500"}>
                  {state.selectedAccount?.address ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="pl-2 text-white">
                API Ready:{" "}
                <span className={state.api ? "text-emerald-400" : "text-slate-500"}>
                  {state.api ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="pl-2 text-white">
                Pools: <span className="text-amber-400">{state.pools?.length || 0}</span>
              </div>

              <div className="mt-2 font-semibold text-amber-400">Last Action:</div>
              <div className="pl-2 text-[10px] text-slate-300">
                {state.blockHashFinalized ? `Block: ${state.blockHashFinalized.slice(0, 10)}...` : "None"}
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-400">Press Ctrl/Cmd + D to toggle panel</div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
