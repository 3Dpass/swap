import { ActionType } from "../../app/types/enum";
import { SwapAction, SwapState } from "./interface";

export const initialSwapState: SwapState = {
  swapFinalized: false,
  swapGasFeesMessage: "",
  swapGasFee: "",
  swapLoading: false,
  swapLoadingStatus: null,
  swapOperationId: null,
  swapExactInTokenAmount: "0",
  swapExactOutTokenAmount: "0",
  isTokenCanNotCreateWarningSwap: false,
  swapFromToken: null,
  swapToToken: null,
};

export const swapReducer = (state: SwapState, action: SwapAction): SwapState => {
  switch (action.type) {
    case ActionType.SET_SWAP_FINALIZED:
      return { ...state, swapFinalized: action.payload };
    case ActionType.SET_SWAP_GAS_FEES_MESSAGE:
      return { ...state, swapGasFeesMessage: action.payload };
    case ActionType.SET_SWAP_GAS_FEE:
      return { ...state, swapGasFee: action.payload };
    case ActionType.SET_SWAP_LOADING:
      return { ...state, swapLoading: action.payload };
    case ActionType.SET_SWAP_LOADING_STATUS:
      return { ...state, swapLoadingStatus: action.payload };
    case ActionType.SET_SWAP_OPERATION_ID:
      return { ...state, swapOperationId: action.payload };
    case ActionType.SET_SWAP_EXACT_IN_TOKEN_AMOUNT:
      return { ...state, swapExactInTokenAmount: action.payload };
    case ActionType.SET_SWAP_EXACT_OUT_TOKEN_AMOUNT:
      return { ...state, swapExactOutTokenAmount: action.payload };
    case ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP:
      return { ...state, isTokenCanNotCreateWarningSwap: action.payload };
    case ActionType.SET_SWAP_FROM_TOKEN:
      return { ...state, swapFromToken: action.payload };
    case ActionType.SET_SWAP_TO_TOKEN:
      return { ...state, swapToToken: action.payload };
    default:
      return state;
  }
};
