import { FC, useMemo } from "react";
import { t } from "i18next";
import { ButtonVariants, TransactionTypes } from "../../../app/types/enum";
import { useTransactionStatus } from "../../../app/hooks/useTransactionStatus";
import { useCountdown } from "../../../app/hooks/useCountdown";
import { LottieMedium } from "../../../assets/loader";
import Button from "../../atom/Button";
import { getCurrentStageTime } from "../../../config/transactionTiming";

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

  const stageTimeMs = useMemo(() => {
    if (!loading || !transactionStatus.currentStatus) return 0;
    return getCurrentStageTime(transactionStatus.currentStatus);
  }, [loading, transactionStatus.currentStatus]);

  const countdownSeconds = useCountdown({
    initialTimeMs: stageTimeMs,
    isActive: loading && stageTimeMs > 0,
    stageKey: transactionStatus.currentStatus, // Use status as stage key
  });

  const statusTextWithCountdown = useMemo(() => {
    const baseText = transactionStatus.statusText || t("transactionStatus.preparing");
    if (countdownSeconds > 0) {
      return `${baseText} (~${countdownSeconds}s)`;
    }
    return baseText;
  }, [transactionStatus.statusText, countdownSeconds]);

  return (
    <Button
      onClick={() => (disabled ? null : onClick())}
      variant={variant}
      disabled={disabled || loading}
      hasSpinner={loading}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LottieMedium />
          <span className="shimmer-text">{statusTextWithCountdown}</span>
        </span>
      ) : (
        label
      )}
    </Button>
  );
};

export default TransactionButton;
