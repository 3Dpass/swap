import { t } from "i18next";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
        <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2 text-center">
            {/* Mobile: Stack links vertically */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 text-sm">
              <a 
                href="https://github.com/3Dpass/swap" 
                rel="noopener noreferrer" 
                target="_blank"
                className="text-gray-600 hover:text-pink transition-colors font-medium"
              >
                GitHub
              </a>
              <span className="hidden sm:inline-block mx-3 text-gray-300">|</span>
              
              <a 
                href="https://github.com/3Dpass/3DP/wiki/DEX-module-API" 
                rel="noopener noreferrer" 
                target="_blank"
                className="text-gray-600 hover:text-pink transition-colors font-medium"
              >
                DEX Module API
              </a>
              <span className="hidden sm:inline-block mx-3 text-gray-300">|</span>
              
              <a 
                href="https://play.google.com/store/apps/details?id=com.threedpass.wallet" 
                rel="noopener noreferrer" 
                target="_blank"
                className="text-gray-600 hover:text-pink transition-colors font-medium"
              >
                Android Wallet
              </a>
            </div>
            
            {/* Powered by section */}
            <div className="flex items-center gap-1 text-sm">
              <span className="hidden sm:inline-block mx-3 text-gray-300">|</span>
              <span className="text-gray-500">{t("footer.poweredBy")}</span>
              <a 
                href="https://mvpworkshop.co/" 
                rel="noopener noreferrer" 
                target="_blank"
                className="text-gray-600 hover:text-pink transition-colors font-medium"
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
