import { PoolCardProps } from "../types";
import LocalStorage from "./localStorage";

interface PoolsCacheData {
  pools: any[];
  poolsCards: PoolCardProps[];
  poolsTokenMetadata: any[];
  timestamp: number;
}

const POOLS_CACHE_KEY = "pools_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class PoolsCache {
  static set(pools: any[], poolsCards: PoolCardProps[], poolsTokenMetadata: any[] = []): void {
    const cacheData: PoolsCacheData = {
      pools,
      poolsCards,
      poolsTokenMetadata,
      timestamp: Date.now(),
    };
    LocalStorage.set(POOLS_CACHE_KEY, cacheData);
  }

  static get(): PoolsCacheData | null {
    const cached = LocalStorage.get(POOLS_CACHE_KEY);
    if (!cached || !cached.timestamp) {
      return null;
    }

    return cached;
  }

  static isExpired(): boolean {
    const cached = this.get();
    if (!cached) {
      return true;
    }

    return Date.now() - cached.timestamp > CACHE_DURATION;
  }

  static getCachedData(): { pools: any[]; poolsCards: PoolCardProps[]; poolsTokenMetadata: any[] } | null {
    const cached = this.get();
    if (!cached) {
      return null;
    }

    return {
      pools: cached.pools,
      poolsCards: cached.poolsCards,
      poolsTokenMetadata: cached.poolsTokenMetadata || [],
    };
  }

  static clear(): void {
    LocalStorage.remove(POOLS_CACHE_KEY);
  }
}

export default PoolsCache;
