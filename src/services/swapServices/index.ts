import { ApiPromise } from "@polkadot/api";
import { getWalletBySource, type WalletAccount } from "@talismn/connect-wallets";
import { t } from "i18next";
import { Dispatch } from "react";
import { ActionType, ServiceResponseStatus, TransactionStatus } from "../../app/types/enum";
import { formatDecimalsFromToken } from "../../app/util/helper";
import dotAcpToast from "../../app/util/toast";
import { SwapAction } from "../../store/swap/interface";
import { WalletAction } from "../../store/wallet/interface";
import { createAssetTokenId, createNativeTokenId } from "../poolServices";

// Helper class for tracking swap timing
class SwapTimingTracker {
  private timings: Record<string, number> = {};
  private startTime: number;
  private currentPhaseStart: number;

  constructor() {
    this.startTime = Date.now();
    this.currentPhaseStart = this.startTime;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startPhase(_phaseName: string) {
    this.currentPhaseStart = Date.now();
  }

  endPhase(phaseName: string) {
    this.timings[phaseName] = Date.now() - this.currentPhaseStart;
  }

  finish() {
    this.timings.total = Date.now() - this.startTime;
  }

  getReport() {
    return this.timings;
  }

  logReport(status: "Success" | "Failed" | "Error") {
    console.log(`=== Swap Timing Report (${status}) ===`);
    console.log(JSON.stringify(this.timings, null, 2));
    console.log("Copy the above timings to update config/transactionTiming.ts");
  }
}

// Helper function to get block number from finalized status
const getBlockNumberFromFinalized = async (api: ApiPromise, blockHash: any): Promise<string> => {
  const header = await api.rpc.chain.getHeader(blockHash);
  return header.number.toNumber().toString();
};

const checkIfExactError = (errorValue: string) => {
  return errorValue === t("swapPage.palletSlippageError");
};

const exactSwapAmounts = (
  itemEvents: any,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction>
) => {
  const swapExecutedEvent = itemEvents.events.filter((item: any) => item.event.method === "SwapExecuted");

  const amountIn = formatDecimalsFromToken(
    parseFloat(swapExecutedEvent[0].event.data.amountIn.replace(/[, ]/g, "")),
    tokenADecimals
  );
  const amountOut = formatDecimalsFromToken(
    parseFloat(swapExecutedEvent[0].event.data.amountOut.replace(/[, ]/g, "")),
    tokenBDecimals
  );

  dispatch({ type: ActionType.SET_SWAP_EXACT_IN_TOKEN_AMOUNT, payload: amountIn });
  dispatch({ type: ActionType.SET_SWAP_EXACT_OUT_TOKEN_AMOUNT, payload: amountOut });

  return swapExecutedEvent;
};

export const swapNativeForAssetExactIn = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  tokenADecimals: string,
  tokenBDecimals: string,
  reverse: boolean,
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  // Start timing the entire swap operation
  console.time("Total Swap Time");
  console.time("Preparation");
  const timingTracker = new SwapTimingTracker();
  timingTracker.startPhase("Preparation");

  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });
  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.preparing });

  const result = api.tx.assetConversion.swapExactTokensForTokens(
    reverse ? [secondArg, firstArg] : [firstArg, secondArg],
    reverse ? assetTokenValue : nativeTokenValue,
    reverse ? nativeTokenValue : assetTokenValue,
    account.address,
    false
  );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  console.timeEnd("Preparation");
  timingTracker.endPhase("Preparation");
  console.time("Signing");
  timingTracker.startPhase("Signing");

  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.signing });

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      if (response.status.isReady || response.status.isBroadcast) {
        console.timeEnd("Signing");
        timingTracker.endPhase("Signing");
        console.time("Network Submission");
        timingTracker.startPhase("Network Submission");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.sendingToNetwork });
      }
      if (response.status.isInBlock) {
        console.timeEnd("Network Submission");
        timingTracker.endPhase("Network Submission");
        console.time("Finalization");
        timingTracker.startPhase("Finalization");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForFinalization });
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Failed");
          console.error("Swap failed with error:", response.dispatchError);

          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(checkIfExactError(docs.join(" ")) ? t("swapPage.slippageError") : `${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          } else {
            if (response.dispatchError.toString() === t("pageError.tokenCanNotCreate")) {
              dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: true });
            }
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.time("Post-Processing");
          timingTracker.startPhase("Post-Processing");

          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.finalizing });
          const swapExecutedEvent = exactSwapAmounts(response.toHuman(), tokenADecimals, tokenBDecimals, dispatch);

          if (swapExecutedEvent && swapExecutedEvent.length > 0) {
            const amountIn = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountIn.replace(/[, ]/g, "")),
              tokenADecimals
            );
            const amountOut = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountOut.replace(/[, ]/g, "")),
              tokenBDecimals
            );

            dotAcpToast.success(`Successfully swapped ${amountIn} tokens for ${amountOut} tokens`, {
              style: {
                maxWidth: "500px",
              },
            });
          }

          const blockNumber = await getBlockNumberFromFinalized(api, response.status.asFinalized);
          dispatch({
            type: ActionType.SET_BLOCK_HASH_FINALIZED,
            payload: blockNumber,
          });

          dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
            payload: "",
          });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEE,
            payload: "",
          });
          dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: null });

          console.timeEnd("Post-Processing");
          timingTracker.endPhase("Post-Processing");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Success");
          console.log("Swap completed successfully!");
        }
      }
    })
    .catch((error: any) => {
      console.timeEnd("Total Swap Time");
      timingTracker.finish();
      timingTracker.logReport("Error");
      console.error("Swap transaction failed:", error);

      dotAcpToast.error(`Transaction failed: ${error}`);
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
        payload: "",
      });
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEE,
        payload: "",
      });
      dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
      dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
    });

  return result;
};

export const swapNativeForAssetExactOut = async (
  api: ApiPromise,
  assetTokenId: string,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  tokenADecimals: string,
  tokenBDecimals: string,
  reverse: boolean,
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  // Start timing the entire swap operation
  console.time("Total Swap Time");
  console.time("Preparation");
  const timingTracker = new SwapTimingTracker();
  timingTracker.startPhase("Preparation");

  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });
  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.preparing });

  const result = api.tx.assetConversion.swapTokensForExactTokens(
    reverse ? [secondArg, firstArg] : [firstArg, secondArg],
    reverse ? nativeTokenValue : assetTokenValue,
    reverse ? assetTokenValue : nativeTokenValue,
    account.address,
    false
  );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  console.timeEnd("Preparation");
  timingTracker.endPhase("Preparation");
  console.time("Signing");
  timingTracker.startPhase("Signing");

  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.signing });

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      if (response.status.isReady || response.status.isBroadcast) {
        console.timeEnd("Signing");
        timingTracker.endPhase("Signing");
        console.time("Network Submission");
        timingTracker.startPhase("Network Submission");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.sendingToNetwork });
      }
      if (response.status.isInBlock) {
        console.timeEnd("Network Submission");
        timingTracker.endPhase("Network Submission");
        console.time("Finalization");
        timingTracker.startPhase("Finalization");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForFinalization });
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Failed");
          console.error("Swap failed with error:", response.dispatchError);

          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(checkIfExactError(docs.join(" ")) ? t("swapPage.slippageError") : `${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          } else {
            if (response.dispatchError.toString() === t("pageError.tokenCanNotCreate")) {
              dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: true });
            }
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.time("Post-Processing");
          timingTracker.startPhase("Post-Processing");

          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.finalizing });
          const swapExecutedEvent = exactSwapAmounts(response.toHuman(), tokenADecimals, tokenBDecimals, dispatch);

          if (swapExecutedEvent && swapExecutedEvent.length > 0) {
            const amountIn = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountIn.replace(/[, ]/g, "")),
              tokenADecimals
            );
            const amountOut = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountOut.replace(/[, ]/g, "")),
              tokenBDecimals
            );

            dotAcpToast.success(`Successfully swapped ${amountIn} tokens for ${amountOut} tokens`, {
              style: {
                maxWidth: "500px",
              },
            });
          }

          const blockNumber = await getBlockNumberFromFinalized(api, response.status.asFinalized);
          dispatch({
            type: ActionType.SET_BLOCK_HASH_FINALIZED,
            payload: blockNumber,
          });
          dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
            payload: "",
          });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEE,
            payload: "",
          });
          dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: null });

          console.timeEnd("Post-Processing");
          timingTracker.endPhase("Post-Processing");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Success");
          console.log("Swap completed successfully!");
        }
      }
    })
    .catch((error: any) => {
      console.timeEnd("Total Swap Time");
      timingTracker.finish();
      timingTracker.logReport("Error");
      console.error("Swap transaction failed:", error);

      dotAcpToast.error(`Transaction failed: ${error}`);
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
        payload: "",
      });
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEE,
        payload: "",
      });
      dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
      dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
    });

  return result;
};

export const swapAssetForAssetExactIn = async (
  api: ApiPromise,
  assetTokenAId: string,
  assetTokenBId: string,
  account: WalletAccount,
  assetTokenAValue: string,
  assetTokenBValue: string,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  // Start timing the entire swap operation
  console.time("Total Swap Time");
  console.time("Preparation");
  const timingTracker = new SwapTimingTracker();
  timingTracker.startPhase("Preparation");

  const firstArg = createAssetTokenId(api, assetTokenAId);
  const secondArg = createNativeTokenId(api);
  const thirdArg = createAssetTokenId(api, assetTokenBId);

  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });
  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.preparing });

  const result = api.tx.assetConversion.swapExactTokensForTokens(
    [firstArg, secondArg, thirdArg],
    assetTokenAValue,
    assetTokenBValue,
    account.address,
    false
  );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  console.timeEnd("Preparation");
  timingTracker.endPhase("Preparation");
  console.time("Signing");
  timingTracker.startPhase("Signing");

  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.signing });

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      if (response.status.isReady || response.status.isBroadcast) {
        console.timeEnd("Signing");
        timingTracker.endPhase("Signing");
        console.time("Network Submission");
        timingTracker.startPhase("Network Submission");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.sendingToNetwork });
      }
      if (response.status.isInBlock) {
        console.timeEnd("Network Submission");
        timingTracker.endPhase("Network Submission");
        console.time("Finalization");
        timingTracker.startPhase("Finalization");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForFinalization });
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Failed");
          console.error("Swap failed with error:", response.dispatchError);

          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(checkIfExactError(docs.join(" ")) ? t("swapPage.slippageError") : `${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          } else {
            if (response.dispatchError.toString() === t("pageError.tokenCanNotCreate")) {
              dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: true });
            }
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.time("Post-Processing");
          timingTracker.startPhase("Post-Processing");

          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.finalizing });
          const swapExecutedEvent = exactSwapAmounts(response.toHuman(), tokenADecimals, tokenBDecimals, dispatch);

          if (swapExecutedEvent && swapExecutedEvent.length > 0) {
            const amountIn = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountIn.replace(/[, ]/g, "")),
              tokenADecimals
            );
            const amountOut = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountOut.replace(/[, ]/g, "")),
              tokenBDecimals
            );

            dotAcpToast.success(`Successfully swapped ${amountIn} tokens for ${amountOut} tokens`, {
              style: {
                maxWidth: "500px",
              },
            });
          }

          const blockNumber = await getBlockNumberFromFinalized(api, response.status.asFinalized);
          dispatch({
            type: ActionType.SET_BLOCK_HASH_FINALIZED,
            payload: blockNumber,
          });
          dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
            payload: "",
          });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEE,
            payload: "",
          });
          dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: null });

          console.timeEnd("Post-Processing");
          timingTracker.endPhase("Post-Processing");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Success");
          console.log("Swap completed successfully!");
        }
      }
    })
    .catch((error: any) => {
      console.timeEnd("Total Swap Time");
      timingTracker.finish();
      timingTracker.logReport("Error");
      console.error("Swap transaction failed:", error);

      dotAcpToast.error(`Transaction failed: ${error}`);
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
        payload: "",
      });
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEE,
        payload: "",
      });
      dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
      dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
    });

  return result;
};

export const swapAssetForAssetExactOut = async (
  api: ApiPromise,
  assetTokenAId: string,
  assetTokenBId: string,
  account: WalletAccount,
  assetTokenAValue: string,
  assetTokenBValue: string,
  tokenADecimals: string,
  tokenBDecimals: string,
  dispatch: Dispatch<SwapAction | WalletAction>
) => {
  // Start timing the entire swap operation
  console.time("Total Swap Time");
  console.time("Preparation");
  const timingTracker = new SwapTimingTracker();
  timingTracker.startPhase("Preparation");

  const firstArg = createAssetTokenId(api, assetTokenAId);
  const secondArg = createNativeTokenId(api);
  const thirdArg = createAssetTokenId(api, assetTokenBId);

  dispatch({ type: ActionType.SET_SWAP_LOADING, payload: true });
  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.preparing });

  const result = api.tx.assetConversion.swapTokensForExactTokens(
    [firstArg, secondArg, thirdArg],
    assetTokenBValue,
    assetTokenAValue,
    account.address,
    false
  );

  const wallet = getWalletBySource(account.wallet?.extensionName);

  console.timeEnd("Preparation");
  timingTracker.endPhase("Preparation");
  console.time("Signing");
  timingTracker.startPhase("Signing");

  dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.signing });

  result
    .signAndSend(account.address, { signer: wallet?.signer }, async (response) => {
      if (response.status.isReady || response.status.isBroadcast) {
        console.timeEnd("Signing");
        timingTracker.endPhase("Signing");
        console.time("Network Submission");
        timingTracker.startPhase("Network Submission");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.sendingToNetwork });
      }
      if (response.status.isInBlock) {
        console.timeEnd("Network Submission");
        timingTracker.endPhase("Network Submission");
        console.time("Finalization");
        timingTracker.startPhase("Finalization");
        dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.waitingForFinalization });
        dotAcpToast.success(`Completed at block hash #${response.status.asInBlock.toString()}`, {
          style: {
            maxWidth: "750px",
          },
        });
      } else {
        if (response.status.type === ServiceResponseStatus.Finalized && response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Failed");
          console.error("Swap failed with error:", response.dispatchError);

          if (response.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(response.dispatchError.asModule);
            const { docs } = decoded;
            dotAcpToast.error(checkIfExactError(docs.join(" ")) ? t("swapPage.slippageError") : `${docs.join(" ")}`);
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          } else {
            if (response.dispatchError.toString() === t("pageError.tokenCanNotCreate")) {
              dispatch({ type: ActionType.SET_TOKEN_CAN_NOT_CREATE_WARNING_SWAP, payload: true });
            }
            dotAcpToast.error(response.dispatchError.toString());
            dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
            dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
          }
        } else {
          dotAcpToast.success(`Current status: ${response.status.type}`);
        }
        if (response.status.type === ServiceResponseStatus.Finalized && !response.dispatchError) {
          console.timeEnd("Finalization");
          timingTracker.endPhase("Finalization");
          console.time("Post-Processing");
          timingTracker.startPhase("Post-Processing");

          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.finalizing });
          const swapExecutedEvent = exactSwapAmounts(response.toHuman(), tokenADecimals, tokenBDecimals, dispatch);

          if (swapExecutedEvent && swapExecutedEvent.length > 0) {
            const amountIn = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountIn.replace(/[, ]/g, "")),
              tokenADecimals
            );
            const amountOut = formatDecimalsFromToken(
              parseFloat(swapExecutedEvent[0].event.data.amountOut.replace(/[, ]/g, "")),
              tokenBDecimals
            );

            dotAcpToast.success(`Successfully swapped ${amountIn} tokens for ${amountOut} tokens`, {
              style: {
                maxWidth: "500px",
              },
            });
          }

          const blockNumber = await getBlockNumberFromFinalized(api, response.status.asFinalized);
          dispatch({
            type: ActionType.SET_BLOCK_HASH_FINALIZED,
            payload: blockNumber,
          });
          dispatch({ type: ActionType.SET_SWAP_FINALIZED, payload: true });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
            payload: "",
          });
          dispatch({
            type: ActionType.SET_SWAP_GAS_FEE,
            payload: "",
          });
          dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
          dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: null });

          console.timeEnd("Post-Processing");
          timingTracker.endPhase("Post-Processing");
          console.timeEnd("Total Swap Time");
          timingTracker.finish();
          timingTracker.logReport("Success");
          console.log("Swap completed successfully!");
        }
      }
    })
    .catch((error: any) => {
      console.timeEnd("Total Swap Time");
      timingTracker.finish();
      timingTracker.logReport("Error");
      console.error("Swap transaction failed:", error);

      dotAcpToast.error(`Transaction failed: ${error}`);
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
        payload: "",
      });
      dispatch({
        type: ActionType.SET_SWAP_GAS_FEE,
        payload: "",
      });
      dispatch({ type: ActionType.SET_SWAP_LOADING, payload: false });
      dispatch({ type: ActionType.SET_SWAP_LOADING_STATUS, payload: TransactionStatus.error });
    });

  return result;
};

export const checkSwapNativeForAssetExactInGasFee = async (
  api: ApiPromise,
  assetTokenId: string | null,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  reverse: boolean,
  dispatch: Dispatch<SwapAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  const result = api.tx.assetConversion.swapExactTokensForTokens(
    reverse ? [secondArg, firstArg] : [firstArg, secondArg],
    reverse ? assetTokenValue : nativeTokenValue,
    reverse ? nativeTokenValue : assetTokenValue,
    account.address,
    false
  );
  const { partialFee } = await result.paymentInfo(account.address);

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};

export const checkSwapNativeForAssetExactOutGasFee = async (
  api: ApiPromise,
  assetTokenId: string | null,
  account: WalletAccount,
  nativeTokenValue: string,
  assetTokenValue: string,
  reverse: boolean,
  dispatch: Dispatch<SwapAction>
) => {
  const firstArg = createNativeTokenId(api);
  const secondArg = createAssetTokenId(api, assetTokenId);

  const result = api.tx.assetConversion.swapTokensForExactTokens(
    reverse ? [firstArg, secondArg] : [secondArg, firstArg],
    reverse ? nativeTokenValue : assetTokenValue,
    reverse ? assetTokenValue : nativeTokenValue,
    account.address,
    false
  );
  const { partialFee } = await result.paymentInfo(account.address);

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};

export const checkSwapAssetForAssetExactInGasFee = async (
  api: ApiPromise,
  assetTokenAId: string | null,
  assetTokenBId: string | null,
  account: WalletAccount,
  assetTokenAValue: string,
  assetTokenBValue: string,
  dispatch: Dispatch<SwapAction>
) => {
  const firstArg = createAssetTokenId(api, assetTokenAId);
  const secondArg = createNativeTokenId(api);
  const thirdArg = createAssetTokenId(api, assetTokenBId);

  const result = api.tx.assetConversion.swapExactTokensForTokens(
    [firstArg, secondArg, thirdArg],
    assetTokenAValue,
    assetTokenBValue,
    account.address,
    false
  );
  const { partialFee } = await result.paymentInfo(account.address);

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};

export const checkSwapAssetForAssetExactOutGasFee = async (
  api: ApiPromise,
  assetTokenAId: string | null,
  assetTokenBId: string | null,
  account: WalletAccount,
  assetTokenAValue: string,
  assetTokenBValue: string,
  dispatch: Dispatch<SwapAction>
) => {
  const firstArg = createAssetTokenId(api, assetTokenAId);
  const secondArg = createNativeTokenId(api);
  const thirdArg = createAssetTokenId(api, assetTokenBId);

  const result = api.tx.assetConversion.swapTokensForExactTokens(
    [firstArg, secondArg, thirdArg],
    assetTokenAValue,
    assetTokenBValue,
    account.address,
    false
  );
  const { partialFee } = await result.paymentInfo(account.address);

  dispatch({
    type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
    payload: `transaction will have a weight of ${partialFee.toHuman()} fees`,
  });
  dispatch({
    type: ActionType.SET_SWAP_GAS_FEE,
    payload: partialFee.toHuman(),
  });
};
