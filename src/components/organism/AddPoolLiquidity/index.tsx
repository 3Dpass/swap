import Decimal from "decimal.js";
import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import useTransactionTimeout from "../../../app/hooks/useTransactionTimeout";
import { useEVMLiquidity } from "../../../app/hooks/useEVMLiquidity";
import { isMetamaskAccount } from "../../../services/metamaskServices";
import { POOLS_PAGE } from "../../../app/router/routes";
import { InputEditedProps, TokenDecimalsErrorProps } from "../../../app/types";
import { ActionType, InputEditedType, TransactionTypes } from "../../../app/types/enum";
import {
  calculateSlippageReduce,
  checkIfPoolAlreadyExists,
  convertToBaseUnit,
  formatDecimalsFromToken,
  formatInputTokenValue,
} from "../../../app/util/helper";
import { formatBalanceForMaxClick, safeTokenBalanceClean } from "../../../app/util/tokenBalance";
import dotAcpToast from "../../../app/util/toast";
import BackArrow from "../../../assets/img/back-arrow.svg?react";
import { setTokenBalanceUpdate } from "../../../services/polkadotWalletServices";
import { addLiquidity, checkAddPoolLiquidityGasFee, getPoolReserves } from "../../../services/poolServices";
import { getAssetTokenFromNativeToken, getNativeTokenFromAssetToken } from "../../../services/tokenServices";
import { useAppContext } from "../../../state";
import TokenIcon from "../../atom/TokenIcon";
import WarningMessage from "../../atom/WarningMessage";
import TokenAmountInput from "../../molecule/TokenAmountInput";
import TransactionButton from "../../molecule/TransactionButton";
import SlippageTolerance from "../../molecule/SlippageTolerance";
import CreatePool from "../CreatePool";
import TokenSelectModal from "../TokenSelectModal";
import SwapAndPoolSuccessModal from "../SwapAndPoolSuccessModal";
import ReviewTransactionModal from "../ReviewTransactionModal";

type AssetTokenProps = {
  tokenSymbol: string;
  assetTokenId: string;
  decimals: string;
  assetTokenBalance: string;
};
type NativeTokenProps = {
  nativeTokenSymbol: string;
  nativeTokenDecimals: string;
  tokenId: string;
  tokenBalance: string;
};
type TokenValueProps = {
  tokenValue: string;
};

type AddPoolLiquidityProps = {
  tokenBId?: { id: string };
};

const AddPoolLiquidity = ({ tokenBId }: AddPoolLiquidityProps) => {
  const { state, dispatch } = useAppContext();
  const { assethubSubscanUrl } = useGetNetwork();
  const { executeAddLiquidity } = useEVMLiquidity();

  const navigate = useNavigate();
  const params = tokenBId ? tokenBId : useParams();

  const {
    tokenBalances,
    api,
    selectedAccount,
    pools,
    transferGasFeesMessage,
    poolGasFee,
    successModalOpen,
    addLiquidityLoading,
    assetLoading,
    isTokenCanNotCreateWarningPools,
  } = state;

  const [selectedTokenA, setSelectedTokenA] = useState<NativeTokenProps>({
    nativeTokenSymbol: "",
    nativeTokenDecimals: "",
    tokenId: "",
    tokenBalance: "",
  });
  const [selectedTokenB, setSelectedTokenB] = useState<AssetTokenProps>({
    tokenSymbol: "",
    assetTokenId: "",
    decimals: "",
    assetTokenBalance: "",
  });
  const [selectedTokenNativeValue, setSelectedTokenNativeValue] = useState<TokenValueProps>();
  const [selectedTokenAssetValue, setSelectedTokenAssetValue] = useState<TokenValueProps>();
  const [nativeTokenWithSlippage, setNativeTokenWithSlippage] = useState<TokenValueProps>({ tokenValue: "" });
  const [assetTokenWithSlippage, setAssetTokenWithSlippage] = useState<TokenValueProps>({ tokenValue: "" });
  const [slippageAuto, setSlippageAuto] = useState<boolean>(true);
  const [slippageValue, setSlippageValue] = useState<number | undefined>(15);
  const [inputEdited, setInputEdited] = useState<InputEditedProps>({ inputType: InputEditedType.exactIn });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [poolExists, setPoolExists] = useState<boolean>(false);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [tooManyDecimalsError, setTooManyDecimalsError] = useState<TokenDecimalsErrorProps>({
    tokenSymbol: "",
    isError: false,
    decimalsAllowed: 0,
  });

  const isTransactionTimeout = useTransactionTimeout({
    loading: addLiquidityLoading,
    actionType: ActionType.SET_ADD_LIQUIDITY_LOADING,
  });
  const [assetBPriceOfOneAssetA, setAssetBPriceOfOneAssetA] = useState<string>("");
  const [priceImpact, setPriceImpact] = useState<string>("");

  const selectedNativeTokenNumber = new Decimal(selectedTokenNativeValue?.tokenValue || 0);
  const selectedAssetTokenNumber = new Decimal(selectedTokenAssetValue?.tokenValue || 0);

  const navigateToPools = () => {
    navigate(POOLS_PAGE);
  };

  const populateAssetToken = () => {
    pools?.forEach((pool: any) => {
      if (pool?.[0]?.[1]?.Asset) {
        if (pool?.[0]?.[1]?.Asset.replace(/[, ]/g, "").toString() === params?.id) {
          if (params?.id) {
            const tokenAlreadySelected = tokenBalances?.assets?.find((token: any) => {
              if (params?.id) {
                return token.tokenId === params?.id.toString();
              }
            });
            if (tokenAlreadySelected) {
              setSelectedTokenB({
                tokenSymbol: tokenAlreadySelected?.assetTokenMetadata?.symbol,
                assetTokenId: params?.id,
                decimals: tokenAlreadySelected?.assetTokenMetadata?.decimals,
                assetTokenBalance: tokenAlreadySelected?.tokenAsset?.balance,
              });
            }
          }
        }
      }
    });
  };

  const handlePool = async () => {
    setReviewModalOpen(false);
    if (api && selectedTokenNativeValue && selectedTokenAssetValue) {
      const nativeTokenValue = formatInputTokenValue(selectedNativeTokenNumber, selectedTokenA?.nativeTokenDecimals)
        .toLocaleString()
        ?.replace(/[, ]/g, "");

      const assetTokenValue = formatInputTokenValue(selectedAssetTokenNumber, selectedTokenB.decimals)
        .toLocaleString()
        ?.replace(/[, ]/g, "");

      try {
        // Check if MetaMask is connected and use EVM liquidity services
        if (isMetamaskAccount(selectedAccount)) {
          console.log("Using EVM liquidity services for MetaMask account");

          // Convert amounts to minimum units for EVM
          // formatInputTokenValue already converts to minimum units, so we just need to use the values directly
          const amount1Desired = nativeTokenValue;
          const amount2Desired = assetTokenValue;
          const amount1Min = nativeTokenWithSlippage.tokenValue.toString();
          const amount2Min = assetTokenWithSlippage.tokenValue.toString();

          const evmParams = {
            asset1: "0", // Native token (P3D)
            asset2: selectedTokenB.assetTokenId,
            amount1Desired: amount1Desired.toString(),
            amount2Desired: amount2Desired.toString(),
            amount1Min: amount1Min.toString(),
            amount2Min: amount2Min.toString(),
            mintTo: selectedAccount.evmAddress,
          };

          await executeAddLiquidity(evmParams);
        } else {
          // Use Substrate liquidity services for Polkadot accounts
          console.log("Using Substrate liquidity services for Polkadot account");
          await addLiquidity(
            api,
            selectedTokenB.assetTokenId,
            selectedAccount,
            nativeTokenValue,
            assetTokenValue,
            nativeTokenWithSlippage.tokenValue.toString(),
            assetTokenWithSlippage.tokenValue.toString(),
            selectedTokenA.nativeTokenDecimals,
            selectedTokenB.decimals,
            dispatch
          );
        }
      } catch (error) {
        dotAcpToast.error(`Error: ${error}`);
      }
    }
  };

  const handleAddPoolLiquidityGasFee = async () => {
    if (api && selectedTokenNativeValue && selectedTokenAssetValue) {
      const nativeTokenValue = formatInputTokenValue(selectedNativeTokenNumber, selectedTokenA?.nativeTokenDecimals);

      const assetTokenValue = formatInputTokenValue(selectedAssetTokenNumber, selectedTokenB.decimals);

      await checkAddPoolLiquidityGasFee(
        api,
        selectedTokenB.assetTokenId,
        selectedAccount,
        nativeTokenValue,
        assetTokenValue,
        nativeTokenWithSlippage.tokenValue.toString(),
        assetTokenWithSlippage.tokenValue.toString(),
        dispatch
      );
    }
  };

  const closeSuccessModal = async () => {
    dispatch({ type: ActionType.SET_SUCCESS_MODAL_OPEN, payload: false });
    navigateToPools();
    if (api) {
      const walletAssets: any = await setTokenBalanceUpdate(
        api,
        selectedAccount.address,
        selectedTokenB.assetTokenId,
        tokenBalances
      );
      dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: walletAssets });
    }
  };

  const getPriceOfAssetTokenFromNativeToken = async (value: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(value, selectedTokenA?.nativeTokenDecimals);

      const assetTokenPrice = await getAssetTokenFromNativeToken(api, selectedTokenB?.assetTokenId, valueWithDecimals);

      if (assetTokenPrice && slippageValue) {
        const assetTokenNoSemicolons = assetTokenPrice.toString()?.replace(/[, ]/g, "");

        const assetTokenNoDecimals = formatDecimalsFromToken(assetTokenNoSemicolons, selectedTokenB?.decimals);

        const tokenWithSlippage = calculateSlippageReduce(assetTokenNoDecimals, slippageValue);
        const tokenWithSlippageFormatted = formatInputTokenValue(tokenWithSlippage, selectedTokenB?.decimals);

        setSelectedTokenAssetValue({ tokenValue: assetTokenNoDecimals });
        setAssetTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      }
    }
  };

  const getPriceOfNativeTokenFromAssetToken = async (value: string) => {
    if (api) {
      const valueWithDecimals = formatInputTokenValue(value, selectedTokenB?.decimals);

      const nativeTokenPrice = await getNativeTokenFromAssetToken(api, selectedTokenB?.assetTokenId, valueWithDecimals);

      if (nativeTokenPrice && slippageValue) {
        const nativeTokenNoSemicolons = nativeTokenPrice.toString()?.replace(/[, ]/g, "");

        const nativeTokenNoDecimals = formatDecimalsFromToken(
          nativeTokenNoSemicolons,
          selectedTokenA?.nativeTokenDecimals
        );

        const tokenWithSlippage = calculateSlippageReduce(nativeTokenNoDecimals, slippageValue);
        const tokenWithSlippageFormatted = formatInputTokenValue(
          tokenWithSlippage,
          selectedTokenA?.nativeTokenDecimals
        );

        setSelectedTokenNativeValue({ tokenValue: nativeTokenNoDecimals.toString() });
        setNativeTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      }
    }
  };

  const setSelectedTokenAValue = (value: string) => {
    setInputEdited({ inputType: InputEditedType.exactIn });
    if (slippageValue && value !== "") {
      value = new Decimal(value).toFixed();
      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedTokenA.nativeTokenDecimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedTokenA.nativeTokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedTokenA.nativeTokenDecimals),
          });
          return;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      const nativeTokenSlippageValue = calculateSlippageReduce(value, slippageValue);
      const tokenWithSlippageFormatted = formatInputTokenValue(
        nativeTokenSlippageValue,
        selectedTokenA?.nativeTokenDecimals
      );
      setSelectedTokenNativeValue({ tokenValue: value });
      setNativeTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      getPriceOfAssetTokenFromNativeToken(value);
    } else {
      setSelectedTokenAssetValue({ tokenValue: "" });
    }
  };

  const setSelectedTokenBValue = (value: string) => {
    setInputEdited({ inputType: InputEditedType.exactOut });
    if (slippageValue && value !== "") {
      value = new Decimal(value).toFixed();
      if (value.includes(".")) {
        if (value.split(".")[1].length > parseInt(selectedTokenB.decimals)) {
          setTooManyDecimalsError({
            tokenSymbol: selectedTokenB.tokenSymbol,
            isError: true,
            decimalsAllowed: parseInt(selectedTokenB.decimals),
          });
          return;
        }
      }

      setTooManyDecimalsError({
        tokenSymbol: "",
        isError: false,
        decimalsAllowed: 0,
      });

      const assetTokenSlippageValue = calculateSlippageReduce(value, slippageValue);
      const tokenWithSlippageFormatted = formatInputTokenValue(assetTokenSlippageValue, selectedTokenB?.decimals);
      setSelectedTokenAssetValue({ tokenValue: value });
      setAssetTokenWithSlippage({ tokenValue: tokenWithSlippageFormatted });
      getPriceOfNativeTokenFromAssetToken(value);
    } else {
      setSelectedTokenNativeValue({ tokenValue: "" });
    }
  };

  const getButtonProperties = useMemo(() => {
    if (tokenBalances?.assets) {
      if (selectedTokenA.nativeTokenSymbol === "" || selectedTokenB.assetTokenId === "") {
        return { label: t("button.selectToken"), disabled: true };
      }

      if (
        selectedNativeTokenNumber.lte(0) ||
        selectedAssetTokenNumber.lte(0) ||
        selectedTokenNativeValue?.tokenValue === "" ||
        selectedTokenAssetValue?.tokenValue === ""
      ) {
        return { label: t("button.enterAmount"), disabled: true };
      }

      if (selectedNativeTokenNumber.gt(tokenBalances.balance)) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedTokenA.nativeTokenSymbol }),
          disabled: true,
        };
      }

      const fee = convertToBaseUnit(poolGasFee);
      if (selectedNativeTokenNumber.plus(fee).gt(tokenBalances.balance)) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedTokenA.nativeTokenSymbol }),
          disabled: true,
        };
      }

      const assetTokenBalance = new Decimal(safeTokenBalanceClean(selectedTokenB.assetTokenBalance));
      const assetTokenBalnceFormatted = formatDecimalsFromToken(assetTokenBalance, selectedTokenB.decimals);
      if (selectedAssetTokenNumber.gt(assetTokenBalnceFormatted)) {
        return {
          label: t("button.insufficientTokenAmount", { token: selectedTokenB.tokenSymbol }),
          disabled: true,
        };
      }

      if (selectedNativeTokenNumber.gt(0) && selectedAssetTokenNumber.gt(0) && !tooManyDecimalsError.isError) {
        return { label: t("button.deposit"), disabled: false };
      }

      if (selectedNativeTokenNumber.gt(0) && selectedAssetTokenNumber.gt(0) && tooManyDecimalsError.isError) {
        return { label: t("button.deposit"), disabled: true };
      }
    } else {
      return { label: t("button.connectWallet"), disabled: true };
    }

    return { label: t("button.enterAmount"), disabled: true };
  }, [
    selectedTokenA.nativeTokenDecimals,
    selectedTokenB.assetTokenBalance,
    selectedTokenA.nativeTokenSymbol,
    selectedTokenB.tokenSymbol,
    selectedTokenB.decimals,
    selectedTokenNativeValue?.tokenValue,
    selectedTokenAssetValue?.tokenValue,
    tooManyDecimalsError.isError,
    tokenBalances,
  ]);

  const calculatePriceImpact = async () => {
    if (api) {
      if (selectedTokenNativeValue?.tokenValue !== "" && selectedTokenAssetValue?.tokenValue !== "") {
        const poolSelected: any = pools?.find(
          (pool: any) => pool?.[0]?.[1]?.Asset.replace(/[, ]/g, "") === selectedTokenB.assetTokenId
        );
        if (poolSelected && selectedTokenNativeValue?.tokenValue && selectedTokenAssetValue?.tokenValue) {
          const poolReserve: any = await getPoolReserves(api, poolSelected?.[0]?.[1]?.Asset.replace(/[, ]/g, ""));

          const assetTokenReserve = formatDecimalsFromToken(
            poolReserve?.[1]?.replace(/[, ]/g, ""),
            selectedTokenB.decimals
          );

          const nativeTokenReserve = formatDecimalsFromToken(
            poolReserve?.[0]?.replace(/[, ]/g, ""),
            selectedTokenA.nativeTokenDecimals
          );

          const priceBeforeSwap = new Decimal(nativeTokenReserve).div(assetTokenReserve);

          const priceOfAssetBForOneAssetA = new Decimal(assetTokenReserve).div(nativeTokenReserve);
          setAssetBPriceOfOneAssetA(priceOfAssetBForOneAssetA.toFixed(5));

          const valueA = new Decimal(selectedTokenNativeValue?.tokenValue).add(nativeTokenReserve);
          const valueB = new Decimal(assetTokenReserve).minus(selectedTokenAssetValue?.tokenValue);

          const priceAfterSwap = valueA.div(valueB);

          const priceImpact = new Decimal(1).minus(priceBeforeSwap.div(priceAfterSwap));

          setPriceImpact(priceImpact.mul(100).toFixed(2));
        }
      }
    }
  };

  useEffect(() => {
    calculatePriceImpact();
  }, [selectedTokenB.tokenSymbol, selectedTokenAssetValue?.tokenValue, selectedTokenNativeValue?.tokenValue]);

  useEffect(() => {
    if (tokenBalances) {
      setSelectedTokenA({
        nativeTokenSymbol: tokenBalances.tokenSymbol,
        nativeTokenDecimals: tokenBalances.tokenDecimals,
        tokenId: "",
        tokenBalance: tokenBalances.balance.toString(),
      });
    }
  }, [tokenBalances]);

  useEffect(() => {
    if (Number(nativeTokenWithSlippage.tokenValue) > 0 && Number(assetTokenWithSlippage.tokenValue) > 0) {
      handleAddPoolLiquidityGasFee();
    }
  }, [nativeTokenWithSlippage.tokenValue, assetTokenWithSlippage.tokenValue]);

  useEffect(() => {
    dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
  }, []);

  useEffect(() => {
    if (params?.id) {
      populateAssetToken();
    }
  }, [params?.id]);

  useEffect(() => {
    if (
      selectedTokenNativeValue &&
      inputEdited.inputType === InputEditedType.exactIn &&
      selectedNativeTokenNumber.gt(0)
    ) {
      setSelectedTokenAValue(selectedTokenNativeValue.tokenValue);
    } else if (
      selectedTokenAssetValue &&
      inputEdited.inputType === InputEditedType.exactOut &&
      selectedAssetTokenNumber.gt(0)
    ) {
      setSelectedTokenBValue(selectedTokenAssetValue.tokenValue);
    }
  }, [slippageValue]);

  useEffect(() => {
    if (tokenBId?.id) {
      const checkPoolExists = checkIfPoolAlreadyExists(tokenBId.id, pools);
      setPoolExists(checkPoolExists);
    }
  }, [tokenBId?.id]);

  useEffect(() => {
    if (tokenBId?.id) {
      const checkPoolExists = checkIfPoolAlreadyExists(selectedTokenB.assetTokenId, pools);
      setPoolExists(checkPoolExists);
    }
  }, [selectedTokenB.assetTokenId]);

  useEffect(() => {
    if (Object.keys(selectedAccount).length === 0) {
      navigateToPools();
    }
  }, [selectedAccount]);

  useEffect(() => {
    dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS, payload: false });
  }, [selectedTokenB.assetTokenId, selectedTokenNativeValue, selectedTokenAssetValue]);

  // Transaction timeout is now handled by useTransactionTimeout hook

  const onMaxClickTokenA = () => {
    const formattedBalance = formatBalanceForMaxClick(selectedTokenA.tokenBalance, selectedTokenA.nativeTokenDecimals);
    if (formattedBalance) setSelectedTokenAValue(formattedBalance);
  };

  const onMaxClickTokenB = () => {
    const formattedBalance = formatBalanceForMaxClick(selectedTokenB.assetTokenBalance, selectedTokenB.decimals);
    if (formattedBalance) setSelectedTokenBValue(formattedBalance);
  };

  return (
    <div className="flex max-w-[460px] flex-col gap-4">
      {tokenBId?.id && poolExists === false ? (
        <CreatePool tokenBSelected={selectedTokenB} />
      ) : (
        <div className="relative flex w-full flex-col items-center gap-1.5 rounded-2xl bg-white p-5 dark:bg-dark-bg-secondary">
          <button className="absolute left-[18px] top-[18px]" onClick={navigateToPools}>
            <BackArrow width={24} height={24} />
          </button>
          <h3 className="heading-6 font-unbounded-variable font-normal text-black dark:text-dark-text-primary">
            {t("poolsPage.addLiquidity")}
          </h3>
          <hr className="mb-0.5 mt-1 w-full border-[0.7px] border-gray-50 dark:border-dark-border-primary" />
          <TokenAmountInput
            tokenText={selectedTokenA?.nativeTokenSymbol}
            tokenIcon={<TokenIcon tokenSymbol={selectedTokenA?.nativeTokenSymbol} className="h-8 w-8" />}
            tokenBalance={selectedTokenA.tokenBalance}
            tokenId={selectedTokenA.tokenId}
            tokenDecimals={selectedTokenA.nativeTokenDecimals}
            tokenValue={selectedTokenNativeValue?.tokenValue}
            onClick={() => null}
            onSetTokenValue={(value) => setSelectedTokenAValue(value)}
            selectDisabled={true}
            disabled={addLiquidityLoading}
            assetLoading={assetLoading}
            onMaxClick={onMaxClickTokenA}
          />
          <TokenAmountInput
            tokenText={selectedTokenB?.tokenSymbol}
            tokenIcon={<TokenIcon tokenSymbol={selectedTokenB?.tokenSymbol} className="h-8 w-8" />}
            tokenBalance={selectedTokenB.assetTokenBalance}
            tokenId={selectedTokenB.assetTokenId}
            tokenDecimals={selectedTokenB.decimals}
            tokenValue={selectedTokenAssetValue?.tokenValue}
            onClick={() => setIsModalOpen(true)}
            onSetTokenValue={(value) => setSelectedTokenBValue(value)}
            selectDisabled={!tokenBId?.id}
            disabled={addLiquidityLoading}
            assetLoading={assetLoading}
            onMaxClick={onMaxClickTokenB}
          />
          <div className="mt-1 text-small text-gray-200 dark:text-dark-text-secondary">{transferGasFeesMessage}</div>
          <SlippageTolerance
            slippageAuto={slippageAuto}
            slippageValue={slippageValue}
            setSlippageAuto={setSlippageAuto}
            setSlippageValue={setSlippageValue}
            disabled={addLiquidityLoading}
            loading={assetLoading}
            accountConnected={!!selectedAccount.address}
          >
            <WarningMessage show={poolExists} message={t("poolsPage.poolExists")} />
          </SlippageTolerance>
          {selectedTokenNativeValue?.tokenValue && selectedTokenAssetValue?.tokenValue && (
            <>
              {" "}
              <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-2 py-4 dark:bg-dark-bg-card">
                <div className="flex w-full flex-row text-medium font-normal text-gray-200 dark:text-dark-text-secondary">
                  <span>
                    1 {selectedTokenA.nativeTokenSymbol} = {assetBPriceOfOneAssetA} {selectedTokenB.tokenSymbol}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-4 py-6 dark:bg-dark-bg-card">
                <div className="flex w-full flex-row justify-between text-medium font-normal text-gray-200 dark:text-dark-text-secondary">
                  <div className="flex">Price impact</div>
                  <span>~ {priceImpact}%</span>
                </div>
                <div className="flex w-full flex-row justify-between text-medium font-normal text-gray-200 dark:text-dark-text-secondary">
                  <div className="flex">
                    {inputEdited.inputType === InputEditedType.exactIn ? "Expected output" : "Expected input"}
                  </div>
                  <span>
                    {inputEdited.inputType === InputEditedType.exactIn
                      ? selectedTokenAssetValue.tokenValue + " " + selectedTokenB.tokenSymbol
                      : selectedTokenNativeValue.tokenValue + " " + selectedTokenA.nativeTokenSymbol}
                  </span>
                </div>
                <div className="flex w-full flex-row justify-between text-medium font-normal text-gray-200 dark:text-dark-text-secondary">
                  <div className="flex">
                    {inputEdited.inputType === InputEditedType.exactIn ? "Minimum output" : "Maximum input"}
                  </div>
                  <span>
                    {inputEdited.inputType === InputEditedType.exactIn
                      ? formatDecimalsFromToken(assetTokenWithSlippage?.tokenValue, selectedTokenB.decimals) +
                        " " +
                        selectedTokenB.tokenSymbol
                      : formatDecimalsFromToken(
                          nativeTokenWithSlippage?.tokenValue,
                          selectedTokenA.nativeTokenDecimals
                        ) +
                        " " +
                        selectedTokenA.nativeTokenSymbol}
                  </span>
                </div>
              </div>
            </>
          )}
          <TransactionButton
            onClick={() => setReviewModalOpen(true)}
            disabled={getButtonProperties.disabled}
            loading={addLiquidityLoading}
            label={getButtonProperties.label}
            transactionType={TransactionTypes.add}
          />
          <ReviewTransactionModal
            open={reviewModalOpen}
            title="Review adding liquidity"
            transactionType={TransactionTypes.add}
            priceImpact={priceImpact}
            inputValueA={selectedTokenNativeValue ? selectedTokenNativeValue?.tokenValue : ""}
            inputValueB={selectedTokenAssetValue ? selectedTokenAssetValue?.tokenValue : ""}
            inputTokenSymbolA={selectedTokenA.nativeTokenSymbol}
            inputTokenSymbolB={selectedTokenB.tokenSymbol}
            tokenValueA={
              inputEdited.inputType === InputEditedType.exactIn
                ? selectedTokenAssetValue?.tokenValue
                : selectedTokenNativeValue?.tokenValue
            }
            tokenValueB={
              inputEdited.inputType === InputEditedType.exactIn
                ? formatDecimalsFromToken(assetTokenWithSlippage?.tokenValue, selectedTokenB.decimals)
                : formatDecimalsFromToken(nativeTokenWithSlippage?.tokenValue, selectedTokenA.nativeTokenDecimals)
            }
            tokenSymbolA={
              inputEdited.inputType === InputEditedType.exactIn
                ? selectedTokenB.tokenSymbol
                : selectedTokenA.nativeTokenSymbol
            }
            tokenSymbolB={
              inputEdited.inputType === InputEditedType.exactIn
                ? selectedTokenB.tokenSymbol
                : selectedTokenA.nativeTokenSymbol
            }
            onClose={() => {
              setReviewModalOpen(false);
            }}
            inputType={inputEdited.inputType}
            onConfirmTransaction={() => {
              handlePool();
            }}
          />
          <TokenSelectModal
            onSelect={(tokenData) => {
              if ("assetTokenId" in tokenData) {
                setSelectedTokenB(tokenData);
              }
            }}
            onClose={() => setIsModalOpen(false)}
            open={isModalOpen}
            title={t("button.selectToken")}
            selected={selectedTokenB}
            modalType="pool"
          />
          <SwapAndPoolSuccessModal
            open={successModalOpen}
            onClose={closeSuccessModal}
            contentTitle={t("modal.addTooExistingPool.successfullyAddedLiquidity")}
          />
        </div>
      )}
      <WarningMessage
        show={tooManyDecimalsError.isError}
        message={t("pageError.tooManyDecimals", {
          token: tooManyDecimalsError.tokenSymbol,
          decimals: tooManyDecimalsError.decimalsAllowed,
        })}
      />
      <WarningMessage show={isTokenCanNotCreateWarningPools} message={t("pageError.tokenCanNotCreateWarning")} />
      <WarningMessage
        show={isTransactionTimeout}
        message={t("pageError.transactionTimeout", { url: `${assethubSubscanUrl}/account/${selectedAccount.address}` })}
      />
    </div>
  );
};

export default AddPoolLiquidity;
