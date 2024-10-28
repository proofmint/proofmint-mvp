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
      options: { projectId: "aec03fcba586a369f9fc352dfa5a88a9" },
    },
    {
      id: WalletId.LUTE,
      options: { siteName: "ProofMint" },
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
