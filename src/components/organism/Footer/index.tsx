import { t } from "i18next";

const Footer = () => {
  return (
    <>
      <div className="flex-grow" />
      <footer className="bg-purple-200">
        <div className="relative flex items-center justify-center py-[9px]">
          <p className="text-tokens-label text-medium font-normal tracking-[0.20px] opacity-80">
            <a href="https://github.com/3Dpass/swap" rel="noopener noreferrer" target="_blank">
              <span className="text-purple-400 underline">GitHub</span>
            </a>
            &nbsp;|&nbsp;
            <a href="https://github.com/3Dpass/3DP/wiki/DEX-module-API" rel="noopener noreferrer" target="_blank">
              <span className="text-purple-400 underline">DEX Module API</span>
            </a>
            &nbsp;|&nbsp;
            <a href="https://play.google.com/store/apps/details?id=com.threedpass.wallet" rel="noopener noreferrer" target="_blank">
              <span className="text-purple-400 underline">Android Wallet</span>
            </a>
            &nbsp;|&nbsp;
            <span className="text-gray-400">{t("footer.poweredBy")}&nbsp;</span>
            <a href="https://mvpworkshop.co/" rel="noopener noreferrer" target="_blank">
              <span className="text-purple-400 underline">{t("footer.company")}</span>
            </a>
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
