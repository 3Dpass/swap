import { FC } from "react";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import ArrowRight from "../../../assets/img/arrow-right.svg?react";
import OpenLinkArrow from "../../../assets/img/open-link-arrow.svg?react";
import { useAppContext } from "../../../state";
import Modal from "../../atom/Modal";
import { formatCompactNumber } from "../../../app/util/helper";

interface SwapAndPoolSuccessModalProps {
  open: boolean;
  contentTitle: string;
  tokenA: {
    value?: string | null;
    symbol: string;
    icon: React.ReactNode;
  };
  tokenB: {
    value?: string | null;
    symbol: string;
    icon: React.ReactNode;
  };
  onClose: () => void;
}

const SwapAndPoolSuccessModal: FC<SwapAndPoolSuccessModalProps> = ({ open, contentTitle, tokenA, tokenB, onClose }) => {
  const { assethubSubscanUrl, nativeTokenSymbol } = useGetNetwork();
  const { state } = useAppContext();
  const { blockHashFinalized } = state;

  return (
    <div>
      <Modal isOpen={open} onClose={onClose}>
        <div className="flex min-w-[500px] flex-col">
          <div className="mb-2 text-center font-unbounded-variable text-heading-5">{contentTitle}</div>
          <div className="my-8 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-4 font-unbounded-variable">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 flex-shrink-0">{tokenA.icon}</div>
                <div className="flex flex-col items-start">
                  <span className="text-3xl font-bold">{formatCompactNumber(tokenA.value || "0")}</span>
                  <span className="text-lg text-gray-400">{tokenA.symbol}</span>
                </div>
              </div>
              <ArrowRight className="mx-4 h-8 w-8" />
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 flex-shrink-0">{tokenB.icon}</div>
                <div className="flex flex-col items-start">
                  <span className="text-3xl font-bold">{formatCompactNumber(tokenB.value || "0")}</span>
                  <span className="text-lg text-gray-400">{tokenB.symbol}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-row items-center justify-center gap-2 font-unbounded-variable text-base">
            <a
              href={`${assethubSubscanUrl}/block${nativeTokenSymbol == "WND" ? "s" : ""}/${blockHashFinalized}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-500 underline hover:text-blue-600"
            >
              View in block explorer
              <OpenLinkArrow className="h-5 w-5" />
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SwapAndPoolSuccessModal;
