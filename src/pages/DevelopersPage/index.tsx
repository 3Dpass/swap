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
            {t("developers.subtitle", "Resources and documentation for developers building on 3DPswap")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* API Documentation */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.api.title", "API Documentation")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("developers.api.description", "Access our comprehensive API documentation to integrate with 3DPswap.")}
            </p>
            <div className="space-y-3">
              <a
                href="https://github.com/3Dpass/3DP/tree/main/precompiles/assets-conversion"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.api.evm.title", "EVM Solidity Interface")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.api.evm.description", "Smart contract interfaces for EVM compatibility")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/swap/blob/main/ASSET_CONVERSION_PALLET.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.api.substrate.title", "Substrate RPC API")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.api.substrate.description", "Native Substrate RPC endpoints")}
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
                href="https://github.com/3Dpass/3DP"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.resources.chain.title", "3DP Chain")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.resources.chain.description", "Core blockchain implementation")}
                </p>
              </a>
            </div>
          </div>

          {/* Getting Started */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.gettingStarted.title", "Getting Started")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("developers.gettingStarted.description", "Quick start guide for developers.")}
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.gettingStarted.step1.title", "1. Set up Development Environment")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.gettingStarted.step1.description", "Install required tools and dependencies")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.gettingStarted.step2.title", "2. Connect to Network")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.gettingStarted.step2.description", "Configure connection to 3DP network")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.gettingStarted.step3.title", "3. Start Building")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.gettingStarted.step3.description", "Begin developing your application")}
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("developers.support.title", "Support & Community")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("developers.support.description", "Get help and connect with the developer community.")}
            </p>
            <div className="space-y-3">
              <a
                href="https://github.com/3Dpass/swap/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.issues.title", "Report Issues")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.issues.description", "Submit bugs and feature requests")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/swap/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("developers.support.discussions.title", "Community Discussions")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("developers.support.discussions.description", "Join developer discussions and Q&A")}
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
