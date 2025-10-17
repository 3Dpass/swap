import React, { useEffect, useRef } from "react";
import { Identicon } from "@polkadot/react-identicon";
// @ts-expect-error - @metamask/jazzicon doesn't have TypeScript declarations
import generateIdenticon from "@metamask/jazzicon";

interface AccountIdenticonProps {
  address: string;
  isEVM?: boolean;
  size?: number;
  className?: string;
}

const AccountIdenticon: React.FC<AccountIdenticonProps> = ({ address, isEVM = false, size = 40, className = "" }) => {
  const jazziconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEVM && jazziconRef.current && address) {
      // Clear previous content
      jazziconRef.current.innerHTML = "";

      // Generate jazzicon for EVM addresses
      const seed = parseInt(address.slice(2, 10), 16);
      const icon = generateIdenticon(size, seed);
      jazziconRef.current.appendChild(icon);
    }
  }, [address, isEVM, size]);

  if (isEVM) {
    return (
      <div
        ref={jazziconRef}
        className={`inline-block overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // For Substrate addresses, use Polkadot's Identicon
  return (
    <div className={`inline-block overflow-hidden rounded-full ${className}`}>
      <Identicon value={address} size={size} theme="polkadot" />
    </div>
  );
};

export default AccountIdenticon;
