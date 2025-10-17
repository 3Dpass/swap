import { FC } from "react";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import OpenLinkArrow from "../../../assets/img/open-link-arrow.svg?react";
import { useAppContext } from "../../../state";
import Modal from "../../atom/Modal";

interface SwapAndPoolSuccessModalProps {
  open: boolean;
  contentTitle: string;
  onClose: () => void;
}

const SwapAndPoolSuccessModal: FC<SwapAndPoolSuccessModalProps> = ({ open, contentTitle, onClose }) => {
  const { assethubSubscanUrl } = useGetNetwork();
  const { state } = useAppContext();
  const { blockHashFinalized } = state;

  return (
    <div>
      <Modal isOpen={open} onClose={onClose}>
        <div className="flex min-w-[500px] flex-col text-black dark:text-dark-text-primary">
          <div className="mb-2 text-center font-unbounded-variable text-heading-5">{contentTitle}</div>
          <div className="mt-4 flex flex-row items-center justify-center gap-2 font-unbounded-variable text-base text-black dark:text-dark-text-primary">
            <a
              href={`${assethubSubscanUrl}/#/blocks/${blockHashFinalized}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-500 underline hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
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
