import { FC } from "react";
import { useTranslation } from "react-i18next";

const AddTokenPage: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 py-4 dark:bg-dark-bg-primary sm:py-6 lg:py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-400 dark:text-dark-text-primary">
            {t("addToken.title", "Add a Token")}
          </h1>
          <p className="text-lg text-gray-300 dark:text-dark-text-secondary">
            {t("addToken.subtitle", "Learn how to add new tokens to 3DPswap")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Token Requirements */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("addToken.requirements.title", "Token Requirements")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("addToken.requirements.description", "Requirements for adding a new token to the platform.")}
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.requirements.standard.title", "Token Standard")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t(
                    "addToken.requirements.standard.description",
                    "Must be ERC-20 compatible or native Substrate asset"
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.requirements.liquidity.title", "Liquidity Requirements")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.requirements.liquidity.description", "Minimum liquidity threshold must be met")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.requirements.verification.title", "Verification")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.requirements.verification.description", "Token contract must be verified and audited")}
                </p>
              </div>
            </div>
          </div>

          {/* How to Add */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("addToken.howTo.title", "How to Add a Token")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("addToken.howTo.description", "Step-by-step process for adding new tokens.")}
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.howTo.step1.title", "1. Prepare Token Information")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t(
                    "addToken.howTo.step1.description",
                    "Gather token contract address, symbol, decimals, and metadata"
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.howTo.step2.title", "2. Submit Proposal")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.howTo.step2.description", "Create a governance proposal for token addition")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.howTo.step3.title", "3. Community Vote")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.howTo.step3.description", "Community votes on the token addition proposal")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.howTo.step4.title", "4. Implementation")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.howTo.step4.description", "Token is added to the platform after successful vote")}
                </p>
              </div>
            </div>
          </div>

          {/* Token Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("addToken.info.title", "Required Information")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("addToken.info.description", "Information needed to add a new token.")}
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.info.contract.title", "Contract Address")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.info.contract.description", "The smart contract address of the token")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.info.symbol.title", "Token Symbol")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.info.symbol.description", "The trading symbol for the token (e.g., USDT, ETH)")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.info.decimals.title", "Decimals")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.info.decimals.description", "Number of decimal places for the token")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.info.icon.title", "Token Icon")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.info.icon.description", "High-quality icon/logo for the token")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
              {t("addToken.contact.title", "Contact & Support")}
            </h2>
            <p className="mb-4 text-gray-300 dark:text-dark-text-secondary">
              {t("addToken.contact.description", "Get help with adding tokens to the platform.")}
            </p>
            <div className="space-y-3">
              <a
                href="https://github.com/3Dpass/swap/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.contact.proposal.title", "Submit Token Proposal")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.contact.proposal.description", "Create an issue for token addition request")}
                </p>
              </a>
              <a
                href="https://github.com/3Dpass/swap/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.contact.discussion.title", "Community Discussion")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.contact.discussion.description", "Discuss token addition with the community")}
                </p>
              </a>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm dark:border-dark-border-secondary dark:bg-dark-bg-tertiary dark:shadow-none">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-dark-text-primary">
                {t("addToken.notice.title", "Important Notice")}
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-dark-text-secondary">
                <p>
                  {t(
                    "addToken.notice.description",
                    "Adding tokens to 3DPswap requires community governance approval. All token additions are subject to review and voting by the community. Please ensure your token meets all requirements before submitting a proposal."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTokenPage;
