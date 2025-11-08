import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { PoolCardProps } from "../../../app/types";
import {
  convertAssetIdToEVMAddress,
  convertAssetIdToLiquidityPoolAddress,
} from "../../../app/util/assetAddressConverter";
import { POOLS_PAGE } from "../../../app/router/routes";
import useClickOutside from "../../../app/hooks/useClickOutside";
import TokenIcon from "../../atom/TokenIcon";

type PoolSearchResult = {
  pool: PoolCardProps;
  matchType: string;
  matchValue: string;
};

type PoolSearchBarProps = {
  pools: PoolCardProps[];
  className?: string;
};

const PoolSearchBar = ({ pools, className = "" }: PoolSearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
  });

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || pools.length === 0) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    const results: PoolSearchResult[] = [];

    pools.forEach((pool) => {
      // Search by Pool Asset ID
      if (pool.lpTokenId && pool.lpTokenId.toLowerCase().includes(query)) {
        results.push({
          pool,
          matchType: "Pool Asset ID",
          matchValue: pool.lpTokenId,
        });
        return;
      }

      // Search by Pool EVM Address
      if (pool.lpTokenId) {
        try {
          const poolEVMAddress = convertAssetIdToLiquidityPoolAddress(pool.lpTokenId);
          if (poolEVMAddress.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              pool,
              matchType: "Pool EVM Address",
              matchValue: poolEVMAddress,
            });
            return;
          }
        } catch (error) {
          // Ignore conversion errors
        }
      }

      // Search by TokenA Asset ID
      if (pool.asset1TokenId && pool.asset1TokenId.toLowerCase().includes(query)) {
        results.push({
          pool,
          matchType: "TokenA Asset ID",
          matchValue: pool.asset1TokenId,
        });
        return;
      }

      // Search by TokenB Asset ID
      if (pool.asset2TokenId && pool.asset2TokenId.toLowerCase().includes(query)) {
        results.push({
          pool,
          matchType: "TokenB Asset ID",
          matchValue: pool.asset2TokenId,
        });
        return;
      }

      // Search by TokenA EVM Address
      if (pool.asset1TokenId) {
        try {
          const tokenAEVMAddress = convertAssetIdToEVMAddress(pool.asset1TokenId);
          if (tokenAEVMAddress.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              pool,
              matchType: "TokenA EVM Address",
              matchValue: tokenAEVMAddress,
            });
            return;
          }
        } catch (error) {
          // Ignore conversion errors
        }
      }

      // Search by TokenB EVM Address
      if (pool.asset2TokenId) {
        try {
          const tokenBEVMAddress = convertAssetIdToEVMAddress(pool.asset2TokenId);
          if (tokenBEVMAddress.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              pool,
              matchType: "TokenB EVM Address",
              matchValue: tokenBEVMAddress,
            });
            return;
          }
        } catch (error) {
          // Ignore conversion errors
        }
      }

      // Search by TokenA Symbol
      if (pool.totalTokensLocked.asset1Token.symbol.toLowerCase().includes(query)) {
        results.push({
          pool,
          matchType: "TokenA Symbol",
          matchValue: pool.totalTokensLocked.asset1Token.symbol,
        });
        return;
      }

      // Search by TokenB Symbol
      if (pool.totalTokensLocked.asset2Token.symbol.toLowerCase().includes(query)) {
        results.push({
          pool,
          matchType: "TokenB Symbol",
          matchValue: pool.totalTokensLocked.asset2Token.symbol,
        });
        return;
      }

      // Search by pool name (token pair)
      if (pool.name.toLowerCase().includes(query)) {
        results.push({
          pool,
          matchType: "Pool Name",
          matchValue: pool.name,
        });
      }
    });

    // Remove duplicates (same pool can match multiple criteria)
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex((r) => r.pool.lpTokenId === result.pool.lpTokenId)
    );

    return uniqueResults;
  }, [searchQuery, pools]);

  useEffect(() => {
    setIsOpen(searchQuery.trim().length > 0 && searchResults.length > 0);
    setSelectedIndex(-1);
  }, [searchQuery, searchResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0 && searchResults.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelectPool = (pool: PoolCardProps) => {
    if (!pool.lpTokenId) return;

    // Navigate to pool detail page using the pool asset ID
    navigate(`${POOLS_PAGE}/${pool.lpTokenId}`);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectPool(searchResults[selectedIndex].pool);
        } else if (searchResults.length === 1) {
          handleSelectPool(searchResults[0].pool);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  return (
    <div ref={dropdownRef} className={classNames("relative w-full max-w-md", className)}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search pools by ID, address, or symbol..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 dark:border-dark-border-primary dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:placeholder:text-dark-text-tertiary dark:focus:border-green-500"
        />
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-border-primary dark:bg-dark-bg-secondary">
          <div className="max-h-96 overflow-y-auto">
            {searchResults.map((result, index) => {
              const pool = result.pool;
              const isSelected = index === selectedIndex;
              const tokenASymbol = pool.totalTokensLocked.asset1Token.symbol;
              const tokenBSymbol = pool.totalTokensLocked.asset2Token.symbol;

              return (
                <button
                  key={`${pool.lpTokenId}-${index}`}
                  type="button"
                  onClick={() => handleSelectPool(pool)}
                  className={classNames("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", {
                    "bg-gray-50 dark:bg-dark-bg-tertiary": isSelected,
                    "hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary": !isSelected,
                  })}
                >
                  <div className="relative flex flex-shrink-0 items-center">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white p-1 dark:bg-dark-bg-tertiary">
                      <TokenIcon tokenSymbol={tokenASymbol} className="h-8 w-8" />
                    </div>
                    <div className="relative z-0 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-white p-1 dark:bg-dark-bg-tertiary">
                      <TokenIcon tokenSymbol={tokenBSymbol} className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-gray-900 dark:text-dark-text-primary">{pool.name}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-dark-text-secondary">{result.matchType}:</span>
                      <span className="truncate font-mono text-xs text-gray-600 dark:text-dark-text-tertiary">
                        {result.matchValue}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg dark:border-dark-border-primary dark:bg-dark-bg-secondary dark:text-dark-text-secondary">
          No pools found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
};

export default PoolSearchBar;
