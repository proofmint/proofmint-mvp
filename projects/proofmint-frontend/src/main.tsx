import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NetworkId, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-react";

const walletManager = new WalletManager({
  wallets: [
    WalletId.DEFLY,
    WalletId.PERA,
    WalletId.EXODUS,
    {
      id: WalletId.WALLETCONNECT,
      options: { projectId: "2acd95086e53e4a7cc9c4880b68190dc" },
    },
    {
      id: WalletId.LUTE,
      options: { siteName: "POMA MVP" },
    },
  ],
  network: NetworkId.TESTNET,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
