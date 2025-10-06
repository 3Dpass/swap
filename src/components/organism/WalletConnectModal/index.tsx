import Button from "../../atom/Button";
import Modal from "../../atom/Modal";
import RandomTokenIcon from "../../../assets/img/random-token-icon.svg?react";
import MetaMaskLogo from "../../../assets/img/MetaMask-icon-fox.svg?react";
import { useState } from "react";
import { WalletConnectSteps } from "../../../app/types/enum";
import { ModalStepProps } from "../../../app/types";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { encodeAddress } from "@polkadot/util-crypto";
import useGetNetwork from "../../../app/hooks/useGetNetwork";
import MetamaskWallet from "../MetamaskWallet";
import { type UnifiedWalletAccount, isMetamaskAccount } from "../../../services/metamaskServices";
import dotAcpToast from "../../../app/util/toast";

interface WalletConnectModalProps {
  open: boolean;
  title: string;
  modalStep: ModalStepProps;
  supportedWallets: Wallet[];
  setModalStep: (step: ModalStepProps) => void;
  handleConnect: (account: UnifiedWalletAccount) => void;
  onClose: () => void;
  setWalletConnectOpen: (isOpen: boolean) => void;
  onBack?: () => void | undefined;
}

const WalletConnectModal = ({
  open,
  title,
  modalStep,
  supportedWallets,
  onClose,
  onBack,
  setModalStep,
  handleConnect,
}: WalletConnectModalProps) => {
  const [walletAccounts, setWalletAccounts] = useState<UnifiedWalletAccount[]>([]);
  const { ss58Format } = useGetNetwork();

  const handleContinueClick = (accounts: UnifiedWalletAccount[]) => {
    setModalStep({ step: WalletConnectSteps.stepAddresses });
    setWalletAccounts(accounts);
  };

  const handleMetamaskConnect = (accounts: UnifiedWalletAccount[]) => {
    handleContinueClick(accounts);
  };

  const handleMetamaskError = (error: string) => {
    dotAcpToast.error(error);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title} onBack={onBack}>
      <div className="flex min-w-[450px] flex-col gap-5 p-4">
        {modalStep?.step === WalletConnectSteps.stepExtensions ? (
          <>
            {/* MetaMask Wallet */}
            <MetamaskWallet onConnect={handleMetamaskConnect} onError={handleMetamaskError} />

            {/* Substrate Wallets */}
            {supportedWallets?.map((wallet: Wallet) => {
              return (
                <div key={wallet?.extensionName} className="flex cursor-pointer items-center gap-5">
                  <div className="flex basis-16">
                    <img src={wallet?.logo?.src} alt={wallet?.logo?.alt} width={36} height={36} />
                  </div>
                  <span className="flex basis-full items-center">{wallet?.title}</span>
                  <div className="flex basis-24 items-center">
                    {wallet?.installed ? (
                      <Button
                        className="btn-secondary-white"
                        onClick={async () => {
                          await wallet?.enable("P3D-ACP");
                          const accounts: WalletAccount[] = await wallet?.getAccounts();
                          handleContinueClick(accounts);
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <a href={wallet?.installUrl} target="blank">
                        Install
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
        {modalStep.step === WalletConnectSteps.stepAddresses
          ? walletAccounts?.map((account: UnifiedWalletAccount, index: any) => {
              // Check if it's a MetaMask account
              const isMetaMask = isMetamaskAccount(account);

              return (
                <div key={index} className="flex cursor-pointer flex-col rounded-lg bg-purple-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isMetaMask ? <MetaMaskLogo width={32} height={32} /> : <RandomTokenIcon />}
                    <button className="flex flex-col items-start" onClick={() => handleConnect(account)}>
                      <div className="text-base font-medium text-gray-300">{account?.name}</div>
                      <div className="text-xs font-normal text-gray-300">
                        {account?.address
                          ? (() => {
                              try {
                                // For MetaMask accounts, the address is already the substrate address
                                // For regular accounts, we need to encode it
                                if (isMetaMask) {
                                  return account.address; // Already converted to substrate format
                                } else {
                                  return encodeAddress(account.address, ss58Format);
                                }
                              } catch (error) {
                                console.warn("Failed to encode address:", error);
                                return account.address;
                              }
                            })()
                          : "No address"}
                      </div>
                      {isMetaMask && (
                        <div className="mt-1 text-xs font-normal text-gray-400">EVM: {account.evmAddress}</div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </Modal>
  );
};

export default WalletConnectModal;
