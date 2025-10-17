import type { WalletAccount } from "@talismn/connect-wallets";
import { FC, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import useStateAndDispatch from "./app/hooks/useStateAndDispatch";
import router from "./app/router";
import LocalStorage from "./app/util/localStorage";
import { connectWalletAndFetchBalance } from "./services/polkadotWalletServices";
import { createPoolCardsArray } from "./services/poolServices";
import { initializeBlockTimeTracking } from "./services/blockTimeService";
import { AppStateProvider } from "./state";
import { ThemeProvider } from "./app/contexts/ThemeContext";

const App: FC = () => {
  const { dispatch, state } = useStateAndDispatch();
  const { api, pools, selectedAccount } = state;

  const walletConnected: WalletAccount = LocalStorage.get("wallet-connected");

  useEffect(() => {
    if (walletConnected && api) {
      connectWalletAndFetchBalance(dispatch, api, walletConnected, false).then();
    }
  }, [api]);

  useEffect(() => {
    // Initialize block time tracking when API is ready
    if (api) {
      initializeBlockTimeTracking().catch(() => {
        // Initialization failure is not critical for app functionality
      });
    }
  }, [api]);

  useEffect(() => {
    const updatePoolsCards = async () => {
      if (api && pools.length) await createPoolCardsArray(api, dispatch, pools, selectedAccount);
    };

    updatePoolsCards().then();
  }, [pools, selectedAccount]);

  return (
    <ThemeProvider>
      <AppStateProvider state={state} dispatch={dispatch}>
        <RouterProvider router={router} />
      </AppStateProvider>
    </ThemeProvider>
  );
};

export default App;
