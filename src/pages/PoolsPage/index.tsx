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
    <div className="flex-1 flex flex-col">
      {isPoolsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LottieLarge />
        </div>
      ) : (
        <div className="flex items-center justify-center px-4 sm:px-8 lg:px-28 pb-16">
          <div className="flex w-full max-w-[1280px] flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-6 sm:py-8">
              <div className="flex flex-col gap-[4px] leading-[120%]">
                <div className="font-unbounded-variable text-heading-4 sm:text-heading-5 font-[700] tracking-[.046px] text-gray-400">
                  {t("poolsPage.pools")}
                </div>
                <div className="text-sm sm:text-base tracking-[.2px] text-gray-300">{t("poolsPage.earnFeesByProvidingLiquidity")}</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {poolsCards.map((item: PoolCardProps, index: number) => {
                  return (
                    <div key={index}>
                      <PoolDataCard
                        tokenPair={item.name}
                        asset1Tokens={item.totalTokensLocked.asset1Token.formattedValue}
                        asset1TokenSymbol={item.totalTokensLocked.asset1Token.symbol}
                        asset2Tokens={item.totalTokensLocked.asset2Token.formattedValue}
                        asset2TokenSymbol={item.totalTokensLocked.asset2Token.symbol}
                        lpTokenAsset={item.lpTokenAsset}
                        assetTokenId={item.assetTokenId}
                        lpTokenId={item.lpTokenId}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[664px] flex-col items-center justify-center gap-4 rounded-2xl bg-white p-6">
                <TokenIcon />
                <div className="text-center text-gray-300">
                  {selectedAccount ? t("poolsPage.noActiveLiquidityPositions") : t("poolsPage.connectWalletToView")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default PoolsPage;
