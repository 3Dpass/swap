import { t } from "i18next";

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="px-4 py-6 sm:px-6 sm:py-4 lg:px-10">
        <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-2">
          {/* Mobile: Stack links vertically */}
          <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:gap-0">
            <a
              href="https://github.com/3Dpass/swap"
              rel="noopener noreferrer"
              target="_blank"
              className="font-medium text-gray-600 transition-colors hover:text-pink"
            >
              GitHub
            </a>
            <span className="mx-3 hidden text-gray-300 sm:inline-block">|</span>

            <a
              href="https://github.com/3Dpass/swap/blob/main/ASSET_CONVERSION_PALLET.md"
              rel="noopener noreferrer"
              target="_blank"
              className="font-medium text-gray-600 transition-colors hover:text-pink"
            >
              Substrate RPC API
            </a>
            <span className="mx-3 hidden text-gray-300 sm:inline-block">|</span>
            <a
              href="https://github.com/3Dpass/3DP/tree/main/precompiles/assets-conversion"
              rel="noopener noreferrer"
              target="_blank"
              className="font-medium text-gray-600 transition-colors hover:text-pink"
            >
              EVM Solidity interface
            </a>
            <span className="mx-3 hidden text-gray-300 sm:inline-block">|</span>
          </div>

          {/* Powered by section */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">{t("footer.poweredBy")}</span>
            <a
              href="https://mvpworkshop.co/"
              rel="noopener noreferrer"
              target="_blank"
              className="font-medium text-gray-600 transition-colors hover:text-pink"
            >
              {t("footer.company")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
