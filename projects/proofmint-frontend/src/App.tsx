import { HashRouter as Router, Route, Routes, NavLink } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import { Header } from "./components/Header";
import { useState } from "react";
import { Home } from "./pages/Home";
import { useEffect } from "react";
import { getUserDetails } from "./utils/index";
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
    }
  }, [activeWallet, activeAccount]);

  return (
    <>
      <Router>
        <Header
          wallets={wallets}
          transactionSigner={transactionSigner}
          activeAccount={activeAccount}
          isConnected={isConnected}
          role={role}
        />
        <div className="mainWrapper">
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </main>
        </div>
      </Router>
    </>
  );
};

export default App;
