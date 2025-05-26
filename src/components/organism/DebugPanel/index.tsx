import { FC, useState, useEffect } from "react";
import { useAppContext } from "../../../state";
import { ActionType, ButtonVariants, TransactionTypes, TransactionStatus } from "../../../app/types/enum";
import dotAcpToast from "../../../app/util/toast";
import Button from "../../atom/Button";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import { useTransactionStatus, getStatusFromSimulationStep } from "../../../app/hooks/useTransactionStatus";
import { blockTimeService } from "../../../services/blockTimeService";

interface SimulationStep {
  name: string;
  status: "pending" | "active" | "completed";
  duration: number;
}

const DebugPanel: FC = () => {
  const { state, dispatch } = useAppContext();
  const { nativeTokenSymbol } = useGetNetwork();
  const swapStatus = useTransactionStatus(TransactionTypes.swap);
  const addStatus = useTransactionStatus(TransactionTypes.add);
  const withdrawStatus = useTransactionStatus(TransactionTypes.withdraw);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [blockTimeMs, setBlockTimeMs] = useState(60000);
  const [blockHistory, setBlockHistory] = useState<Array<{ blockNumber: number; timestamp: number }>>([]);

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

  // Update block time and history every second
  useEffect(() => {
    const updateBlockTime = () => {
      const newBlockTime = blockTimeService.getEstimatedBlockTime();
      const newHistory = blockTimeService.getBlockTimeHistory();

      // Only update if we have a valid block time (never set to 0)
      if (newBlockTime > 0) {
        setBlockTimeMs(newBlockTime);
      }
      setBlockHistory(newHistory);
    };

    updateBlockTime(); // Initial update
    const interval = setInterval(updateBlockTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const swapSteps: SimulationStep[] = [
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

  const addLiquiditySteps: SimulationStep[] = [
    { name: "Initialize Add Liquidity", status: "pending", duration: 500 },
    { name: "Validate Inputs", status: "pending", duration: 300 },
    { name: "Check Balances", status: "pending", duration: 400 },
    { name: "Calculate Pool Ratios", status: "pending", duration: 600 },
    { name: "Sign Transaction", status: "pending", duration: 800 },
    { name: "Submit to Blockchain", status: "pending", duration: 1000 },
    { name: "Wait for Confirmation", status: "pending", duration: 2000 },
    { name: "Transaction in Block", status: "pending", duration: 1500 },
    { name: "Mint LP Tokens", status: "pending", duration: 700 },
    { name: "Update Balances", status: "pending", duration: 400 },
    { name: "Show Success", status: "pending", duration: 300 },
  ];

  const removeLiquiditySteps: SimulationStep[] = [
    { name: "Initialize Remove Liquidity", status: "pending", duration: 500 },
    { name: "Validate LP Token Amount", status: "pending", duration: 300 },
    { name: "Check LP Token Balance", status: "pending", duration: 400 },
    { name: "Calculate Token Returns", status: "pending", duration: 600 },
    { name: "Sign Transaction", status: "pending", duration: 800 },
    { name: "Submit to Blockchain", status: "pending", duration: 1000 },
    { name: "Wait for Confirmation", status: "pending", duration: 2000 },
    { name: "Transaction in Block", status: "pending", duration: 1500 },
    { name: "Burn LP Tokens", status: "pending", duration: 700 },
    { name: "Update Balances", status: "pending", duration: 400 },
    { name: "Show Success", status: "pending", duration: 300 },
  ];

  const simulateSwap = async () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationSteps(swapSteps);

    // Start loading
    swapStatus.setStatus(TransactionStatus.preparing);

    for (let i = 0; i < swapSteps.length; i++) {
      // Update current step to active
      setSimulationSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === i ? "active" : index < i ? "completed" : "pending",
        }))
      );

      // Update transaction status based on current step
      const currentTransactionStatus = getStatusFromSimulationStep(swapSteps[i].name);
      swapStatus.setStatus(currentTransactionStatus);

      // Special actions for certain steps
      if (i === 7) {
        // Transaction in Block
        dotAcpToast.success("Completed at block hash #0x123...abc", {
          style: { maxWidth: "750px" },
        });
      }

      // Wait for the duration
      await new Promise((resolve) => setTimeout(resolve, swapSteps[i].duration));
    }

    // Mark all steps as completed
    setSimulationSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })));

    // Final success status
    swapStatus.setStatus(TransactionStatus.success);

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
      swapStatus.resetStatus();
    }, 2000);
  };

  const simulateAddLiquidity = async () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationSteps(addLiquiditySteps);

    // Start loading
    addStatus.setStatus(TransactionStatus.preparing);

    for (let i = 0; i < addLiquiditySteps.length; i++) {
      // Update current step to active
      setSimulationSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === i ? "active" : index < i ? "completed" : "pending",
        }))
      );

      // Map step names to transaction statuses
      let currentTransactionStatus = TransactionStatus.preparing;
      switch (addLiquiditySteps[i].name) {
        case "Initialize Add Liquidity":
          currentTransactionStatus = TransactionStatus.preparing;
          break;
        case "Validate Inputs":
          currentTransactionStatus = TransactionStatus.validatingInputs;
          break;
        case "Check Balances":
          currentTransactionStatus = TransactionStatus.checkingBalances;
          break;
        case "Calculate Pool Ratios":
          currentTransactionStatus = TransactionStatus.calculatingRoute;
          break;
        case "Sign Transaction":
          currentTransactionStatus = TransactionStatus.signing;
          break;
        case "Submit to Blockchain":
          currentTransactionStatus = TransactionStatus.sendingToNetwork;
          break;
        case "Wait for Confirmation":
          currentTransactionStatus = TransactionStatus.waitingForConfirmation;
          break;
        case "Transaction in Block":
          currentTransactionStatus = TransactionStatus.waitingForFinalization;
          break;
        case "Mint LP Tokens":
          currentTransactionStatus = TransactionStatus.finalizing;
          break;
        case "Update Balances":
          currentTransactionStatus = TransactionStatus.updatingBalances;
          break;
        case "Show Success":
          currentTransactionStatus = TransactionStatus.success;
          break;
      }

      addStatus.setStatus(currentTransactionStatus);

      // Special actions for certain steps
      if (i === 7) {
        // Transaction in Block
        dotAcpToast.success("Liquidity added at block hash #0x456...def", {
          style: { maxWidth: "750px" },
        });
      }

      // Wait for the duration
      await new Promise((resolve) => setTimeout(resolve, addLiquiditySteps[i].duration));
    }

    // Mark all steps as completed
    setSimulationSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })));

    // Final success status
    addStatus.setStatus(TransactionStatus.success);

    // Show final success toast
    dotAcpToast.success(`Successfully added liquidity: 50 ${nativeTokenSymbol} + 1000 TEST`, {
      style: { maxWidth: "500px" },
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationSteps([]);
      addStatus.resetStatus();
    }, 2000);
  };

  const simulateRemoveLiquidity = async () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationSteps(removeLiquiditySteps);

    // Start loading
    withdrawStatus.setStatus(TransactionStatus.preparing);

    for (let i = 0; i < removeLiquiditySteps.length; i++) {
      // Update current step to active
      setSimulationSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === i ? "active" : index < i ? "completed" : "pending",
        }))
      );

      // Map step names to transaction statuses
      let currentTransactionStatus = TransactionStatus.preparing;
      switch (removeLiquiditySteps[i].name) {
        case "Initialize Remove Liquidity":
          currentTransactionStatus = TransactionStatus.preparing;
          break;
        case "Validate LP Token Amount":
          currentTransactionStatus = TransactionStatus.validatingInputs;
          break;
        case "Check LP Token Balance":
          currentTransactionStatus = TransactionStatus.checkingBalances;
          break;
        case "Calculate Token Returns":
          currentTransactionStatus = TransactionStatus.calculatingRoute;
          break;
        case "Sign Transaction":
          currentTransactionStatus = TransactionStatus.signing;
          break;
        case "Submit to Blockchain":
          currentTransactionStatus = TransactionStatus.sendingToNetwork;
          break;
        case "Wait for Confirmation":
          currentTransactionStatus = TransactionStatus.waitingForConfirmation;
          break;
        case "Transaction in Block":
          currentTransactionStatus = TransactionStatus.waitingForFinalization;
          break;
        case "Burn LP Tokens":
          currentTransactionStatus = TransactionStatus.finalizing;
          break;
        case "Update Balances":
          currentTransactionStatus = TransactionStatus.updatingBalances;
          break;
        case "Show Success":
          currentTransactionStatus = TransactionStatus.success;
          break;
      }

      withdrawStatus.setStatus(currentTransactionStatus);

      // Special actions for certain steps
      if (i === 7) {
        // Transaction in Block
        dotAcpToast.success("Liquidity removed at block hash #0x789...ghi", {
          style: { maxWidth: "750px" },
        });
      }

      // Wait for the duration
      await new Promise((resolve) => setTimeout(resolve, removeLiquiditySteps[i].duration));
    }

    // Mark all steps as completed
    setSimulationSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })));

    // Final success status
    withdrawStatus.setStatus(TransactionStatus.success);

    // Show final success toast
    dotAcpToast.success(`Successfully removed liquidity: received 25 ${nativeTokenSymbol} + 500 TEST`, {
      style: { maxWidth: "500px" },
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationSteps([]);
      withdrawStatus.resetStatus();
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Transaction Simulations</h4>
            <div className="space-y-2">
              <Button
                variant={ButtonVariants.btnPrimaryPinkSm}
                onClick={simulateSwap}
                disabled={isSimulating || state.swapLoading}
                className="w-full"
              >
                {isSimulating && swapStatus.isLoading ? "Simulating..." : "Simulate Swap"}
              </Button>
              <Button
                variant={ButtonVariants.btnPrimaryPinkSm}
                onClick={simulateAddLiquidity}
                disabled={isSimulating || state.addLiquidityLoading}
                className="w-full"
              >
                {isSimulating && addStatus.isLoading ? "Simulating..." : "Simulate Add Liquidity"}
              </Button>
              <Button
                variant={ButtonVariants.btnPrimaryPinkSm}
                onClick={simulateRemoveLiquidity}
                disabled={isSimulating || state.withdrawLiquidityLoading}
                className="w-full"
              >
                {isSimulating && withdrawStatus.isLoading ? "Simulating..." : "Simulate Remove Liquidity"}
              </Button>
            </div>
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
              <div className="font-semibold text-emerald-400">Swap:</div>
              <div className="pl-2 text-white">
                loading:{" "}
                <span className={state.swapLoading ? "text-emerald-400" : "text-slate-500"}>
                  {state.swapLoading ? "✓" : "✗"}
                </span>
                {" | status: "}
                <span className="text-cyan-400">{swapStatus.currentStatus}</span>
              </div>
              <div className="pl-2 text-white">
                finalized:{" "}
                <span className={state.swapFinalized ? "text-emerald-400" : "text-slate-500"}>
                  {state.swapFinalized ? "✓" : "✗"}
                </span>
                {" | gasFee: "}
                <span className="text-amber-400">{state.swapGasFee || "N/A"}</span>
              </div>

              <div className="mt-2 font-semibold text-emerald-400">Add Liquidity:</div>
              <div className="pl-2 text-white">
                loading:{" "}
                <span className={state.addLiquidityLoading ? "text-emerald-400" : "text-slate-500"}>
                  {state.addLiquidityLoading ? "✓" : "✗"}
                </span>
                {" | status: "}
                <span className="text-cyan-400">{addStatus.currentStatus}</span>
              </div>
              <div className="pl-2 text-white">
                gasFee: <span className="text-amber-400">{state.poolGasFee || "N/A"}</span>
              </div>

              <div className="mt-2 font-semibold text-emerald-400">Remove Liquidity:</div>
              <div className="pl-2 text-white">
                loading:{" "}
                <span className={state.withdrawLiquidityLoading ? "text-emerald-400" : "text-slate-500"}>
                  {state.withdrawLiquidityLoading ? "✓" : "✗"}
                </span>
                {" | status: "}
                <span className="text-cyan-400">{withdrawStatus.currentStatus}</span>
              </div>

              <div className="mt-2 font-semibold text-sky-400">Connection:</div>
              <div className="pl-2 text-white">
                wallet:{" "}
                <span className={state.selectedAccount?.address ? "text-emerald-400" : "text-slate-500"}>
                  {state.selectedAccount?.address ? "✓" : "✗"}
                </span>
                {" | api: "}
                <span className={state.api ? "text-emerald-400" : "text-slate-500"}>{state.api ? "✓" : "✗"}</span>
                {" | pools: "}
                <span className="text-amber-400">{state.pools?.length || 0}</span>
              </div>

              <div className="mt-2 font-semibold text-purple-400">Block Time:</div>
              <div className="pl-2 text-white">
                current: <span className="text-amber-400">{(blockTimeMs / 1000).toFixed(1)}s</span>
                {" | blocks: "}
                <span className="text-emerald-400">
                  {
                    blockHistory.filter(
                      (block, index, array) => array.findIndex((b) => b.blockNumber === block.blockNumber) === index
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>

          {blockHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Block Time History</h4>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {(() => {
                  // Remove duplicates and sort by block number, then take last 5
                  const uniqueBlocks = blockHistory.filter(
                    (block, index, array) => array.findIndex((b) => b.blockNumber === block.blockNumber) === index
                  );
                  const sortedBlocks = uniqueBlocks.sort((a, b) => a.blockNumber - b.blockNumber);
                  const lastFiveBlocks = sortedBlocks.slice(-5).reverse();

                  return lastFiveBlocks.map((block) => {
                    // Find the previous block in the sorted array for time diff calculation
                    const blockIndex = sortedBlocks.findIndex((b) => b.blockNumber === block.blockNumber);
                    const prevBlock = blockIndex > 0 ? sortedBlocks[blockIndex - 1] : null;
                    let timeDiff = "";
                    if (prevBlock && block.blockNumber === prevBlock.blockNumber + 1) {
                      const diff = ((block.timestamp - prevBlock.timestamp) / 1000).toFixed(1);
                      timeDiff = ` (${diff}s)`;
                    }

                    return (
                      <div
                        key={`${block.blockNumber}-${block.timestamp}`}
                        className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300"
                      >
                        <span className="text-cyan-400">#{block.blockNumber}</span>
                        <span className="ml-2 text-amber-400">{new Date(block.timestamp).toLocaleTimeString()}</span>
                        {timeDiff && <span className="float-right text-emerald-400">{timeDiff}</span>}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          <div className="mt-2 text-center text-[10px] text-slate-400">Press Ctrl/Cmd + D to toggle panel</div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
