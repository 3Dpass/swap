import React, { useState } from "react";
import { useEVMSwap } from "../../../app/hooks/useEVMSwap";
import Button from "../../atom/Button";
import AssetAddressConverter from "../AssetAddressConverter";

const SwapTransactionDebugger: React.FC = () => {
  const { executeSwap, estimateGas, createTransactionWithGasEstimation, isLoading, error } = useEVMSwap();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testSwapParams = {
    assetIn: "0", // Native token
    assetOut: "222", // Asset ID 222
    amount: "1000000000000000000", // 1 token in wei
    minReceive: "980000000000000000", // 0.98 tokens (2% slippage)
    recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const handleTestGasEstimation = async () => {
    try {
      const gasEstimate = await estimateGas(testSwapParams);
      setDebugInfo({ type: "gasEstimate", data: gasEstimate });
    } catch (error: any) {
      setDebugInfo({ type: "gasEstimate", error: error.message });
    }
  };

  const handleTestTransactionCreation = async () => {
    try {
      const transaction = await createTransactionWithGasEstimation(testSwapParams);
      setDebugInfo({ type: "transaction", data: transaction });
    } catch (error: any) {
      setDebugInfo({ type: "transaction", error: error.message });
    }
  };

  const handleTestSwap = async () => {
    try {
      const result = await executeSwap(testSwapParams);
      setDebugInfo({ type: "swap", data: { success: result } });
    } catch (error: any) {
      setDebugInfo({ type: "swap", error: error.message });
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === "string" && value.startsWith("0x")) {
      return `${value} (${parseInt(value, 16).toLocaleString()})`;
    }
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="rounded-lg bg-gray-800 p-4 text-white">
      <h3 className="mb-4 text-lg font-bold">Swap Transaction Debugger</h3>

      <div className="mb-4 rounded bg-gray-700 p-3">
        <h4 className="mb-2 font-semibold">Test Parameters:</h4>
        <pre className="text-xs">{JSON.stringify(testSwapParams, null, 2)}</pre>
      </div>

      <div className="mb-4 space-y-2">
        <Button onClick={handleTestGasEstimation} disabled={isLoading} className="btn-primary mr-2">
          Test Gas Estimation
        </Button>

        <Button onClick={handleTestTransactionCreation} disabled={isLoading} className="btn-secondary mr-2">
          Test Transaction Creation
        </Button>

        <Button onClick={handleTestSwap} disabled={isLoading} className="btn-accent">
          Test Full Swap
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900 p-3 text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugInfo && (
        <div className="rounded bg-gray-700 p-4">
          <h4 className="mb-2 font-semibold">Debug Info - {debugInfo.type}:</h4>

          {debugInfo.error ? (
            <div className="text-red-400">
              <strong>Error:</strong> {debugInfo.error}
            </div>
          ) : (
            <div>
              {debugInfo.type === "gasEstimate" && (
                <div className="space-y-2">
                  <div>
                    <strong>Gas Limit:</strong> {formatValue(debugInfo.data?.gasLimit)}
                  </div>
                  <div>
                    <strong>Gas Price:</strong> {formatValue(debugInfo.data?.gasPrice)}
                  </div>
                  <div>
                    <strong>Max Fee Per Gas:</strong> {formatValue(debugInfo.data?.maxFeePerGas)}
                  </div>
                  <div>
                    <strong>Max Priority Fee:</strong> {formatValue(debugInfo.data?.maxPriorityFeePerGas)}
                  </div>
                </div>
              )}

              {debugInfo.type === "transaction" && (
                <div>
                  <h5 className="mb-2 font-medium">Transaction Object:</h5>
                  <pre className="overflow-auto rounded bg-gray-800 p-2 text-xs">
                    {JSON.stringify(debugInfo.data, null, 2)}
                  </pre>
                </div>
              )}

              {debugInfo.type === "swap" && (
                <div className="text-green-400">
                  <strong>Result:</strong> {debugInfo.data?.success ? "Success" : "Failed"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Make sure MetaMask is connected and unlocked</li>
          <li>Ensure you&apos;re on the correct network (3Dpass)</li>
          <li>Test gas estimation first</li>
          <li>Test transaction creation</li>
          <li>Finally test the full swap</li>
        </ol>
      </div>

      {/* Asset Address Converter */}
      <div className="mt-6">
        <AssetAddressConverter />
      </div>
    </div>
  );
};

export default SwapTransactionDebugger;
