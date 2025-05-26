import { FC } from "react";
import classNames from "classnames";
import { TokenProps } from "../../../app/types";
import { ActionType } from "../../../app/types/enum";
import { formatDecimalsFromToken } from "../../../app/util/helper";
import { useAppContext } from "../../../state";
import CheckIcon from "../../../assets/img/selected-token-check.svg?react";
import Modal from "../../atom/Modal";
import TokenIcon from "../../atom/TokenIcon";

// Pool components use AssetTokenProps format
type AssetTokenProps = {
  tokenSymbol: string;
  assetTokenId: string;
  decimals: string;
  assetTokenBalance: string;
};

interface TokenSelectModalProps {
  open: boolean;
  title: string;
  tokensData?: TokenProps[];
  selected: TokenProps | AssetTokenProps;
  onClose: () => void;
  onSelect: (tokenData: TokenProps | AssetTokenProps) => void;
  modalType?: "swap" | "pool";
}

const TokenSelectModal: FC<TokenSelectModalProps> = ({
  open,
  title,
  tokensData,
  selected,
  onClose,
  onSelect,
  modalType = "swap",
}) => {
  const { state, dispatch } = useAppContext();
  const { tokenBalances } = state;

  // Use provided tokensData for swap, or tokenBalances.assets for pool
  const tokens = modalType === "swap" ? tokensData : tokenBalances?.assets;

  const handleSelectToken = (item: any) => {
    if (modalType === "swap") {
      const tokenData: TokenProps = {
        tokenSymbol: item.assetTokenMetadata?.symbol,
        tokenId: item.tokenId,
        decimals: item.assetTokenMetadata?.decimals,
        tokenBalance: item.tokenAsset?.balance,
      };
      onSelect(tokenData);
    } else {
      // Pool modal format - use AssetTokenProps
      const assetTokenData: AssetTokenProps = {
        tokenSymbol: item.assetTokenMetadata?.symbol,
        assetTokenId: item.tokenId,
        decimals: item.assetTokenMetadata?.decimals,
        assetTokenBalance: item.tokenAsset?.balance,
      };
      // For pool modals, also dispatch to store
      dispatch({
        type: ActionType.SET_POOL_ASSET_TOKEN_DATA,
        payload: {
          tokenSymbol: assetTokenData.tokenSymbol,
          assetTokenId: assetTokenData.assetTokenId,
          decimals: assetTokenData.decimals,
        },
      });
      onSelect(assetTokenData);
    }
    onClose();
  };

  const getSelectedTokenId = () => {
    if (modalType === "swap") {
      return (selected as TokenProps)?.tokenId;
    } else {
      // Pool modal uses assetTokenId
      return (selected as AssetTokenProps)?.assetTokenId;
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="max-h-[504px] overflow-y-auto">
        {tokens && tokens.length > 0 ? (
          <>
            {tokens.map((item: any, index: number) => (
              <div key={index} className="group flex min-w-[498px] flex-col hover:rounded-md hover:bg-pink">
                <button
                  className={classNames("flex items-center gap-3 px-4 py-3", {
                    "rounded-md bg-purple-200 hover:bg-pink": item.tokenId === getSelectedTokenId(),
                  })}
                  onClick={() => handleSelectToken(item)}
                >
                  <TokenIcon tokenSymbol={item.assetTokenMetadata?.symbol} className="h-6 w-6" />
                  <div className="flex w-full justify-between gap-2">
                    <div className="flex flex-col items-start">
                      <div className="text-base font-medium">{item.assetTokenMetadata?.symbol}</div>
                      <div className="text-small font-light text-gray-200">
                        {formatDecimalsFromToken(item.tokenAsset?.balance || 0, item.assetTokenMetadata?.decimals)}{" "}
                        Available
                      </div>
                    </div>
                    {item.tokenId === getSelectedTokenId() ? (
                      <span className="flex items-center justify-center">
                        <CheckIcon />
                      </span>
                    ) : null}
                  </div>
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center">
            <span className="font-light text-gray-100">Please wait, Loading available tokens</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TokenSelectModal;
