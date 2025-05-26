import { ActionType, TransactionStatus } from "../../app/types/enum";

export interface SwapTokenInfo {
  tokenSymbol: string;
  tokenId: string;
  decimals: string;
  tokenBalance: string;
}

export interface SwapState {
  swapFinalized: boolean;
  swapGasFeesMessage: string;
  swapGasFee: string;
  swapLoading: boolean;
  swapLoadingStatus: TransactionStatus | null;
  swapOperationId: string | null;
  swapExactInTokenAmount: string;
  swapExactOutTokenAmount: string;
  isTokenCanNotCreateWarningSwap: boolean;
  swapFromToken: SwapTokenInfo | null;
  swapToToken: SwapTokenInfo | null;
}

export type SwapAction =
  | { type: ActionType.SET_SWAP_FINALIZED; payload: boolean }
  | { type: ActionType.SET_SWAP_GAS_FEES_MESSAGE; payload: string }
  | { type: ActionType.SET_SWAP_GAS_FEE; payload: string }
  | { type: ActionType.SET_SWAP_LOADING; payload: boolean }
  | { type: ActionType.SET_SWAP_LOADING_STATUS; payload: TransactionStatus | null }
  | { type: ActionType.SET_SWAP_OPERATION_ID; payload: string | null }
  | { type: ActionType.SET_SWAP_EXACT_IN_TOKEN_AMOUNT; payload: string }
  | { type: ActionType.SET_SWAP_EXACT_OUT_TOKEN_AMOUNT; payload: string }
  | { type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP; payload: boolean }
  | { type: ActionType.SET_SWAP_FROM_TOKEN; payload: SwapTokenInfo | null }
  | { type: ActionType.SET_SWAP_TO_TOKEN; payload: SwapTokenInfo | null };
