import Button from "../../components/atom/Button";
import TokenIcon from "../../components/atom/TokenIcon";
import { ButtonVariants, LiquidityPageType } from "../../app/types/enum";
import AddIconPink from "../../assets/img/add-icon-pink.svg?react";
import { LpTokenAsset } from "../../app/types";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { ADD_LIQUIDITY_TO_EXISTING, REMOVE_LIQUIDITY_FROM_EXISTING } from "../../app/router/routes";
import { urlTo } from "../../app/util/helper";
import { useAppContext } from "../../state";

type PoolDataCardProps = {
  tokenPair: string;
  asset1Tokens: string;
  asset1TokenSymbol: string;
  asset2Tokens: string;
  asset2TokenSymbol: string;
  lpTokenAsset: LpTokenAsset | null;
  assetTokenId: string;
  lpTokenId: string | null;
};

const PoolDataCard = ({
  tokenPair,
  asset1Tokens,
  asset1TokenSymbol,
  asset2Tokens,
  asset2TokenSymbol,
  lpTokenAsset,
  assetTokenId,
  lpTokenId,
}: PoolDataCardProps) => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { tokenBalances, selectedAccount } = state;

  const formatCompactNumber = (value: string | number): string => {
    const num = typeof value === "string" ? parseFloat(value.replace(/[, ]/g, "")) : value;

    if (isNaN(num) || num === 0) return "0";

    const absNum = Math.abs(num);

    if (absNum >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    } else if (absNum >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (absNum >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    } else if (absNum >= 1) {
      return num.toFixed(2).replace(/\.?0+$/, "");
    } else {
      return num.toFixed(4).replace(/\.?0+$/, "");
    }
  };

  const onDepositClick = () => {
    navigate(urlTo(ADD_LIQUIDITY_TO_EXISTING, { id: assetTokenId }), {
      state: { pageType: LiquidityPageType.addLiquidity },
    });
  };

  const onWithdrawClick = () => {
    navigate(urlTo(REMOVE_LIQUIDITY_FROM_EXISTING, { id: assetTokenId }), {
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
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      {/* Header with token pair */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative flex flex-shrink-0 items-center">
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow-md">
              <TokenIcon tokenSymbol={asset1TokenSymbol} className="h-10 w-10" />
            </div>
            <div className="relative z-0 -ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow-md">
              <TokenIcon tokenSymbol={asset2TokenSymbol} className="h-10 w-10" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-unbounded-variable text-base font-bold text-gray-900">{tokenPair}</h3>
            <p className="text-sm text-gray-500">Liquidity Pool</p>
          </div>
        </div>

        {/* LP Balance Badge */}
        <div className="ml-2 flex flex-shrink-0 flex-col items-end">
          <div className="rounded-full bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1">
            <span className="whitespace-nowrap text-sm font-semibold text-gray-800">
              {formatCompactNumber(lpTokenAsset?.balance || "0")}
            </span>
          </div>
          <p className="mt-1 whitespace-nowrap text-xs uppercase tracking-wide text-gray-400">
            {t("poolDataCard.lpTokens")}
          </p>
        </div>
      </div>

      {/* Pool statistics */}
      <div className="px-5 pb-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t("poolDataCard.totalTokensLocked")}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm">
                <TokenIcon tokenSymbol={asset1TokenSymbol} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1 overflow-hidden">
                  <p className="truncate font-mono text-sm font-medium text-gray-900">
                    {formatCompactNumber(asset1Tokens)}
                  </p>
                  <p className="flex-shrink-0 text-xs text-gray-500">{asset1TokenSymbol}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm">
                <TokenIcon tokenSymbol={asset2TokenSymbol} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1 overflow-hidden">
                  <p className="truncate font-mono text-sm font-medium text-gray-900">
                    {formatCompactNumber(asset2Tokens)}
                  </p>
                  <p className="flex-shrink-0 text-xs text-gray-500">{asset2TokenSymbol}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 p-5 pt-0">
        <Button
          onClick={() => onDepositClick()}
          variant={ButtonVariants.btnPrimaryGhostSm}
          icon={<AddIconPink width={14} height={14} />}
          disabled={checkIfDepositDisabled()}
          className="group/btn relative flex-1"
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
          className="group/btn relative flex-1"
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
