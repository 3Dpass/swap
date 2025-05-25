import { FC } from "react";
import { getTokenIconPath } from "../../../app/util/tokenIcon";

interface TokenIconProps {
  tokenSymbol?: string;
  className?: string;
  alt?: string;
}

const TokenIcon: FC<TokenIconProps> = ({ 
  tokenSymbol, 
  className = "",
  alt = "Token Icon"
}) => {
  const iconPath = getTokenIconPath(tokenSymbol);

  return (
    <div className={`inline-block rounded-full overflow-hidden bg-gray-100 ${className}`}>
      <img 
        src={iconPath} 
        alt={alt} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default TokenIcon;