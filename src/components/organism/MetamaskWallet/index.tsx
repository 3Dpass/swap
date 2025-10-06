import React, { useState, useEffect } from "react";
import Button from "../../atom/Button";
import {
  isMetaMaskInstalled,
  connectMetaMask,
  convertMetaMaskAccountsToWalletAccounts,
  type UnifiedWalletAccount,
} from "../../../services/metamaskServices";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import MetaMaskLogo from "../../../assets/img/MetaMask-icon-fox.svg?react";

interface MetamaskWalletProps {
  onConnect: (accounts: UnifiedWalletAccount[]) => void;
  onError: (error: string) => void;
}

const MetamaskWallet: React.FC<MetamaskWalletProps> = ({ onConnect, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { ss58Format } = useGetNetwork();

  useEffect(() => {
    setIsInstalled(isMetaMaskInstalled());
  }, []);

  const handleConnect = async () => {
    if (!isInstalled) {
      onError("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    setIsConnecting(true);
    try {
      // Connect to MetaMask
      const evmAccounts = await connectMetaMask();

      // Convert EVM accounts to wallet accounts with substrate addresses
      const walletAccounts = await convertMetaMaskAccountsToWalletAccounts(evmAccounts, ss58Format);

      if (walletAccounts.length === 0) {
        onError("No valid accounts found in MetaMask.");
        return;
      }

      onConnect(walletAccounts);
    } catch (error: any) {
      onError(error.message || "Failed to connect to MetaMask");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex cursor-pointer items-center gap-5">
      <div className="flex basis-16">
        <MetaMaskLogo width={36} height={36} />
      </div>
      <span className="flex basis-full items-center">MetaMask</span>
      <div className="flex basis-24 items-center">
        {isInstalled ? (
          <Button className="btn-secondary-white" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Continue"}
          </Button>
        ) : (
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Install
          </a>
        )}
      </div>
    </div>
  );
};

export default MetamaskWallet;
