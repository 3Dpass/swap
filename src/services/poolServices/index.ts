import { ApiPromise } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import Decimal from "decimal.js";
import { t } from "i18next";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { LpTokenAsset, PoolCardProps } from "../../app/types";
import { ActionType, ServiceResponseStatus, TransactionStatus } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import dotAcpToast from "../../app/util/toast";
import { PoolAction } from "../../store/pools/interface";
import { WalletAction } from "../../store/wallet/interface";

const { nativeTokenSymbol } = useGetNetwork();

// Helper function to get block number from finalized status
const getBlockNumberFromFinalized = async (api: ApiPromise, blockHash: any): Promise<string> => {
  const header = await api.rpc.chain.getHeader(blockHash);
  return header.number.toNumber().toString();
};

const exactAddedLiquidityInPool = (
  itemEvents: any,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction>
) => {
  const liquidityAddedEvent = itemEvents.events.filter((item: any) => item.event.method === "LiquidityAdded");

  const nativeTokenIn = formatDecimalsFromToken(
    parseFloat(liquidityAddedEvent[0].event.data.amount1Provided.replace(/[, ]/g, "")),
    nativeTokenDecimals
  );
  const assetTokenIn = formatDecimalsFromToken(
    parseFloat(liquidityAddedEvent[0].event.data.amount2Provided.replace(/[, ]/g, "")),
    assetTokenDecimals
  );

  dispatch({ type: ActionType.SET_EXACT_NATIVE_TOKEN_ADD_LIQUIDITY, payload: nativeTokenIn });
  dispatch({ type: ActionType.SET_EXACT_ASSET_TOKEN_ADD_LIQUIDITY, payload: assetTokenIn });

  return liquidityAddedEvent;
};

const exactWithdrawnLiquidityFromPool = (
  itemEvents: any,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction>
) => {
  const liquidityRemovedEvent = itemEvents.events.filter((item: any) => item.event.method === "LiquidityRemoved");

  const nativeTokenOut = formatDecimalsFromToken(
    parseFloat(liquidityRemovedEvent[0].event.data.amount1.replace(/[, ]/g, "")),
    nativeTokenDecimals
  );
  const assetTokenOut = formatDecimalsFromToken(
    parseFloat(liquidityRemovedEvent[0].event.data.amount2.replace(/[, ]/g, "")),
    assetTokenDecimals
  );

  dispatch({ type: ActionType.SET_EXACT_NATIVE_TOKEN_WITHDRAW, payload: nativeTokenOut });
  dispatch({ type: ActionType.SET_EXACT_ASSET_TOKEN_WITHDRAW, payload: assetTokenOut });

  return liquidityRemovedEvent;
};

export const getAllPools = async (api: ApiPromise) => {
  try {
    const pools = await api.query.assetConversion.pools.entries();

    return pools.map(([key, value]) => [key.args?.[0].toHuman(), value.toHuman()]);
  } catch (error) {
    dotAcpToast.error(`Error getting pools: ${error}`);
  }
};

export const getPoolReserves = async (api: ApiPromise, assetTokenId: string) => {
  const multiLocation = createAssetTokenId(api, assetTokenId);
  const multiLocation2 = createNativeTokenId(api);

  const encodedInput = new Uint8Array(multiLocation.length + multiLocation2.length);
  encodedInput.set(multiLocation2, 0);
  encodedInput.set(multiLocation, multiLocation2.length);

  const encodedInputHex = u8aToHex(encodedInput);

  const reservers = await api.rpc.state.call("AssetConversionApi_get_reserves", encodedInputHex);

  const decoded = api.createType("Option<(u128, u128)>", reservers);

  return decoded.toHuman();
};

export function createNativeTokenId(api: ApiPromise) {
  return api.createType("PalletAssetConversionNativeOrAssetId", { native: true }).toU8a();
}

export function createAssetTokenId(api: ApiPromise, assetTokenId: string | null) {
  return api.createType("PalletAssetConversionNativeOrAssetId", { asset: assetTokenId }).toU8a();
}

export const createPool = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction | WalletAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: true });

  const result = api.tx.assetConversion.createPool(firstArg, secondArg);

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      if (response.status.type === ServiceResponseStatus.Finalized) {
        addLiquidity(
          api,
          assetTokenId,
          account,
          nativeTokenValue,
          assetTokenValue,
          minNativeTokenValue,
          minAssetTokenValue,
          nativeTokenDecimals,
          assetTokenDecimals,
          dispatch
        );
      }

      if (response.status.isInBlock) {
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(`${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
          } else {
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
          dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
        }
      }
    })
    .catch((error: any) => {
      dotAcpToast.error(`Transaction failed ${error}`);
      dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
      dispatch({ type: ActionType.SET_CREATE_POOL_LOADING, payload: false });
    });
};

export const addLiquidity = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction | WalletAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: true });
  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.preparing });

  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.validatingInputs });

  const result = api.tx.assetConversion.addLiquidity(
    firstArg,
    secondArg,
    nativeTokenValue,
    assetTokenValue,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );

  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.checkingBalances });

  const { partialFee } = await result.paymentInfo(account.address);

  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });

  dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.signing });

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      // Update status when transaction is sent
      if (!response.status.isInBlock && !response.status.isFinalized) {
        dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.sendingToNetwork });
      }

      if (response.status.isInBlock) {
        dispatch({
          type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS,
          payload: TransactionStatus.waitingForFinalization,
        });
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(`${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.error });
          } else {
            if (response.dispatchError.toString() === t("pageError.tokenCanNotCreate")) {
              dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS, payload: true });
            }
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.error });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized) {
          dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.finalizing });

          exactAddedLiquidityInPool(response.toHuman(), nativeTokenDecimals, assetTokenDecimals, dispatch);

          const blockNumber = await getBlockNumberFromFinalized(api, response.status.asFinalized);
          dispatch({
            type: ActionType.SET_BLOCK_HASH_FINALIZED,
            payload: blockNumber,
          });
          dispatch({ type: ActionType.SET_SUCCESS_MODAL_OPEN, payload: true });
          dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
          dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.success });
          const allPools = await getAllPools(api);
          if (allPools) {
            dispatch({ type: ActionType.SET_POOLS, payload: allPools });
            await createPoolCardsArray(api, dispatch, allPools, account);
          }
        }
      }
    })
    .catch((error: any) => {
      dotAcpToast.error(`Transaction failed ${error}`);
      dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
      dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING, payload: false });
      dispatch({ type: ActionType.SET_ADD_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.error });
    });
};

export const removeLiquidity = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  lpTokensAmountToBurn: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  nativeTokenDecimals: string,
  assetTokenDecimals: string,
  dispatch: Dispatch<PoolAction | WalletAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: true });
  dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.preparing });

  dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.validatingInputs });

  const result = api.tx.assetConversion.removeLiquidity(
    firstArg,
    secondArg,
    lpTokensAmountToBurn,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );

  dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.signing });

  const wallet = getWalletBySource(account.wallet?.extensionName);

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      // Update status when transaction is sent
      if (!response.status.isInBlock && !response.status.isFinalized) {
        dispatch({
          type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
          payload: TransactionStatus.sendingToNetwork,
        });
      }

      if (response.status.isInBlock) {
        dispatch({
          type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS,
          payload: TransactionStatus.waitingForFinalization,
        });
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(`${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.error });
          } else {
            if (response.dispatchError.toString() === t("pageError.tokenCanNotCreate")) {
              dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_POOLS, payload: true });
            }
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
            dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.error });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized) {
          dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.finalizing });

          exactWithdrawnLiquidityFromPool(response.toHuman(), nativeTokenDecimals, assetTokenDecimals, dispatch);

          const blockNumber = await getBlockNumberFromFinalized(api, response.status.asFinalized);
          dispatch({
            type: ActionType.SET_BLOCK_HASH_FINALIZED,
            payload: blockNumber,
          });
          dispatch({ type: ActionType.SET_SUCCESS_MODAL_OPEN, payload: true });
          dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
          dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.success });
          const allPools = await getAllPools(api);
          if (allPools) {
            dispatch({ type: ActionType.SET_POOLS, payload: allPools });
            await createPoolCardsArray(api, dispatch, allPools, account);
          }
        }
      }
    })
    .catch((error: any) => {
      dotAcpToast.error(`Transaction failed ${error}`);
      dispatch({ type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE, payload: "" });
      dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING, payload: false });
      dispatch({ type: ActionType.SET_WITHDRAW_LIQUIDITY_LOADING_STATUS, payload: TransactionStatus.error });
    });
};

export const checkCreatePoolGasFee = async (
  api: ApiPromise,
  assetTokenId: string,
  account: any,
  dispatch: Dispatch<PoolAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  const result = api.tx.assetConversion.createPool(firstArg, secondArg);
  const { partialFee } = await result.paymentInfo(account.address);

  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_POOL_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};

export const checkAddPoolLiquidityGasFee = async (
  api: ApiPromise,
  assetTokenId: string,
  account: any,
  nativeTokenValue: string,
  assetTokenValue: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  dispatch: Dispatch<PoolAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  const result = api.tx.assetConversion.addLiquidity(
    firstArg,
    secondArg,
    nativeTokenValue,
    assetTokenValue,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );
  const { partialFee } = await result.paymentInfo(account.address);
  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_ADD_LIQUIDITY_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};

export const getAllLiquidityPoolsTokensMetadata = async (api: ApiPromise) => {
  const poolsTokenData = [];
  const pools = await getAllPools(api);
  if (pools) {
    const poolsAssetTokenIds = pools?.map((pool: any) => {
      if (pool?.[0]?.[1].Asset) {
        return pool?.[0]?.[1]?.Asset.replace(/[, ]/g, "").toString();
      }
    });

    for (const item of poolsAssetTokenIds) {
      if (item) {
        const poolReserves: any = await getPoolReserves(api, item);
        if (poolReserves?.length > 0) {
          const poolsTokenMetadata = await api.query.poscanAssets.metadata(item);
          const resultObject = {
            tokenId: item,
            assetTokenMetadata: poolsTokenMetadata.toHuman(),
            tokenAsset: {
              balance: 0,
            },
          };
          poolsTokenData.push(resultObject);
        }
      }
    }
  }
  return poolsTokenData;
};

export const checkWithdrawPoolLiquidityGasFee = async (
  api: ApiPromise,
  assetTokenId: string,
  account: any,
  lpTokensAmountToBurn: string,
  minNativeTokenValue: string,
  minAssetTokenValue: string,
  dispatch: Dispatch<PoolAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  const result = api.tx.assetConversion.removeLiquidity(
    firstArg,
    secondArg,
    lpTokensAmountToBurn,
    minNativeTokenValue,
    minAssetTokenValue,
    account.address
  );

  const { partialFee } = await result.paymentInfo(account.address);
  dispatch({
    type: ActionType.SET_TRANSFER_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_ADD_LIQUIDITY_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};

export const createPoolCardsArray = async (
  api: ApiPromise,
  dispatch: Dispatch<PoolAction>,
  pools: any,
  selectedAccount?: WalletAccount
) => {
  const apiPool = api as ApiPromise;
  try {
    const poolCardsArray: PoolCardProps[] = [];

    const tokenMetadata = api.registry.getChainProperties();
    const nativeTokenDecimals = tokenMetadata?.tokenDecimals.toHuman()?.toString().replace(/[, ]/g, "");

    await Promise.all(
      pools.map(async (pool: any) => {
        const lpTokenId = pool?.[1]?.lpToken;

        let lpToken = null;
        if (selectedAccount?.address) {
          const lpTokenAsset = await apiPool.query.poscanPoolAssets.account(lpTokenId, selectedAccount?.address);
          lpToken = lpTokenAsset.toHuman() as LpTokenAsset;
        }

        if (pool?.[0]) {
          const [asset1, asset2] = pool[0];
          const asset1IsNative = asset1 === "Native";
          const asset2IsNative = asset2 === "Native";

          const asset1TokenId = asset1IsNative ? null : asset1.Asset.replace(/[, ]/g, "");
          const asset2TokenId = asset2IsNative ? null : asset2.Asset.replace(/[, ]/g, "");

          const poolReserves: any = await getPoolReserves(apiPool, asset1IsNative ? asset2TokenId : asset1TokenId);

          if (poolReserves?.length > 1) {
            const [asset1Metadata, asset2Metadata] = await Promise.all([
              asset1IsNative
                ? Promise.resolve({ symbol: nativeTokenSymbol, decimals: nativeTokenDecimals })
                : apiPool.query.poscanAssets.metadata(asset1TokenId).then((m) => m.toHuman()),
              asset2IsNative
                ? Promise.resolve({ symbol: nativeTokenSymbol, decimals: nativeTokenDecimals })
                : apiPool.query.poscanAssets.metadata(asset2TokenId).then((m) => m.toHuman()),
            ]);

            const formatTokenAmount = (amount: string, decimals: string) => {
              const formatted = formatDecimalsFromToken(amount, decimals);
              return new Decimal(formatted).gte(1)
                ? new Decimal(formatted).toFixed(2)
                : new Decimal(formatted).toFixed(6);
            };

            const asset1Amount = poolReserves[0]?.replace(/[, ]/g, "") ?? "0";
            const asset2Amount = poolReserves[1]?.replace(/[, ]/g, "") ?? "0";

            const asset1Symbol = (asset1Metadata as any)?.symbol ?? "Unknown";
            const asset2Symbol = (asset2Metadata as any)?.symbol ?? "Unknown";
            const asset1Decimals = (asset1Metadata as any)?.decimals ?? "0";
            const asset2Decimals = (asset2Metadata as any)?.decimals ?? "0";

            poolCardsArray.push({
              name: `${asset1Symbol}–${asset2Symbol}`,
              lpTokenAsset: lpToken,
              lpTokenId: lpTokenId,
              assetTokenId: asset2IsNative ? asset1TokenId : asset2TokenId,
              totalTokensLocked: {
                asset1Token: {
                  decimals: asset1Decimals,
                  formattedValue: formatTokenAmount(asset1Amount, asset1Decimals),
                  value: asset1Amount,
                  symbol: asset1Symbol,
                },
                asset2Token: {
                  decimals: asset2Decimals,
                  formattedValue: formatTokenAmount(asset2Amount, asset2Decimals),
                  value: asset2Amount,
                  symbol: asset2Symbol,
                },
              },
            });
          }
        }
      })
    );

    poolCardsArray.sort((a, b) => a.name.localeCompare(b.name));

    poolCardsArray.sort((a, b) => {
      if (a.lpTokenAsset === null) return 1;
      if (b.lpTokenAsset === null) return -1;
      return parseInt(a?.lpTokenAsset?.balance) - parseInt(b?.lpTokenAsset?.balance);
    });

    dispatch({ type: ActionType.SET_POOLS_CARDS, payload: poolCardsArray });
  } catch (error) {
    dotAcpToast.error(t("poolsPage.errorFetchingPools", { error: error }));
  }
};
