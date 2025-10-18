import React from "react";
import Modal from "../../atom/Modal";
import { NETWORKS } from "../../../networkConfig";
import { NetworkKeys } from "../../../app/types/enum";

interface NetworkInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NetworkInfoModal: React.FC<NetworkInfoModalProps> = ({ isOpen, onClose }) => {
  const currentNetwork = NETWORKS[NetworkKeys.P3D];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-heading-3 font-bold text-black dark:text-dark-text-primary">Connection Details</h2>

        <div className="space-y-4">
          <div>
            <div className="mb-2 block text-small font-medium text-gray-200 dark:text-dark-text-secondary">
              Network Name
            </div>
            <div className="rounded-lg border border-gray-200 bg-purple-100 p-3 dark:border-dark-border-primary dark:bg-dark-bg-card">
              <span className="font-medium text-gray-300 dark:text-dark-text-primary">
                {currentNetwork.networkName}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-2 block text-small font-medium text-gray-200 dark:text-dark-text-secondary">RPC URL</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-gray-200 bg-purple-100 p-3 dark:border-dark-border-primary dark:bg-dark-bg-card">
                <span className="font-mono text-small text-gray-300 dark:text-dark-text-primary">
                  {currentNetwork.rpcUrl}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(currentNetwork.rpcUrl)}
                className="rounded-lg bg-pink px-3 py-2 text-small font-medium text-white transition-colors duration-200 hover:bg-pink hover:opacity-80"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 block text-small font-medium text-gray-200 dark:text-dark-text-secondary">
              Chain ID
            </div>
            <div className="rounded-lg border border-gray-200 bg-purple-100 p-3 dark:border-dark-border-primary dark:bg-dark-bg-card">
              <span className="font-medium text-gray-300 dark:text-dark-text-primary">{currentNetwork.chainId}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 block text-small font-medium text-gray-200 dark:text-dark-text-secondary">
              SS58 Format
            </div>
            <div className="rounded-lg border border-gray-200 bg-purple-100 p-3 dark:border-dark-border-primary dark:bg-dark-bg-card">
              <span className="font-medium text-gray-300 dark:text-dark-text-primary">{currentNetwork.ss58Format}</span>
            </div>
          </div>

          {currentNetwork.assethubSubscanUrl && (
            <div>
              <div className="mb-2 block text-small font-medium text-gray-200 dark:text-dark-text-secondary">
                Block Explorer
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-gray-200 bg-purple-100 p-3 dark:border-dark-border-primary dark:bg-dark-bg-card">
                  <a
                    href={currentNetwork.assethubSubscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {currentNetwork.assethubSubscanUrl}
                  </a>
                </div>
                <button
                  onClick={() => copyToClipboard(currentNetwork.assethubSubscanUrl!)}
                  className="rounded-lg bg-pink px-3 py-2 text-small font-medium text-white transition-colors duration-200 hover:bg-pink hover:opacity-80"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NetworkInfoModal;
