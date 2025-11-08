import Button from "../../components/atom/Button";
import TokenIcon from "../../components/atom/TokenIcon";
import { ButtonVariants, LiquidityPageType } from "../../app/types/enum";
import AddIconPink from "../../assets/img/add-icon-pink.svg?react";
import { LpTokenAsset } from "../../app/types";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { ADD_LIQUIDITY_TO_EXISTING, REMOVE_LIQUIDITY_FROM_EXISTING, POOLS_PAGE } from "../../app/router/routes";
import { urlTo, formatCompactNumber } from "../../app/util/helper";
import { useAppContext } from "../../state";
import { useState } from "react";
import { convertAssetIdToEVMAddress, convertAssetIdToLiquidityPoolAddress } from "../../app/util/assetAddressConverter";
import useGetNetwork from "../../app/hooks/useGetNetwork";

type PoolDataCardProps = {
  tokenPair: string;
  asset1Tokens: string;
  asset1TokenSymbol: string;
  asset2Tokens: string;
  asset2TokenSymbol: string;
  lpTokenAsset: LpTokenAsset | null;
  assetTokenId: string;
  asset1TokenId: string | null;
  asset2TokenId: string | null;
  lpTokenId: string | null;
};

const PoolDataCard = ({
  asset1Tokens,
  asset1TokenSymbol,
  asset2Tokens,
  asset2TokenSymbol,
  lpTokenAsset,
  assetTokenId,
  asset1TokenId,
  asset2TokenId,
  lpTokenId,
}: PoolDataCardProps) => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { tokenBalances, selectedAccount } = state;
  const [showDetails, setShowDetails] = useState(false);
  const { assethubSubscanUrl } = useGetNetwork();

  // Reorder tokens so native token (P3D) is always second
  const isAsset1Native = asset1TokenSymbol === "P3D";
  const isAsset2Native = asset2TokenSymbol === "P3D";

  const firstTokenSymbol = isAsset1Native ? asset2TokenSymbol : asset1TokenSymbol;
  const secondTokenSymbol = isAsset1Native ? asset1TokenSymbol : asset2TokenSymbol;
  const firstTokenAmount = isAsset1Native ? asset2Tokens : asset1Tokens;
  const secondTokenAmount = isAsset1Native ? asset1Tokens : asset2Tokens;

  // Reconstruct token pair name with correct order
  const displayTokenPair = `${firstTokenSymbol}-${secondTokenSymbol}`;

  // Determine TokenA and TokenB asset IDs
  // TokenA = asset1, TokenB = asset2
  const tokenAAssetId = isAsset1Native ? "0" : asset1TokenId;
  const tokenBAssetId = isAsset2Native ? "0" : asset2TokenId;

  // Convert asset IDs to EVM addresses
  const lpTokenEVMAddress = lpTokenId ? convertAssetIdToLiquidityPoolAddress(lpTokenId) : null;
  const tokenAEVMAddress = tokenAAssetId ? convertAssetIdToEVMAddress(tokenAAssetId) : null;
  const tokenBEVMAddress = tokenBAssetId ? convertAssetIdToEVMAddress(tokenBAssetId) : null;

  const onDepositClick = () => {
    navigate(`${POOLS_PAGE}/${urlTo(ADD_LIQUIDITY_TO_EXISTING, { id: assetTokenId })}`, {
      state: { pageType: LiquidityPageType.addLiquidity },
    });
  };

  const onWithdrawClick = () => {
    navigate(`${POOLS_PAGE}/${urlTo(REMOVE_LIQUIDITY_FROM_EXISTING, { id: assetTokenId })}`, {
      state: { pageType: LiquidityPageType.removeLiquidity, lpTokenId: lpTokenId },
    });
  };

  const checkIfDepositDisabled = () => {
    return !tokenBalances?.assets?.find((token: any) => token.tokenId === assetTokenId);
  };

  const checkIfWithdrawDisabled = () => {
    if (lpTokenAsset) {
      if (parseInt(lpTokenAsset?.balance) > 0 && tokenBalances?.balance) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:z-20 hover:scale-[1.02] hover:shadow-lg dark:border-dark-border-primary dark:bg-dark-bg-secondary dark:bg-dark-bg-tertiary">
      {/* Header with token pair */}
      <div className="flex items-center gap-3 rounded-t-2xl p-4 pb-2">
        <div className="relative flex flex-shrink-0 items-center">
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 dark:bg-dark-bg-tertiary dark:bg-dark-bg-tertiary">
            <TokenIcon tokenSymbol={firstTokenSymbol} className="h-14 w-14" />
          </div>
          <div className="relative z-0 -ml-4 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 dark:bg-dark-bg-tertiary dark:bg-dark-bg-tertiary">
            <TokenIcon tokenSymbol={secondTokenSymbol} className="h-14 w-14" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-unbounded-variable text-base font-bold text-gray-900 dark:text-dark-text-primary dark:text-dark-text-primary">
            {displayTokenPair}
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary dark:text-dark-text-secondary">
            Liquidity Pool
          </p>
        </div>
      </div>

      {/* Pool statistics */}
      <div className="px-4 pb-3">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-bg-card">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-text-secondary">
            {t("poolDataCard.totalTokensLocked")}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 dark:bg-dark-bg-tertiary">
                <TokenIcon tokenSymbol={firstTokenSymbol} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1 overflow-hidden">
                  <p className="truncate font-mono text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                    {formatCompactNumber(firstTokenAmount)}
                  </p>
                  <p className="flex-shrink-0 text-xs text-gray-500 dark:text-dark-text-secondary">
                    {firstTokenSymbol}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 dark:bg-dark-bg-tertiary">
                <TokenIcon tokenSymbol={secondTokenSymbol} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1 overflow-hidden">
                  <p className="truncate font-mono text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                    {formatCompactNumber(secondTokenAmount)}
                  </p>
                  <p className="flex-shrink-0 text-xs text-gray-500 dark:text-dark-text-secondary">
                    {secondTokenSymbol}
                  </p>
                </div>
              </div>
            </div>
            {/* LP Tokens row */}
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-dark-border-primary">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary">
                  {t("poolDataCard.lpTokens")}:
                </p>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                  {formatCompactNumber(lpTokenAsset?.balance || "0")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details section with Hide/Show control */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-dark-bg-card dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary"
        >
          <span>Details</span>
          <span className="text-xs">{showDetails ? "Hide" : "Show"}</span>
        </button>
        {showDetails && (
          <div className="mt-2 rounded-lg bg-gray-50 p-3 dark:bg-dark-bg-card">
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-medium text-gray-700 dark:text-dark-text-primary">Pair:</p>
                <p className="mt-1 font-mono text-gray-600 dark:text-dark-text-secondary">
                  {lpTokenId ? (
                    <>
                      Pool AssetId # {lpTokenId}, EVM: {lpTokenEVMAddress}
                    </>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-dark-text-primary">TokenA:</p>
                <p className="mt-1 font-mono text-gray-600 dark:text-dark-text-secondary">
                  {isAsset1Native ? (
                    <>Native, EVM: {tokenAEVMAddress}</>
                  ) : tokenAAssetId ? (
                    <>
                      AssetId #{" "}
                      {assethubSubscanUrl ? (
                        <a
                          href={`${assethubSubscanUrl}/#/assets/${tokenAAssetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on explorer"
                          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {tokenAAssetId}
                        </a>
                      ) : (
                        tokenAAssetId
                      )}
                      , EVM: {tokenAEVMAddress}
                    </>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-dark-text-primary">TokenB:</p>
                <p className="mt-1 font-mono text-gray-600 dark:text-dark-text-secondary">
                  {isAsset2Native ? (
                    <>Native, EVM: {tokenBEVMAddress}</>
                  ) : tokenBAssetId ? (
                    <>
                      AssetId #{" "}
                      {assethubSubscanUrl ? (
                        <a
                          href={`${assethubSubscanUrl}/#/assets/${tokenBAssetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on explorer"
                          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {tokenBAssetId}
                        </a>
                      ) : (
                        tokenBAssetId
                      )}
                      , EVM: {tokenBEVMAddress}
                    </>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 rounded-b-2xl px-4 pb-4">
        <Button
          onClick={() => onDepositClick()}
          variant={ButtonVariants.btnPrimaryGhostSm}
          icon={<AddIconPink width={14} height={14} />}
          disabled={checkIfDepositDisabled()}
          className="group/btn relative z-10 flex-1"
        >
          {t("button.deposit")}
          {checkIfDepositDisabled() && (
            <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 transition-all group-hover/btn:visible group-hover/btn:opacity-100">
              {tokenBalances?.balance && selectedAccount.address
                ? t("poolsPage.doNotHaveLiquidityPair")
                : !tokenBalances?.balance && selectedAccount.address
                  ? t("poolsPage.assetsWait")
                  : t("poolsPage.connectWallet")}
              <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </Button>
        <Button
          onClick={() => onWithdrawClick()}
          variant={ButtonVariants.btnSecondaryGray}
          disabled={checkIfWithdrawDisabled()}
          className="group/btn relative z-10 flex-1"
        >
          {t("button.withdraw")}
          {checkIfWithdrawDisabled() && (
            <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 transition-all group-hover/btn:visible group-hover/btn:opacity-100">
              {tokenBalances?.balance && selectedAccount.address
                ? t("poolsPage.doNotHaveLiquidityPair")
                : !tokenBalances?.balance && selectedAccount.address
                  ? t("poolsPage.assetsWait")
                  : t("poolsPage.connectWallet")}
              <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PoolDataCard;
