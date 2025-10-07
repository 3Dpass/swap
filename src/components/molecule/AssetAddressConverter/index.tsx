import React, { useState, useCallback } from "react";
import {
  convertAssetIdToEVMAddress,
  convertAssetIdToLiquidityPoolAddress,
  extractAssetIdFromEVMAddress,
  getEVMAddressType,
  isValidAssetEVMAddress,
} from "../../../app/util/assetAddressConverter";
import Button from "../../atom/Button";

interface AssetAddressConverterProps {
  className?: string;
}

interface ConversionResult {
  assetId: string;
  assetAddress: string;
  liquidityPoolAddress: string;
  type: "asset" | "liquidity-pool" | "unknown";
}

const AssetAddressConverter: React.FC<AssetAddressConverterProps> = ({ className = "" }) => {
  const [assetId, setAssetId] = useState<string>("");
  const [evmAddress, setEvmAddress] = useState<string>("");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  /**
   * Converts asset ID to EVM addresses
   */
  const handleConvertAssetId = useCallback(async () => {
    if (!assetId.trim()) {
      setError("Please enter an asset ID");
      return;
    }

    setIsConverting(true);
    setError("");

    try {
      const numericAssetId = parseInt(assetId.trim(), 10);

      if (isNaN(numericAssetId) || numericAssetId < 0) {
        throw new Error("Asset ID must be a positive number");
      }

      const assetAddress = convertAssetIdToEVMAddress(numericAssetId);
      const liquidityPoolAddress = convertAssetIdToLiquidityPoolAddress(numericAssetId);

      setConversionResult({
        assetId: assetId.trim(),
        assetAddress,
        liquidityPoolAddress,
        type: "asset",
      });
    } catch (err: any) {
      setError(err.message || "Failed to convert asset ID");
    } finally {
      setIsConverting(false);
    }
  }, [assetId]);

  /**
   * Extracts asset ID from EVM address
   */
  const handleExtractAssetId = useCallback(async () => {
    if (!evmAddress.trim()) {
      setError("Please enter an EVM address");
      return;
    }

    setIsConverting(true);
    setError("");

    try {
      if (!isValidAssetEVMAddress(evmAddress.trim())) {
        throw new Error("Invalid EVM asset address format");
      }

      const extractedAssetId = extractAssetIdFromEVMAddress(evmAddress.trim());
      const addressType = getEVMAddressType(evmAddress.trim());

      setConversionResult({
        assetId: extractedAssetId.toString(),
        assetAddress: evmAddress.trim(),
        liquidityPoolAddress: convertAssetIdToLiquidityPoolAddress(extractedAssetId),
        type: addressType,
      });
    } catch (err: any) {
      setError(err.message || "Failed to extract asset ID");
    } finally {
      setIsConverting(false);
    }
  }, [evmAddress]);

  /**
   * Clears all inputs and results
   */
  const handleClear = useCallback(() => {
    setAssetId("");
    setEvmAddress("");
    setConversionResult(null);
    setError("");
  }, []);

  /**
   * Copies text to clipboard
   */
  const handleCopyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);

  return (
    <div className={`rounded-lg bg-gray-800 p-6 ${className}`}>
      <h2 className="mb-4 text-xl font-semibold text-white">Asset Address Converter</h2>

      {/* Asset ID to EVM Address Conversion */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium text-gray-300">Asset ID → EVM Address</h3>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Enter asset ID (e.g., 222)"
            className="flex-1 rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <Button
            onClick={handleConvertAssetId}
            disabled={isConverting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isConverting ? "Converting..." : "Convert"}
          </Button>
        </div>
      </div>

      {/* EVM Address to Asset ID Extraction */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium text-gray-300">EVM Address → Asset ID</h3>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={evmAddress}
            onChange={(e) => setEvmAddress(e.target.value)}
            placeholder="Enter EVM address (e.g., 0xFBFBFBFA000000000000000000000000000000DE)"
            className="flex-1 rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <Button
            onClick={handleExtractAssetId}
            disabled={isConverting}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isConverting ? "Extracting..." : "Extract"}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="mb-4 rounded border border-red-700 bg-red-900 p-3 text-red-200">{error}</div>}

      {/* Conversion Results */}
      {conversionResult && (
        <div className="rounded-lg bg-gray-700 p-4">
          <h3 className="mb-3 text-lg font-medium text-white">Conversion Results</h3>

          <div className="space-y-3">
            <div>
              <label htmlFor="asset-id-result" className="mb-1 block text-sm font-medium text-gray-300">
                Asset ID:
              </label>
              <div className="flex items-center gap-2">
                <code id="asset-id-result" className="flex-1 rounded bg-gray-800 px-3 py-2 font-mono text-green-400">
                  {conversionResult.assetId}
                </code>
                <Button
                  onClick={() => handleCopyToClipboard(conversionResult.assetId)}
                  className="rounded bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-500"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="asset-address-result" className="mb-1 block text-sm font-medium text-gray-300">
                Asset Contract Address:
              </label>
              <div className="flex items-center gap-2">
                <code
                  id="asset-address-result"
                  className="flex-1 break-all rounded bg-gray-800 px-3 py-2 font-mono text-sm text-blue-400"
                >
                  {conversionResult.assetAddress}
                </code>
                <Button
                  onClick={() => handleCopyToClipboard(conversionResult.assetAddress)}
                  className="rounded bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-500"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="liquidity-pool-result" className="mb-1 block text-sm font-medium text-gray-300">
                Liquidity Pool Token Address:
              </label>
              <div className="flex items-center gap-2">
                <code
                  id="liquidity-pool-result"
                  className="flex-1 break-all rounded bg-gray-800 px-3 py-2 font-mono text-sm text-purple-400"
                >
                  {conversionResult.liquidityPoolAddress}
                </code>
                <Button
                  onClick={() => handleCopyToClipboard(conversionResult.liquidityPoolAddress)}
                  className="rounded bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-500"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="address-type-result" className="mb-1 block text-sm font-medium text-gray-300">
                Address Type:
              </label>
              <span
                id="address-type-result"
                className={`rounded px-2 py-1 text-sm font-medium ${
                  conversionResult.type === "asset"
                    ? "bg-blue-900 text-blue-200"
                    : conversionResult.type === "liquidity-pool"
                      ? "bg-purple-900 text-purple-200"
                      : "bg-gray-900 text-gray-200"
                }`}
              >
                {conversionResult.type}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Clear Button */}
      <div className="mt-4 flex justify-end">
        <Button onClick={handleClear} className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-500">
          Clear All
        </Button>
      </div>

      {/* Example */}
      <div className="mt-6 rounded-lg bg-gray-700 p-4">
        <h4 className="mb-2 text-sm font-medium text-gray-300">Example:</h4>
        <div className="space-y-1 text-sm text-gray-400">
          <div>
            Asset ID: <span className="text-green-400">222</span>
          </div>
          <div>
            Hex: <span className="text-yellow-400">DE</span>
          </div>
          <div>
            Asset Address: <span className="text-blue-400">0xFBFBFBFA000000000000000000000000000000DE</span>
          </div>
          <div>
            Pool Address: <span className="text-purple-400">0xFBFBFBFB000000000000000000000000000000DE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAddressConverter;
