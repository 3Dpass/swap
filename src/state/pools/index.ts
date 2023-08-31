import { PoolsState, PoolAction } from "./interface";
import { ActionType } from "../../global/enum";

export const initialPoolsState: PoolsState = {
  pools: null,
  poolCreated: null,
  poolLiquidityAdded: null,
};

export const poolsReducer = (state: PoolsState, action: PoolAction): PoolsState => {
  switch (action.type) {
    case ActionType.SET_POOLS:
      return { ...state, pools: action.payload };
    case ActionType.SET_POOL_CREATED:
      return { ...state, poolCreated: action.payload };
    case ActionType.SET_POOL_LIQUIDITY:
      return { ...state, poolLiquidityAdded: action.payload };
    default:
      return state;
  }
};
