import classNames from "classnames";
import { NavLink, useLocation } from "react-router-dom";
import { POOLS_ROUTE, SWAP_ROUTE } from "../../../app/router/routes.ts";
import AccountImage from "../../../assets/img/account-image-icon.svg?react";
import Logo from "../../../assets/img/3dpswap-logo.svg?react";
import { ActionType, ButtonVariants, WalletConnectSteps } from "../../../app/types/enum.ts";
import { reduceAddress } from "../../../app/util/helper";
import {
  connectWalletAndFetchBalance,
  getSupportedWallets,
  handleDisconnect,
} from "../../../services/polkadotWalletServices";
import { type UnifiedWalletAccount } from "../../../services/metamaskServices";
import { useAppContext } from "../../../state";
import Button from "../../atom/Button/index.tsx";
import { t } from "i18next";
import { useEffect, useState, useRef } from "react";
import WalletConnectModal from "../WalletConnectModal/index.tsx";
import LocalStorage from "../../../app/util/localStorage.ts";
import { ModalStepProps } from "../../../app/types/index.ts";
import type { Timeout } from "react-number-format/types/types";
import type { Wallet, WalletAccount } from "@talismn/connect-wallets";
import dotAcpToast from "../../../app/util/toast.ts";
import { LottieSmall } from "../../../assets/loader/index.tsx";
import useClickOutside from "../../../app/hooks/useClickOutside.ts";
import useGetNetwork from "../../../app/hooks/useGetNetwork.ts";

const HeaderTopNav = () => {
  const { state, dispatch } = useAppContext();
  const { walletConnectLoading, api } = state;
  const location = useLocation();
  const { ss58Format } = useGetNetwork();

  const [walletAccount, setWalletAccount] = useState<WalletAccount>({} as WalletAccount);
  const [modalStep, setModalStep] = useState<ModalStepProps>({ step: WalletConnectSteps.stepExtensions });
  const [walletConnectOpen, setWalletConnectOpen] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([] as Wallet[]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(mobileMenuRef, () => setMobileMenuOpen(false));
  const walletConnected = LocalStorage.get("wallet-connected");

  const connectWallet = () => {
    setWalletConnectOpen(true);
  };

  const handleConnect = async (account: UnifiedWalletAccount) => {
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
    if (walletConnected && walletConnected.address) {
      setWalletAccount(walletConnected);
    } else if (walletConnected && !walletConnected.address) {
      // Clear invalid wallet data from localStorage
      LocalStorage.remove("wallet-connected");
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

    if (walletConnected && walletAccount?.address) {
      return (
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden flex-col items-end text-gray-300 sm:flex">
            <div className="text-sm font-[500] sm:text-base">{walletAccount?.name || "Account"}</div>
            <div className="text-[10px] sm:text-small">{reduceAddress(walletAccount?.address, 6, 6, ss58Format)}</div>
          </div>
          <button onClick={() => disconnectWallet()} className="p-1 transition-opacity hover:opacity-80">
            <AccountImage className="h-8 w-8 sm:h-9 sm:w-9" />
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
      <nav className="relative flex h-[60px] items-center justify-between px-2 py-3 sm:h-[70px] sm:px-6 sm:py-4 lg:h-[80px] lg:px-10 lg:py-5">
        {/* Logo - fixed size, no distortion */}
        <div className="flex-shrink-0">
          <Logo className="h-auto w-[100px] sm:w-[120px] lg:w-[150px]" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden gap-6 text-gray-200 md:flex lg:gap-12 xl:gap-16">
          <NavLink
            to={SWAP_ROUTE}
            className={classNames(
              "font-unbounded-variable text-base tracking-[.96px] transition-colors hover:text-gray-400 lg:text-lg",
              {
                "text-gray-400": location.pathname.includes(SWAP_ROUTE),
              }
            )}
          >
            {t("button.swap")}
          </NavLink>
          <NavLink
            to={POOLS_ROUTE}
            className={classNames(
              "font-unbounded-variable text-base tracking-[.96px] transition-colors hover:text-gray-400 lg:text-lg",
              {
                "text-gray-400": location.pathname.includes(POOLS_ROUTE),
              }
            )}
          >
            {t("button.pool")}
          </NavLink>
        </div>

        {/* Desktop Wallet Button */}
        <div className="hidden items-center md:flex">
          <WalletButton />
        </div>

        {/* Mobile Menu Button and Wallet */}
        <div className="flex items-center gap-2 md:hidden">
          <WalletButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-200 transition-colors hover:text-gray-400"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="absolute left-0 right-0 top-full z-50 border-t border-gray-50 bg-white shadow-xl md:hidden"
          >
            <div className="flex flex-col gap-2 p-2">
              <NavLink
                to={SWAP_ROUTE}
                onClick={() => setMobileMenuOpen(false)}
                className={classNames("rounded-lg px-4 py-3 font-unbounded-variable text-base transition-colors", {
                  "bg-pink text-white": location.pathname.includes(SWAP_ROUTE),
                  "text-black hover:bg-gray-50": !location.pathname.includes(SWAP_ROUTE),
                })}
              >
                {t("button.swap")}
              </NavLink>
              <NavLink
                to={POOLS_ROUTE}
                onClick={() => setMobileMenuOpen(false)}
                className={classNames("rounded-lg px-4 py-3 font-unbounded-variable text-base transition-colors", {
                  "bg-pink text-white": location.pathname.includes(POOLS_ROUTE),
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
