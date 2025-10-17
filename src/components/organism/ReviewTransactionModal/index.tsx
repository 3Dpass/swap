import { FC } from "react";
import Modal from "../../atom/Modal";
import Button from "../../atom/Button";
import TokenIcon from "../../atom/TokenIcon";
import { ButtonVariants, InputEditedType, TransactionTypes } from "../../../app/types/enum";

interface SwapSelectTokenModalProps {
  open: boolean;
  title: string;
  inputValueA: string;
  inputValueB: string;
  priceImpact?: string;
  tokenValueA?: string;
  tokenValueB?: string;
  tokenValueASecond?: string;
  tokenValueBSecond?: string;
  tokenSymbolA?: string;
  tokenSymbolB?: string;
  inputTokenSymbolA?: string;
  inputTokenSymbolB?: string;
  inputType?: string;
  showAll?: boolean;
  transactionType: TransactionTypes;
  onClose: () => void;
  onConfirmTransaction: () => void;
}

const ReviewTransactionModal: FC<SwapSelectTokenModalProps> = ({
  open,
  title,
  inputValueA,
  inputValueB,
  priceImpact,
  tokenValueA,
  tokenValueASecond,
  tokenValueB,
  tokenValueBSecond,
  tokenSymbolA,
  tokenSymbolB,
  inputTokenSymbolA,
  inputTokenSymbolB,
  inputType,
  showAll,
  transactionType,
  onClose,
  onConfirmTransaction,
}) => {
  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <div className="flex w-[360px] flex-col gap-5 text-black dark:text-dark-text-primary">
        <div className="flex flex-col items-start">
          <span className="font-inter text-small text-gray-200 dark:text-dark-text-secondary">
            {transactionType === TransactionTypes.add && ""}
            {transactionType === TransactionTypes.swap && "You pay"}
            {transactionType === TransactionTypes.withdraw && "Withdrawal amount"}
            {transactionType === TransactionTypes.createPool && "You pay"}
          </span>
          <span className="flex w-full items-center justify-between font-unbounded-variable text-heading-4 font-bold text-gray-400 dark:text-dark-text-primary dark:text-dark-text-primary">
            <div className="flex overflow-y-auto">{inputValueA}</div>
            <div className="w-12 flex-shrink-0">
              <TokenIcon tokenSymbol={inputTokenSymbolA} className="h-12 w-12" />
            </div>
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-inter text-small text-gray-200 dark:text-dark-text-secondary">
            {transactionType === TransactionTypes.add && ""}
            {transactionType === TransactionTypes.swap && "You receive"}
            {transactionType === TransactionTypes.withdraw && "Withdrawal amount"}
            {transactionType === TransactionTypes.createPool && "You pay"}
          </span>
          <span className="flex w-full items-center justify-between gap-6 font-unbounded-variable text-heading-4 font-bold text-gray-400 dark:text-dark-text-primary dark:text-dark-text-primary">
            <div className="flex overflow-y-auto">{inputValueB}</div>
            <div className="w-12 flex-shrink-0">
              <TokenIcon tokenSymbol={inputTokenSymbolB} className="h-12 w-12" />
            </div>
          </span>
        </div>
        {transactionType !== TransactionTypes.createPool && (
          <>
            <hr className="mb-0.5 mt-1 w-full border-[0.7px] border-gray-50 dark:border-dark-border-primary" />
            <div className="flex flex-col">
              <div className="flex justify-between">
                <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary dark:text-dark-text-secondary">
                  Price impact
                </span>
                <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary dark:text-dark-text-primary">
                  {priceImpact}%
                </span>
              </div>
              {showAll ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary">
                      Expected output
                    </span>
                    <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary">
                      {tokenValueA} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary">
                      Minimum output
                    </span>
                    <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary">
                      {tokenValueB} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary">
                      Expected output
                    </span>
                    <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary">
                      {tokenValueASecond} {tokenSymbolB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary">
                      Minimum output
                    </span>
                    <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary">
                      {tokenValueBSecond} {tokenSymbolB}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary">
                      {inputType == InputEditedType.exactIn ? "Expected output" : "Expected input"}
                    </span>
                    <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary">
                      {tokenValueA} {tokenSymbolA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-inter text-medium text-gray-300 dark:text-dark-text-secondary">
                      {inputType === InputEditedType.exactIn ? "Minimum output" : "Maximum input"}
                    </span>
                    <span className="font-inter text-medium text-gray-400 dark:text-dark-text-primary">
                      {tokenValueB} {tokenSymbolB}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <div className="flex flex-col">
          <Button onClick={onConfirmTransaction} variant={ButtonVariants.btnInteractivePink}>
            Confirm {transactionType === TransactionTypes.add && "Deposit"}
            {transactionType === TransactionTypes.swap && "Swap"}
            {transactionType === TransactionTypes.createPool && "Deposit"}
            {transactionType === TransactionTypes.withdraw && "Withdraw"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewTransactionModal;
