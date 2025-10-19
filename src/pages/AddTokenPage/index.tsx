import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { POOLS_PAGE } from "../../app/router/routes";

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
              {t("addToken.requirements.description", "Requirements for adding a new token.")}
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.requirements.standard.title", "Token Standard")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.requirements.standard.description", "Must be local 3DPRC-2 asset from poscanAssets")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.requirements.liquidity.title", "EVM compatibility")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.requirements.liquidity.description", "Every local 3DPRC-2 token is compatible with EVM")}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-border-primary dark:bg-dark-bg-primary">
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.requirements.verification.title", "Verification")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.requirements.verification.description", "Token must have positive Total Supply")}
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
              <a
                href="https://wallet.3dpass.org/assets/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.contact.proposal.title", "1. Create a new 3DPRC-2 asset")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.contact.proposal.description", "Skip this step for exisitng ones")}
                </p>
              </a>
              <Link
                to={POOLS_PAGE}
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.contact.proposal.title", "2. Create a Liquidity Pool")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.contact.proposal.description", "Add New Position over the Pools section")}
                </p>
              </Link>
              <Link
                to={POOLS_PAGE}
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.contact.proposal.title", "3. Add Liquidity to the Pool")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.contact.proposal.description", "Use the Deposit button to add liquidity to the pool")}
                </p>
              </Link>
              <a
                href="https://github.com/3Dpass/swap?tab=readme-ov-file#adding-token-icons"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-dark-border-primary dark:bg-dark-bg-primary dark:hover:border-dark-border-secondary dark:hover:bg-dark-bg-secondary"
              >
                <h3 className="font-medium text-gray-400 dark:text-dark-text-primary">
                  {t("addToken.contact.proposal.title", "4. Add the Token Icon")}
                </h3>
                <p className="mt-1 text-sm text-gray-300 dark:text-dark-text-secondary">
                  {t("addToken.contact.proposal.description", "Submit Pull request to the Github repository")}
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTokenPage;
