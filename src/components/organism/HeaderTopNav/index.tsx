import classNames from "classnames";
import { NavLink, useLocation } from "react-router-dom";
import { POOLS_ROUTE, SWAP_ROUTE } from "../../../app/router/routes.ts";
import AccountImage from "../../../assets/img/account-image-icon.svg?react";
import Logo from "../../../assets/img/3dpswap-logo.svg?react";
import { ActionType, ButtonVariants, NetworkKeys, WalletConnectSteps } from "../../../app/types/enum.ts";
import { reduceAddress } from "../../../app/util/helper";
import {
  connectWalletAndFetchBalance,
  getSupportedWallets,
  handleDisconnect,
} from "../../../services/polkadotWalletServices";
import { useAppContext } from "../../../state";
import Button from "../../atom/Button/index.tsx";
import { t } from "i18next";
import { useEffect, useState } from "react";
import WalletConnectModal from "../WalletConnectModal/index.tsx";
import LocalStorage from "../../../app/util/localStorage.ts";
import { ModalStepProps } from "../../../app/types/index.ts";
import type { Timeout } from "react-number-format/types/types";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import dotAcpToast from "../../../app/util/toast.ts";
import { LottieSmall } from "../../../assets/loader/index.tsx";
import useClickOutside from "../../../app/hooks/useClickOutside.ts";

const HeaderTopNav = () => {
  const { state, dispatch } = useAppContext();
  const { walletConnectLoading, api } = state;
  const location = useLocation();

  const [walletAccount, setWalletAccount] = useState<WalletAccount>({} as WalletAccount);
  const [modalStep, setModalStep] = useState<ModalStepProps>({ step: WalletConnectSteps.stepExtensions });
  const [walletConnectOpen, setWalletConnectOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([] as Wallet[]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileMenuRef = useClickOutside(() => setMobileMenuOpen(false));
  const walletConnected = LocalStorage.get("wallet-connected");

  const connectWallet = () => {
    setWalletConnectOpen(true);
  };

  const handleConnect = async (account: WalletAccount) => {
    try {
      setWalletConnectOpen(false);
      await connectWalletAndFetchBalance(dispatch, api, account);
    } catch (error) {
      dotAcpToast.error(`Error connecting: ${error}`);
    }
  };

  const onBack = () => {
    setModalStep({ step: WalletConnectSteps.stepExtensions });
  };

  const disconnectWallet = () => {
    handleDisconnect(dispatch);
    setWalletAccount({} as WalletAccount);
    setModalStep({ step: WalletConnectSteps.stepExtensions });
    dispatch({
      type: ActionType.SET_SWAP_GAS_FEES_MESSAGE,
      payload: "",
    });
    dispatch({
      type: ActionType.SET_SWAP_GAS_FEE,
      payload: "",
    });
  };

  useEffect(() => {
    if (walletConnected) {
      setWalletAccount(walletConnected);
    }
  }, [walletConnected?.address]);

  useEffect(() => {
    let timeout: Timeout;
    if (!walletConnectOpen) {
      timeout = setTimeout(() => setModalStep({ step: WalletConnectSteps.stepExtensions }), 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [walletConnectOpen]);

  useEffect(() => {
    const wallets = getSupportedWallets();
    setSupportedWallets(wallets);
  }, []);

  const WalletButton = () => {
    if (walletConnectLoading) {
      return (
        <Button
          onClick={connectWallet}
          variant={ButtonVariants.btnPrimaryPinkSm}
          disabled={walletConnectLoading}
          className="min-w-[110px] sm:min-w-[130px]"
        >
          <LottieSmall />
        </Button>
      );
    }

    if (walletConnected) {
      return (
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex flex-col text-gray-300 items-end">
            <div className="font-[500] text-sm sm:text-base">{walletAccount?.name || "Account"}</div>
            <div className="text-[10px] sm:text-small">{reduceAddress(walletAccount?.address, 6, 6)}</div>
          </div>
          <button onClick={() => disconnectWallet()} className="p-1 hover:opacity-80 transition-opacity">
            <AccountImage className="w-8 h-8 sm:w-9 sm:h-9" />
          </button>
        </div>
      );
    }

    return (
      <Button 
        onClick={connectWallet} 
        variant={ButtonVariants.btnPrimaryPinkSm} 
        disabled={walletConnectLoading}
        className="min-w-[110px] sm:min-w-[130px]"
      >
        {t("button.connectWallet")}
      </Button>
    );
  };

  return (
    <>
      <nav className="flex h-[60px] sm:h-[70px] items-center justify-between px-4 sm:px-6 lg:px-10 relative">
        {/* Logo - fixed size, no distortion */}
        <div className="flex-shrink-0">
          <Logo className="w-[110px] sm:w-[130px] lg:w-[150px] h-auto" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 lg:gap-12 xl:gap-16 text-gray-200">
          <NavLink
            to={SWAP_ROUTE}
            className={classNames("font-unbounded-variable text-base lg:text-lg tracking-[.96px] hover:text-gray-400 transition-colors", {
              "text-gray-400": location.pathname.includes(SWAP_ROUTE),
            })}
          >
            {t("button.swap")}
          </NavLink>
          <NavLink
            to={POOLS_ROUTE}
            className={classNames("font-unbounded-variable text-base lg:text-lg tracking-[.96px] hover:text-gray-400 transition-colors", {
              "text-gray-400": location.pathname.includes(POOLS_ROUTE),
            })}
          >
            {t("button.pool")}
          </NavLink>
        </div>

        {/* Desktop Wallet Button */}
        <div className="hidden md:flex items-center">
          <WalletButton />
        </div>

        {/* Mobile Menu Button and Wallet */}
        <div className="flex md:hidden items-center gap-2">
          <WalletButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-200 hover:text-gray-400 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-50 shadow-xl md:hidden z-50"
          >
            <div className="flex flex-col p-4 gap-2">
              <NavLink
                to={SWAP_ROUTE}
                onClick={() => setMobileMenuOpen(false)}
                className={classNames("font-unbounded-variable text-base py-3 px-4 rounded-lg transition-colors", {
                  "text-white bg-pink": location.pathname.includes(SWAP_ROUTE),
                  "text-black hover:bg-gray-50": !location.pathname.includes(SWAP_ROUTE),
                })}
              >
                {t("button.swap")}
              </NavLink>
              <NavLink
                to={POOLS_ROUTE}
                onClick={() => setMobileMenuOpen(false)}
                className={classNames("font-unbounded-variable text-base py-3 px-4 rounded-lg transition-colors", {
                  "text-white bg-pink": location.pathname.includes(POOLS_ROUTE),
                  "text-black hover:bg-gray-50": !location.pathname.includes(POOLS_ROUTE),
                })}
              >
                {t("button.pool")}
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      <WalletConnectModal
        title="Connect a Wallet"
        open={walletConnectOpen}
        onClose={() => setWalletConnectOpen(false)}
        onBack={modalStep.step === WalletConnectSteps.stepAddresses ? onBack : undefined}
        modalStep={modalStep}
        setModalStep={setModalStep}
        setWalletConnectOpen={setWalletConnectOpen}
        supportedWallets={supportedWallets}
        handleConnect={handleConnect}
      />
    </>
  );
};

export default HeaderTopNav;