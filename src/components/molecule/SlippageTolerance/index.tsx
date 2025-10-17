import React from "react";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import { NumericFormat } from "react-number-format";

interface SlippageToleranceProps {
  slippageAuto: boolean;
  slippageValue: number | undefined;
  setSlippageAuto: (value: boolean) => void;
  setSlippageValue: (value: number) => void;
  disabled?: boolean;
  loading?: boolean;
  accountConnected?: boolean;
  children?: React.ReactNode;
}

const SlippageTolerance: React.FC<SlippageToleranceProps> = ({
  slippageAuto,
  slippageValue,
  setSlippageAuto,
  setSlippageValue,
  disabled = false,
  loading = false,
  accountConnected = true,
  children,
}) => {
  const { t } = useTranslation();
  const isDisabled = disabled || loading || !accountConnected;

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-4 py-6 dark:bg-dark-bg-card">
      <div className="flex w-full justify-between text-medium font-normal text-gray-200 dark:text-dark-text-secondary">
        <div className="flex">{t("tokenAmountInput.slippageTolerance")}</div>
        <span>{slippageValue ?? 15}%</span>
      </div>
      <div className="flex w-full gap-2">
        <div className="flex w-full basis-8/12 rounded-xl bg-white p-1 text-large font-normal text-gray-400 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary">
          <button
            className={classNames("flex basis-1/2 justify-center rounded-lg px-4 py-3", {
              "bg-white text-gray-400 dark:bg-dark-bg-secondary dark:text-dark-text-secondary": !slippageAuto,
              "bg-pink text-white": slippageAuto,
            })}
            onClick={() => {
              setSlippageAuto(true);
              setSlippageValue(15);
            }}
            disabled={isDisabled}
          >
            {t("tokenAmountInput.auto")}
          </button>
          <button
            className={classNames("flex basis-1/2 justify-center rounded-lg px-4 py-3", {
              "bg-white text-gray-400 dark:bg-dark-bg-secondary dark:text-dark-text-secondary": slippageAuto,
              "bg-pink text-white": !slippageAuto,
            })}
            onClick={() => setSlippageAuto(false)}
            disabled={isDisabled}
          >
            {t("tokenAmountInput.custom")}
          </button>
        </div>
        <div className="flex basis-1/3">
          <div className="relative flex">
            <NumericFormat
              value={slippageValue ?? 15}
              isAllowed={(values) => {
                const { formattedValue, floatValue } = values;
                return formattedValue === "" || (floatValue !== undefined && floatValue <= 99);
              }}
              onValueChange={({ value }) => {
                setSlippageValue(parseInt(value) >= 0 ? parseInt(value) : 0);
              }}
              fixedDecimalScale={true}
              thousandSeparator={false}
              allowNegative={false}
              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-large text-gray-200 outline-none dark:border-dark-border-primary dark:bg-dark-bg-secondary dark:text-dark-text-primary"
              disabled={slippageAuto || isDisabled}
            />
            <span className="absolute bottom-1/3 right-2 text-medium text-gray-100 dark:text-dark-text-tertiary">
              %
            </span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default SlippageTolerance;
