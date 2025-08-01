import { ApiPromise, WsProvider } from "@polkadot/api";
import "@polkadot/api-augment";
import type { AnyJson } from "@polkadot/types/types/codec";
import { formatBalance } from "@polkadot/util";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { getWalletBySource, getWallets } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import useGetNetwork from "../../app/hooks/useGetNetwork";
import { TokenBalanceData } from "../../app/types";
import { ActionType } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import LocalStorage from "../../app/util/localStorage";
import dotAcpToast from "../../app/util/toast";
import { PoolAction } from "../../store/pools/interface";
import { WalletAction } from "../../store/wallet/interface";
import { getAllLiquidityPoolsTokensMetadata } from "../poolServices";

// Singleton API instance and initialization promise
let apiInstance: ApiPromise | null = null;
let apiInitPromise: Promise<ApiPromise> | null = null;

// Balance fetching deduplication
const balanceFetchPromises = new Map<string, Promise<any>>();

export const setupPolkadotApi = async () => {
  // Return existing instance if available
  if (apiInstance && apiInstance.isConnected) {
    return apiInstance;
  }

  // If initialization is in progress, wait for it
  if (apiInitPromise) {
    return apiInitPromise;
  }

  // Start new initialization
  apiInitPromise = (async () => {
    const { rpcUrl } = useGetNetwork();
    const wsProvider = new WsProvider(rpcUrl);
    const api = await ApiPromise.create({ provider: wsProvider });

    // Get chain info for connection validation
    await Promise.all([api.rpc.system.chain(), api.rpc.system.name(), api.rpc.system.version()]);

    apiInstance = api;
    return api;
  })();

  try {
    return await apiInitPromise;
  } finally {
    // Clear the promise after completion
    apiInitPromise = null;
  }
};

const getWalletTokensBalance = async (api: ApiPromise, walletAddress: string) => {
  // Check if a balance fetch is already in progress for this wallet
  const existingPromise = balanceFetchPromises.get(walletAddress);
  if (existingPromise) {
    return existingPromise;
  }

  // Create new balance fetch promise
  const fetchPromise = (async () => {
    const { data: balance } = await api.query.system.account(walletAddress);
    const tokenMetadata = api.registry.getChainProperties();
    const existentialDeposit = await api.consts.balances.existentialDeposit;

    const allAssets = await api.query.poscanAssets.asset.entries();

    const allChainAssets: { tokenData: AnyJson; tokenId: any }[] = [];

    allAssets.forEach((item) => {
      allChainAssets.push({ tokenData: item?.[1].toHuman(), tokenId: item?.[0].toHuman() });
    });

    const myAssetTokenData = [];
    const assetTokensDataPromises = [];

    for (const item of allChainAssets) {
      const cleanedTokenId = item?.tokenId?.[0]?.replace(/[, ]/g, "");
      assetTokensDataPromises.push(
        Promise.all([
          api.query.poscanAssets.account(cleanedTokenId, walletAddress),
          api.query.poscanAssets.metadata(cleanedTokenId),
        ]).then(([tokenAsset, assetTokenMetadata]) => {
          if (tokenAsset.toHuman()) {
            const humanTokenAsset = tokenAsset.toHuman() as any;
            const resultObject = {
              tokenId: cleanedTokenId,
              assetTokenMetadata: assetTokenMetadata.toHuman(),
              tokenAsset: {
                ...humanTokenAsset,
                balance: (tokenAsset.toJSON() as any)?.balance || tokenAsset.toString(),
              },
            };
            return resultObject;
          }
          return null;
        })
      );
    }

    const results = await Promise.all(assetTokensDataPromises);

    myAssetTokenData.push(...results.filter((result) => result !== null));

    const ss58Format = tokenMetadata?.ss58Format.toHuman();
    const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
    const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();

    const balanceFormatted = formatDecimalsFromToken(balance?.free.toString(), tokenDecimals as string);

    const tokensInfo = {
      balance: balanceFormatted,
      ss58Format,
      existentialDeposit: existentialDeposit.toHuman(),
      tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
      tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
      assets: myAssetTokenData,
    };

    return tokensInfo;
  })();

  // Store the promise for deduplication
  balanceFetchPromises.set(walletAddress, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    // Remove the promise after completion
    balanceFetchPromises.delete(walletAddress);
  }
};

export const assetTokenData = async (id: string, api: ApiPromise) => {
  const assetTokenMetadata = await api.query.poscanAssets.metadata(id);

  const resultObject = {
    tokenId: id,
    assetTokenMetadata: assetTokenMetadata.toHuman(),
  };
  return resultObject;
};

export const getSupportedWallets = () => {
  const supportedWallets: Wallet[] = getWallets();

  return supportedWallets;
};

const setTokenBalance = async (
  dispatch: Dispatch<WalletAction | PoolAction>,
  api: any,
  selectedAccount: WalletAccount,
  showToast: boolean = true
) => {
  if (api) {
    dispatch({ type: ActionType.SET_ASSET_LOADING, payload: true });
    try {
      const poolsTokenMetadata = await getAllLiquidityPoolsTokensMetadata(api);
      dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: poolsTokenMetadata });

      const walletTokens: any = await getWalletTokensBalance(api, selectedAccount?.address);
      dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: walletTokens });

      LocalStorage.set("wallet-connected", selectedAccount);

      if (showToast) {
        dotAcpToast.success("Wallet successfully connected!");
      }
    } catch (error) {
      dotAcpToast.error(`Wallet connection error: ${error}`);
    } finally {
      dispatch({ type: ActionType.SET_ASSET_LOADING, payload: false });
    }
  }
};

export const setTokenBalanceUpdate = async (
  api: ApiPromise,
  walletAddress: string,
  assetId: string,
  oldWalletBalance: any
) => {
  // Check if oldWalletBalance exists
  if (!oldWalletBalance) {
    return;
  }

  const { data: balance } = await api.query.system.account(walletAddress);
  const tokenMetadata = api.registry.getChainProperties();
  const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();
  const ss58Format = tokenMetadata?.ss58Format.toHuman();
  const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
  const nativeTokenNewBalance = formatBalance(balance?.free.toString(), {
    withUnit: tokenSymbol as string,
    withSi: false,
  });
  const existentialDeposit = await api.consts.balances.existentialDeposit;

  const tokenAsset = await api.query.poscanAssets.account(assetId, walletAddress);

  const assetsUpdated = oldWalletBalance.poscanAssets || [];

  if (tokenAsset.toHuman()) {
    const assetTokenMetadata = await api.query.poscanAssets.metadata(assetId);
    const humanTokenAsset = tokenAsset.toHuman() as any;

    const resultObject = {
      tokenId: assetId,
      assetTokenMetadata: assetTokenMetadata.toHuman(),
      tokenAsset: {
        ...humanTokenAsset,
        balance: (tokenAsset.toJSON() as any)?.balance || tokenAsset.toString(),
      },
    };

    const assetInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObject.tokenId);

    if (assetInPossession !== -1) {
      assetsUpdated[assetInPossession] = resultObject;
    } else {
      assetsUpdated.push(resultObject);
    }
  }

  const updatedTokensInfo = {
    balance: nativeTokenNewBalance,
    ss58Format,
    tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
    tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
    assets: assetsUpdated,
    existentialDeposit: existentialDeposit.toHuman(),
  };

  return updatedTokensInfo;
};

export const setTokenBalanceAfterAssetsSwapUpdate = async (
  api: ApiPromise,
  walletAddress: string,
  assetAId: string,
  assetBId: string,
  oldWalletBalance: any
) => {
  // Check if oldWalletBalance exists
  if (!oldWalletBalance) {
    return;
  }

  const { data: balance } = await api.query.system.account(walletAddress);
  const tokenMetadata = api.registry.getChainProperties();
  const tokenSymbol = tokenMetadata?.tokenSymbol.toHuman();
  const ss58Format = tokenMetadata?.ss58Format.toHuman();
  const tokenDecimals = tokenMetadata?.tokenDecimals.toHuman();
  const nativeTokenNewBalance = formatBalance(balance?.free.toString(), {
    withUnit: tokenSymbol as string,
    withSi: false,
  });

  const tokenAssetA = await api.query.poscanAssets.account(assetAId, walletAddress);
  const tokenAssetB = await api.query.poscanAssets.account(assetBId, walletAddress);

  const assetsUpdated = oldWalletBalance.poscanAssets || [];

  if (tokenAssetA.toHuman() && tokenAssetB.toHuman()) {
    const assetTokenAMetadata = await api.query.poscanAssets.metadata(assetAId);
    const assetTokenBMetadata = await api.query.poscanAssets.metadata(assetBId);
    const humanTokenAssetA = tokenAssetA.toHuman() as any;
    const humanTokenAssetB = tokenAssetB.toHuman() as any;

    const resultObjectA = {
      tokenId: assetAId,
      assetTokenMetadata: assetTokenAMetadata.toHuman(),
      tokenAsset: {
        ...humanTokenAssetA,
        balance: (tokenAssetA.toJSON() as any)?.balance || tokenAssetA.toString(),
      },
    };
    const resultObjectB = {
      tokenId: assetBId,
      assetTokenMetadata: assetTokenBMetadata.toHuman(),
      tokenAsset: {
        ...humanTokenAssetB,
        balance: (tokenAssetB.toJSON() as any)?.balance || tokenAssetB.toString(),
      },
    };

    const assetAInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObjectA.tokenId);
    const assetBInPossession = assetsUpdated.findIndex((item: any) => item.tokenId === resultObjectB.tokenId);

    if (assetAInPossession !== -1) {
      assetsUpdated[assetAInPossession] = resultObjectA;
    }

    if (assetBInPossession !== -1) {
      assetsUpdated[assetBInPossession] = resultObjectB;
    } else {
      assetsUpdated.push(resultObjectB);
    }
  }

  const updatedTokensInfo = {
    balance: nativeTokenNewBalance,
    ss58Format,
    tokenDecimals: Array.isArray(tokenDecimals) ? tokenDecimals?.[0] : "",
    tokenSymbol: Array.isArray(tokenSymbol) ? tokenSymbol?.[0] : "",
    assets: assetsUpdated,
  };

  return updatedTokensInfo;
};

export const handleDisconnect = (dispatch: Dispatch<WalletAction | PoolAction>) => {
  LocalStorage.remove("wallet-connected");
  dispatch({ type: ActionType.SET_ACCOUNTS, payload: [] });
  dispatch({ type: ActionType.SET_SELECTED_ACCOUNT, payload: {} as WalletAccount });
  dispatch({ type: ActionType.SET_TOKEN_BALANCES, payload: {} as TokenBalanceData });
  dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: [] });
};

export const connectWalletAndFetchBalance = async (
  dispatch: Dispatch<WalletAction | PoolAction>,
  api: any,
  account: WalletAccount,
  showToast: boolean = true
) => {
  dispatch({ type: ActionType.SET_WALLET_CONNECT_LOADING, payload: true });
  const wallet = getWalletBySource(account.wallet?.extensionName);
  wallet?.enable("P3D-ACP");
  dispatch({ type: ActionType.SET_SELECTED_ACCOUNT, payload: account });
  LocalStorage.set("wallet-connected", account);
  dispatch({ type: ActionType.SET_WALLET_CONNECT_LOADING, payload: false });
  try {
    await setTokenBalance(dispatch, api, account, showToast);
  } catch (error) {
    dotAcpToast.error(`Wallet connection error: ${error}`);
  }
};
