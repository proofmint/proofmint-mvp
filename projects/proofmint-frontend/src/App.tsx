import { HashRouter as Router, Route, Routes, NavLink } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import { Header } from "./components/Header";
import { useState } from "react";
import { Home } from "./pages/Home";
import { Mint } from "./pages/Mint";
import { useEffect } from "react";
import { getUserDetails } from "./utils/index";
import { MyNfts } from "./pages/MyNfts";
import { Issued } from "./pages/Issued";
let globalCount = 0;
const App = () => {
  const { wallets, activeWallet, activeAccount, transactionSigner } = useWallet();
  const [isConnected, setIsConnected] = useState(false);
  const [role, setRole] = useState<string>("guest");
  const [user, setUser] = useState<{ role: string; name: string; year: string; email: string; contact: string } | null>(null);
  useEffect(() => {
    async function checkUser(address: string) {
      const user = await getUserDetails(address);
      if (user) {
        setRole(user.role);
        setUser(user);
      } else {
        setRole("noregister");
        setUser(null);
      }
    }

    if (activeWallet && activeAccount) {
      console.log(activeAccount.address, activeWallet.name);
      setIsConnected(true);
      checkUser(activeAccount.address);
    } else {
      setIsConnected(false);
      setRole("guest");
      setUser(null);
    }
  }, [activeWallet, activeAccount]);

  function createToast(msg: string, url?: string) {
    const toastId = `liveToast${globalCount}`;
    const mtoastId = `mliveToast${globalCount}`;
    const toastTemplate = (id: string, isMobile: boolean) => {
      const toastElement = document.createElement("div");
      toastElement.id = id;
      toastElement.className = "toast fade show";
      toastElement.setAttribute("role", "alert");
      toastElement.setAttribute("aria-live", "assertive");
      toastElement.setAttribute("aria-atomic", "true");
      if (url) {
        toastElement.onclick = () => window.open(url, "_blank");
      }

      toastElement.innerHTML = `
        <div style="background-color: #000000; color: #ffffff;" class="toast-header">
          <img src="./images/ProofMintLogo.png" style="height: 20px; width: auto;" class="rounded me-2" alt="...">
          <strong class="me-auto">>></strong>
          <small>Just Now</small>
          <button style="color: white !important;" type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div id="${isMobile ? "mbo" : "bo"}${globalCount}" class="toast-body">${msg}</div>
      `;

      return toastElement;
    };

    const contoastElement = document.getElementById("contoast");
    const mcontoastElement = document.getElementById("mcontoast");

    // Append toast to desktop container
    if (contoastElement) {
      const toast = toastTemplate(toastId, false);
      contoastElement.appendChild(toast);
      showToast(toastId);
    }

    // Append toast to mobile container
    if (mcontoastElement) {
      const mtoast = toastTemplate(mtoastId, true);
      mcontoastElement.appendChild(mtoast);
      showToast(mtoastId);
    }

    globalCount++;

    function showToast(id: string) {
      const toastElement = document.getElementById(id);
      if (toastElement) {
        toastElement.classList.add("fade", "show");

        // Set up the fade-out removal after 8 seconds
        setTimeout(() => {
          toastElement.classList.remove("show");

          // Remove the toast when the fade-out transition ends
          toastElement.addEventListener(
            "transitionend",
            () => {
              toastElement.remove();
            },
            { once: true }
          );
        }, 8000);
      }
    }
  }

  return (
    <>
      <Router>
        <Header
          wallets={wallets}
          transactionSigner={transactionSigner}
          activeAccount={activeAccount}
          isConnected={isConnected}
          role={role}
          createToast={createToast}
        />
        <div className="mainWrapper">
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/mint"
                element={
                  <Mint
                    createToast={createToast}
                    transactionSigner={transactionSigner}
                    activeAccount={activeAccount}
                    isConnected={isConnected}
                    role={role}
                  />
                }
              />
              <Route
                path="/issued"
                element={<Issued createToast={createToast} activeAccount={activeAccount} isConnected={isConnected} role={role} />}
              />
              <Route
                path="/mynfts"
                element={<MyNfts createToast={createToast} activeAccount={activeAccount} transactionSigner={transactionSigner} />}
              />
            </Routes>
          </main>
        </div>
      </Router>
      <div style={{ zIndex: 999999 }} id="mcontoast" data-count="0" className="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="mliveToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div style={{ backgroundColor: "#000000", color: "#ffffff" }} className="toast-header">
            <img src="static/nftfiers-removebg-preview.png" style={{ height: "20px", width: "auto" }} className="rounded me-2" alt="..." />
            <small>Just Now</small>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div id="mbo" className="toast-body"></div>
        </div>
      </div>
      <div style={{ zIndex: 999999 }} id="contoast" data-count="0" className="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="liveToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header">
            <img src="static/nftfiers-removebg-preview.png" className="rounded me-2" alt="..." />
            <strong className="me-auto">Admin</strong>
            <small>Just Now</small>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div id="bo" className="toast-body"></div>
        </div>
      </div>
    </>
  );
};

export default App;
