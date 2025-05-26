import { t } from "i18next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { POOLS_ADD_LIQUIDITY } from "../../app/router/routes";
import { PoolCardProps } from "../../app/types";
import { ButtonVariants } from "../../app/types/enum";
import TokenIcon from "../../assets/img/token-icon.svg?react";
import { LottieLarge } from "../../assets/loader";
import Button from "../../components/atom/Button";
import { useAppContext } from "../../state";
import PoolDataCard from "./PoolDataCard";

const PoolsPage = () => {
  const { state } = useAppContext();
  const { selectedAccount, pools, poolsCards, tokenBalances } = state;

  const [isPoolsLoading, setPoolsIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (pools.length > 0 && poolsCards.length > 0) {
      setPoolsIsLoading(false);
    }
  }, [pools, poolsCards]);

  const navigateToAddLiquidity = () => {
    navigate(POOLS_ADD_LIQUIDITY);
  };

  return (
    <div className="flex flex-1 flex-col">
      {isPoolsLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <LottieLarge />
        </div>
      ) : (
        <div className="flex items-center justify-center px-2 pb-16 sm:px-8 lg:px-28">
          <div className="flex w-full max-w-[1280px] flex-col">
            <div className="flex flex-col items-start justify-between gap-4 px-2 py-6 sm:flex-row sm:items-center sm:px-6 sm:py-8 lg:px-10">
              <div className="flex flex-col gap-[4px] leading-[120%]">
                <div className="font-unbounded-variable text-heading-4 font-[700] tracking-[.046px] text-gray-400 sm:text-heading-5">
                  {t("poolsPage.pools")}
                </div>
                <div className="text-sm tracking-[.2px] text-gray-300 sm:text-base">
                  {t("poolsPage.earnFeesByProvidingLiquidity")}
                </div>
              </div>
              <div>
                {selectedAccount && Object.keys(selectedAccount).length > 0 ? (
                  <Button
                    onClick={navigateToAddLiquidity}
                    variant={ButtonVariants.btnPrimaryPinkSm}
                    disabled={!(selectedAccount && tokenBalances)}
                  >
                    {t("button.newPosition")}
                  </Button>
                ) : null}
              </div>
            </div>
            {pools.length > 0 && poolsCards.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 px-2 sm:px-6 md:grid-cols-2 lg:px-10 xl:grid-cols-3">
                {poolsCards.map((item: PoolCardProps, index: number) => {
                  return (
                    <PoolDataCard
                      key={`${item.assetTokenId}-${item.lpTokenId}-${index}`}
                      tokenPair={item.name}
                      asset1Tokens={item.totalTokensLocked.asset1Token.formattedValue}
                      asset1TokenSymbol={item.totalTokensLocked.asset1Token.symbol}
                      asset2Tokens={item.totalTokensLocked.asset2Token.formattedValue}
                      asset2TokenSymbol={item.totalTokensLocked.asset2Token.symbol}
                      lpTokenAsset={item.lpTokenAsset}
                      assetTokenId={item.assetTokenId}
                      lpTokenId={item.lpTokenId}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="mx-2 flex h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-12 sm:mx-6 lg:mx-10">
                <div className="rounded-full bg-white p-6 shadow-lg">
                  <TokenIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {selectedAccount ? t("poolsPage.noActiveLiquidityPositions") : "Connect Your Wallet"}
                  </h3>
                  <p className="max-w-md text-gray-500">
                    {selectedAccount
                      ? "Start providing liquidity to earn fees from trades"
                      : t("poolsPage.connectWalletToView")}
                  </p>
                </div>
                {selectedAccount && (
                  <Button onClick={navigateToAddLiquidity} variant={ButtonVariants.btnPrimaryPinkSm} className="mt-4">
                    {t("button.newPosition")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default PoolsPage;
