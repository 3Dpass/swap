import { FC } from "react";
import { t } from "i18next";
import { ButtonVariants, TransactionTypes } from "../../../app/types/enum";
import { useTransactionStatus } from "../../../app/hooks/useTransactionStatus";
import { LottieMedium } from "../../../assets/loader";
import Button from "../../atom/Button";

interface TransactionButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  transactionType: TransactionTypes;
  variant?: ButtonVariants;
  className?: string;
}

const TransactionButton: FC<TransactionButtonProps> = ({
  onClick,
  disabled,
  loading,
  label,
  transactionType,
  variant = ButtonVariants.btnInteractivePink,
  className,
}) => {
  const transactionStatus = useTransactionStatus(transactionType);

  return (
    <Button
      onClick={() => (disabled ? null : onClick())}
      variant={variant}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LottieMedium />
          <span className="shimmer-text">{transactionStatus.statusText || t("transactionStatus.preparing")}</span>
        </span>
      ) : (
        label
      )}
    </Button>
  );
};

export default TransactionButton;
