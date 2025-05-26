import React from "react";

interface PriceDisplayProps {
  tokenASymbol: string;
  tokenBSymbol: string;
  price: string;
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ tokenASymbol, tokenBSymbol, price, className = "" }) => {
  return (
    <div className={`flex w-full flex-col gap-2 rounded-lg bg-purple-50 px-2 py-4 ${className}`}>
      <div className="flex w-full flex-row text-medium font-normal text-gray-200">
        <span>
          1 {tokenASymbol} = {price} {tokenBSymbol}
        </span>
      </div>
    </div>
  );
};

export default PriceDisplay;
