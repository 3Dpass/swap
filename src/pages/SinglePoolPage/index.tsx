import { t } from "i18next";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../../state";
import { PoolCardProps } from "../../app/types";
import { LottieLarge } from "../../assets/loader";
import PoolDataCard from "../PoolsPage/PoolDataCard";
import {
  extractAssetIdFromEVMAddress,
  isLiquidityPoolTokenAddress,
  isValidAssetEVMAddress,
} from "../../app/util/assetAddressConverter";
import { POOLS_PAGE } from "../../app/router/routes";

const SinglePoolPage = () => {
  const { state } = useAppContext();
  const { poolsCards } = state;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pool, setPool] = useState<PoolCardProps | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    if (poolsCards.length === 0) {
      setIsLoading(true);
      return;
    }

    // Try to find pool by ID (could be asset ID or EVM address)
    let poolAssetId: string | null = null;

    // Check if it's an EVM address
    if (isValidAssetEVMAddress(id)) {
      try {
        if (isLiquidityPoolTokenAddress(id)) {
          // Extract asset ID from liquidity pool EVM address
          poolAssetId = extractAssetIdFromEVMAddress(id).toString();
        } else {
          // It's an asset address, not a pool address - this won't work for pools
          setNotFound(true);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
    } else {
      // Assume it's a numeric asset ID
      poolAssetId = id;
    }

    // Find the pool by lpTokenId (which is the pool asset ID)
    const foundPool = poolsCards.find((pool: PoolCardProps) => {
      return pool.lpTokenId === poolAssetId;
    });

    if (foundPool) {
      setPool(foundPool);
      setNotFound(false);
    } else {
      setNotFound(true);
    }

    setIsLoading(false);
  }, [id, poolsCards]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LottieLarge />
      </div>
    );
  }

  if (notFound || !pool) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
            {t("poolsPage.poolNotFound", "Pool Not Found")}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-dark-text-secondary">
            {t("poolsPage.poolNotFoundDescription", "The pool you're looking for doesn't exist or has been removed.")}
          </p>
          <button
            onClick={() => navigate(POOLS_PAGE)}
            className="rounded-lg bg-pink-600 px-6 py-3 text-white transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
          >
            {t("button.backToPools", "Back to Pools")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-center px-2 pb-16 sm:px-8 lg:px-28">
        <div className="flex w-full max-w-[1280px] flex-col">
          <div className="flex flex-col items-start justify-between gap-4 px-2 py-6 sm:flex-row sm:items-center sm:px-6 sm:py-8 lg:px-10">
            <div className="flex flex-col gap-[4px] leading-[120%]">
              <div className="font-unbounded-variable text-heading-4 font-[700] tracking-[.046px] text-gray-400 dark:text-dark-text-primary sm:text-heading-5">
                {t("poolsPage.poolDetails", "Pool")}
              </div>
              <div className="text-sm tracking-[.2px] text-gray-300 dark:text-dark-text-secondary sm:text-base">
                {pool.name}
              </div>
            </div>
            <button
              onClick={() => navigate(POOLS_PAGE)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-dark-border-primary dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary"
            >
              {t("button.backToPools", "Back to Pools")}
            </button>
          </div>
          <div className="flex justify-center px-2 sm:px-6 lg:px-10">
            <div className="w-full max-w-md">
              <PoolDataCard
                tokenPair={pool.name}
                asset1Tokens={pool.totalTokensLocked.asset1Token.formattedValue}
                asset1TokenSymbol={pool.totalTokensLocked.asset1Token.symbol}
                asset2Tokens={pool.totalTokensLocked.asset2Token.formattedValue}
                asset2TokenSymbol={pool.totalTokensLocked.asset2Token.symbol}
                lpTokenAsset={pool.lpTokenAsset}
                assetTokenId={pool.assetTokenId}
                asset1TokenId={pool.asset1TokenId}
                asset2TokenId={pool.asset2TokenId}
                lpTokenId={pool.lpTokenId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePoolPage;
