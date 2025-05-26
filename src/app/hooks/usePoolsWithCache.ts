import { useEffect, useRef } from "react";
import { ApiPromise } from "@polkadot/api";
import type { WalletAccount } from "@talismn/connect-wallets";
import { Dispatch } from "react";
import { ActionType } from "../types/enum";
import { PoolAction } from "../../store/pools/interface";
import { createPoolCardsArray, getAllPools, getAllLiquidityPoolsTokensMetadata } from "../../services/poolServices";
import PoolsCache from "../util/poolsCache";

interface UsePoolsWithCacheProps {
  api: ApiPromise | null;
  selectedAccount: WalletAccount | null;
  dispatch: Dispatch<PoolAction>;
}

export const usePoolsWithCache = ({ api, selectedAccount, dispatch }: UsePoolsWithCacheProps) => {
  const backgroundUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  const loadPoolsFromCache = () => {
    const cachedData = PoolsCache.getCachedData();
    if (cachedData) {
      dispatch({ type: ActionType.SET_POOLS, payload: cachedData.pools });
      dispatch({ type: ActionType.SET_POOLS_CARDS, payload: cachedData.poolsCards });
      dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: cachedData.poolsTokenMetadata });
      return true;
    }
    return false;
  };

  const loadPoolsFromApi = async (updateCache = true) => {
    if (!api) return null;

    try {
      const allPools = await getAllPools(api);
      const poolsTokenMetadata = await getAllLiquidityPoolsTokensMetadata(api);

      if (allPools) {
        dispatch({ type: ActionType.SET_POOLS, payload: allPools });
        dispatch({ type: ActionType.SET_POOLS_TOKEN_METADATA, payload: poolsTokenMetadata });

        // Create a temporary dispatch to capture pool cards
        const poolsCards: any[] = [];
        const tempDispatch = (action: any) => {
          if (action.type === ActionType.SET_POOLS_CARDS) {
            poolsCards.push(...action.payload);
          }
        };

        await createPoolCardsArray(api, tempDispatch, allPools, selectedAccount || undefined);

        // Update real state
        dispatch({ type: ActionType.SET_POOLS_CARDS, payload: poolsCards });

        if (updateCache) {
          PoolsCache.set(allPools, poolsCards, poolsTokenMetadata);
        }

        return { pools: allPools, poolsCards, poolsTokenMetadata };
      }
    } catch {
      // Error handling is optional for background pool loading
    }

    return null;
  };

  const updatePoolsInBackground = async () => {
    if (!api) return;

    try {
      const result = await loadPoolsFromApi(true);
      if (result) {
        // Silently update cache and state in background
      }
    } catch {
      // Error handling is optional for background pool updates
    }
  };

  const startBackgroundUpdate = () => {
    if (backgroundUpdateRef.current) {
      clearInterval(backgroundUpdateRef.current);
    }

    backgroundUpdateRef.current = setInterval(() => {
      updatePoolsInBackground();
    }, 30000); // Update every 30 seconds
  };

  const initializePools = async () => {
    if (!api) return;

    // Try to load from cache first for instant UI response
    const cacheLoaded = loadPoolsFromCache();

    if (cacheLoaded && !PoolsCache.isExpired()) {
      // Cache is fresh, start background updates immediately
      startBackgroundUpdate();
    } else {
      // No cache or expired cache, load from API first
      await loadPoolsFromApi(true);
      startBackgroundUpdate();
    }
  };

  useEffect(() => {
    if (api && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      initializePools();
    }

    return () => {
      if (backgroundUpdateRef.current) {
        clearInterval(backgroundUpdateRef.current);
      }
    };
  }, [api, selectedAccount]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (backgroundUpdateRef.current) {
        clearInterval(backgroundUpdateRef.current);
      }
    };
  }, []);

  return {
    refreshPools: () => loadPoolsFromApi(true),
    clearCache: () => {
      PoolsCache.clear();
    },
    loadFromCache: loadPoolsFromCache,
  };
};
