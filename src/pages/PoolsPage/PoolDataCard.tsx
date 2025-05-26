import Button from "../../components/atom/Button";
import TokenIcon from "../../components/atom/TokenIcon";
import { ButtonVariants, LiquidityPageType } from "../../app/types/enum";
import AddIconPink from "../../assets/img/add-icon-pink.svg?react";
import { LpTokenAsset } from "../../app/types";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { ADD_LIQUIDITY_TO_EXISTING, REMOVE_LIQUIDITY_FROM_EXISTING } from "../../app/router/routes";
import { urlTo, formatCompactNumber } from "../../app/util/helper";
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

  // Reorder tokens so native token (P3D) is always second
  const isAsset1Native = asset1TokenSymbol === "P3D";

  const firstTokenSymbol = isAsset1Native ? asset2TokenSymbol : asset1TokenSymbol;
  const secondTokenSymbol = isAsset1Native ? asset1TokenSymbol : asset2TokenSymbol;
  const firstTokenAmount = isAsset1Native ? asset2Tokens : asset1Tokens;
  const secondTokenAmount = isAsset1Native ? asset1Tokens : asset2Tokens;

  // Reconstruct token pair name with correct order
  const displayTokenPair = `${firstTokenSymbol}-${secondTokenSymbol}`;

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
    <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:z-20 hover:scale-[1.02] hover:shadow-lg">
      {/* Header with token pair */}
      <div className="flex items-center gap-3 rounded-t-2xl p-4 pb-2">
        <div className="relative flex flex-shrink-0 items-center">
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1">
            <TokenIcon tokenSymbol={firstTokenSymbol} className="h-14 w-14" />
          </div>
          <div className="relative z-0 -ml-4 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1">
            <TokenIcon tokenSymbol={secondTokenSymbol} className="h-14 w-14" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-unbounded-variable text-base font-bold text-gray-900">{displayTokenPair}</h3>
          <p className="text-sm text-gray-500">Liquidity Pool</p>
        </div>
      </div>

      {/* Pool statistics */}
      <div className="px-4 pb-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {t("poolDataCard.totalTokensLocked")}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5">
                <TokenIcon tokenSymbol={firstTokenSymbol} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1 overflow-hidden">
                  <p className="truncate font-mono text-sm font-medium text-gray-900">
                    {formatCompactNumber(firstTokenAmount)}
                  </p>
                  <p className="flex-shrink-0 text-xs text-gray-500">{firstTokenSymbol}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5">
                <TokenIcon tokenSymbol={secondTokenSymbol} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1 overflow-hidden">
                  <p className="truncate font-mono text-sm font-medium text-gray-900">
                    {formatCompactNumber(secondTokenAmount)}
                  </p>
                  <p className="flex-shrink-0 text-xs text-gray-500">{secondTokenSymbol}</p>
                </div>
              </div>
            </div>
            {/* LP Tokens row */}
            <div className="mt-2 border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">{t("poolDataCard.lpTokens")}:</p>
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {formatCompactNumber(lpTokenAsset?.balance || "0")}
                </p>
              </div>
            </div>
          </div>
        </div>
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
