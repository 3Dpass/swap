import { FC } from "react";
import { useTranslation } from "react-i18next";

const DevelopersPage: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 py-4 dark:bg-dark-bg-primary sm:py-6 lg:py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-400 dark:text-dark-text-primary">
            {t("developers.title", "Developers")}
          </h1>
          <p className="text-lg text-gray-300 dark:text-dark-text-secondary">
            {t(
              "developers.subtitle",
              `3DPswap is a decentralized exchange built on 3DPass (The Ledger of Things) blockchain, 
               which is both EVM and Substrate compatible. The app is operating under Uniswap V2 protocol rules.`
            )}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* API Documentation */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.api.title", "EVM Solidity Interface")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("developers.api.description", "Smart contract precompiles to integrate with 3DPswap.")}
            </p>
            <div className="space-y-3">
              <a
                href="https://github.com/3Dpass/3DP/blob/main/precompiles/assets-conversion/LiquidityProvider.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.api.evm.title", "Liquidity Provider")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.api.evm.description", "0x0000000000000000000000000000000000000902")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/3DP/blob/main/precompiles/assets-conversion/Pairs.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.api.substrate.title", "Pairs")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.api.substrate.description", "0x0000000000000000000000000000000000000902")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/3DP/blob/main/precompiles/assets-conversion/Swap.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.api.substrate.title", "Swap")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.api.substrate.description", "0x0000000000000000000000000000000000000902")}
                </p>
              </a>
            </div>
          </div>

          {/* Development Resources */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.resources.title", "Development Resources")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("developers.resources.description", "Tools and resources to help you build on 3DPswap.")}
            </p>
            <div className="space-y-3">
              <a
                href="https://github.com/3Dpass/swap"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.resources.github.title", "GitHub Repository")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.resources.github.description", "Source code and contribution guidelines")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/3DP/tree/main/pallets/asset-conversion"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.resources.chain.title", "Assets Conversion Module")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.resources.chain.description", "Core blockchain runtime implementation")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/3DP/tree/main/precompiles/assets-conversion"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.resources.chain.title", "EVM")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.resources.chain.description", "3DPswap EVM precompile implementation")}
                </p>
              </a>
            </div>
          </div>

          {/* Getting Started */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.gettingStarted.title", "Substrate API")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("developers.gettingStarted.description", "Assets Conversion module RPC API.")}
            </p>
            <div className="space-y-3">
              <a
                href="https://github.com/3Dpass/swap/blob/main/ASSET_CONVERSION_PALLET.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.issues.title", "API documentation")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.issues.description", "Aassets conversion module RPC API")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/swap/blob/main/ASSET_CONVERSION_PALLET.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.issues.title", "Code examples")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.issues.description", "JavaScript code examples")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/3DP/wiki/3DPass-Node-interaction"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.issues.title", "3DPass Node Interaction")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.issues.description", "General guidance")}
                </p>
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.support.title", "Cross-platform 3DPRC-2 assets")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t(
                "developers.support.description",
                `3DPswap supports 3DPRC-2 share assests as well as conventional fungible 3DPRC20 tokens.`
              )}
            </p>
            <div className="space-y-3">
              <a
                href="https://3dpass.org/assets#3dprc-2"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.issues.title", "3DPRC-2 standard")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.issues.description", "Tokenized object shares")}
                </p>
              </a>
              <a
                href="https://3dpass.org/assets#conventional-fungible-assets"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.issues.title", "Fungible assets via poscanAssets")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.issues.description", "Local assets interaction over Substrate RPC API")}
                </p>
              </a>
              <a
                href="https://3dpass.org/assets#smart-contracts-solidity-assets"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.discussions.title", "EVM Interaction")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.discussions.description", "Learn how to interact with P3D and local assets")}
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopersPage;
