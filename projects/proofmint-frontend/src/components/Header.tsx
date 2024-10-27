import { Wallet, WalletAccount } from "@txnlab/use-wallet-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { algorandClient, Caller } from "../utils";
import algosdk, { Transaction } from "algosdk";

export const Header = ({
  role,
  isConnected,
  wallets,
  activeAccount,
  transactionSigner,
}: {
  role: string;
  isConnected: boolean;
  wallets: Wallet[];
  activeAccount: WalletAccount | null;
  transactionSigner: (txnGroup: Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>;
}) => {
  const [affiliation, setAffiliation] = useState("");
  const [name, setName] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [isLoading, setIsLoading] = useState("false");

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      if (activeAccount) {
        e.preventDefault();
        setIsLoading("true");
        console.log(affiliation, name, establishedYear, email, contactNo);
        const year = affiliation === "student" ? "" : establishedYear;
        const group = await Caller.compose()
          .registerAccount(
            { role: affiliation, name, year, email, contact: contactNo },
            {
              boxes: [{ appIndex: 0, name: algosdk.decodeAddress(activeAccount.address).publicKey }],
              sender: { addr: activeAccount.address, signer: transactionSigner },
            }
          )
          .atc();

        setIsLoading("sign");
        createToast("Please Sign the Transaction in your Wallet");
        await group.gatherSignatures();
        setIsLoading("submit");
        await group.execute(algorandClient.client.algod, 3);
        setIsLoading("false");
        window.location.reload();
      } else {
        createToast("Please Connect your Wallet");
      }
    } catch (e: any) {
      console.log(e);
      setIsLoading("false");
      createToast(`Error Occured: ${e.message}`);
    }
  };
  const closeoffcanvas = async () => {
    document.getElementById("closeoff")?.click();
    if (isConnected && activeAccount) {
      for (let i = 0; i < wallets.length; i++) {
        await wallets[i].disconnect();
      }
    } else {
      document.getElementById("LoginModalOpen")?.click();
    }
  };
  const handleWalletClick = async (wallet: Wallet) => {
    if (wallet.isConnected) {
      wallet.setActive();
    } else {
      try {
        const account = await wallet.connect();
        console.log(account);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.log(e);
      }
    }
  };

  function createToast(msg: string, url?: string) {
    const count = parseInt(document.getElementById("contoast")?.getAttribute("data-count") || "0");
    const toastId = `liveToast${count}`;
    const mtoastId = `mliveToast${count}`;

    const toastTemplate = (id: string, isMobile: boolean) => `
      <div ${
        url ? `onclick="window.open('${url}','_blank')"` : ``
      } id="${id}" data-bs-autohide="false" data-bs-animation="true" data-bs-delay="2000" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div style="background-color: #000000; color: #ffffff;" class="toast-header">
          <img src="./images/ProofMintLogo.png" style="height: 20px; width: auto;" class="rounded me-2" alt="...">
          <strong class="me-auto">>></strong>
          <small>Just Now</small>
          <button style="color: white !important;" type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div id="${isMobile ? "mbo" : "bo"}${count}" class="toast-body">${msg}</div>
      </div>`;

    const contoastElement = document.getElementById("contoast");
    const mcontoastElement = document.getElementById("mcontoast");

    if (contoastElement) {
      contoastElement.innerHTML += toastTemplate(toastId, false);
      contoastElement.setAttribute("data-count", (count + 1).toString());
    }

    if (mcontoastElement) {
      mcontoastElement.innerHTML += toastTemplate(mtoastId, true);
    }

    const showToast = (id: string) => {
      const toastElement = document.getElementById(id);
      if (toastElement) {
        toastElement.classList.add("fade", "show");
        setTimeout(() => {
          toastElement.classList.remove("show");
        }, 8000);
      }
    };

    showToast(toastId);
    showToast(mtoastId);
  }

  useEffect(() => {
    if (activeAccount && isConnected) {
      document.getElementById("LoginModalClose")?.click();
    }
  }, [isConnected, activeAccount]);

  useEffect(() => {
    if (role && isConnected) {
      console.log(role, "role");
      if (role === "noregister") {
        document.getElementById("RegisterModalOpen")?.click();
      }
    }
  }, [role, isConnected]);
  return (
    <>
      <nav className="navbar navbar-expand-lg sticky-lg-top" style={{ backgroundColor: "#1C1038" }}>
        <div className="container">
          <NavLink to={"/"}>
            <img src="./images/ProofMintLogo.png" alt="logo" className="nav-logo" width="200px" style={{ marginLeft: "10px" }} />
          </NavLink>
          <button
            className="navbar-toggler bg-light"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasRight"
            aria-controls="offcanvasRight"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div className="container" id="navbarmenu">
            <div className="collapse navbar-collapse navbar-expand-lg" id="menu">
              <ul className="navbar-nav text-light">
                <li className="nav-item">
                  <NavLink className="nav-link active" aria-current="page" style={{ textDecorationLine: "overline" }} to="/">
                    Home
                  </NavLink>
                </li>
                {role === "noregister" ||
                  (role === "guest" && (
                    <li className="nav-item">
                      <a className="nav-link active" aria-current="page" href="##about">
                        About us
                      </a>
                    </li>
                  ))}

                {role !== "noregister" && role !== "guest" && role !== "student" && (
                  <>
                    <li className="nav-item">
                      <NavLink className="nav-link active" aria-current="page" to="/mint">
                        Mint
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link active" aria-current="page" to="/issued">
                        Issued
                      </NavLink>
                    </li>
                  </>
                )}

                {role === "student" && (
                  <>
                    <li className="nav-item">
                      <NavLink className="nav-link active" aria-current="page" to="/mynfts">
                        My NFTs
                      </NavLink>
                    </li>
                  </>
                )}

                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdownMenuLink"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Contact us
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fa-solid fa-phone fa-shake"></i>
                        <span>Phone</span>
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fa-solid fa-envelope"></i>
                        <span>Email</span>
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fa-brands fa-whatsapp"></i>
                        <span>Whatsapp</span>
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
              <div className="social">
                <a href="#">
                  <i className="fa-brands fa-instagram fa-xl" style={{ color: "white" }}></i>
                </a>
                <a href="#">
                  <i className="fa-brands fa-facebook fa-lg" style={{ color: "white" }}></i>
                </a>
                <a href="#">
                  <i className="fa-brands fa-linkedin fa-lg" style={{ color: "white" }}></i>
                </a>
                <a href="#">
                  <i className="fa-brands fa-github fa-lg" style={{ color: "white" }}></i>
                </a>
              </div>
              <div className="sign-in">
                <button id="logee" className="login">
                  <a id="LoginModalOpen" style={{ display: "none" }} href="#LoginModal" data-bs-toggle="modal"></a>
                  <a onClick={closeoffcanvas}>
                    {isConnected && activeAccount
                      ? `Disconnect from [${activeAccount.address.slice(0, 3)}...${activeAccount.address.slice(-3)}]`
                      : "Connect Wallet"}
                    <i
                      className="fa-solid fa-right-to-bracket fa-beat fa-sm"
                      style={{ color: "white", marginTop: "6px", marginLeft: "10px" }}
                    ></i>
                  </a>
                </button>
              </div>
            </div>
          </div>

          {/* <!--offcanvas--> */}
          <div className="offcanvas offcanvas-end" tabIndex={-1} id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header">
              <button type="button" id="closeoff" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="/" style={{ textDecorationLine: "overline", color: "black" }}>
                    Home
                  </a>
                </li>
                {role === "noregister" ||
                  (role === "guest" && (
                    <li className="nav-item">
                      <a className="nav-link active" aria-current="page" href="##about">
                        About us
                      </a>
                    </li>
                  ))}

                {role !== "noregister" && role !== "guest" && role !== "student" && (
                  <>
                    <li className="nav-item">
                      <NavLink className="nav-link active" aria-current="page" to="/mint">
                        Mint
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link active" aria-current="page" to="/issued">
                        Issued
                      </NavLink>
                    </li>
                  </>
                )}

                {role === "student" && (
                  <>
                    <li className="nav-item">
                      <NavLink className="nav-link active" aria-current="page" to="/mynfts">
                        My NFTs
                      </NavLink>
                    </li>
                  </>
                )}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdownMenuLink"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ color: "black" }}
                  >
                    Contact us
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fa-solid fa-phone fa-shake"></i>
                        <span>Phone</span>
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fa-solid fa-envelope"></i>
                        <span>Email</span>
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">
                        <i className="fa-brands fa-whatsapp"></i>
                        <span>Whatsapp</span>
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
              <div className="socialicons">
                <a href="#">
                  <i className="fa-brands fa-instagram fa-xl" style={{ color: "black" }}></i>
                </a>
                <a href="#">
                  <i className="fa-brands fa-facebook fa-xl" style={{ color: "black" }}></i>
                </a>
                <a href="#">
                  <i className="fa-brands fa-linkedin fa-xl" style={{ color: "black" }}></i>
                </a>
                <a href="#">
                  <i className="fa-brands fa-github fa-xl" style={{ color: "black" }}></i>
                </a>
              </div>
              <div style={{ paddingLeft: "0px" }} className="sign-in">
                <button className="login" id="log">
                  <a onClick={closeoffcanvas}>
                    {isConnected && activeAccount
                      ? `Disconnect from [${activeAccount.address.slice(0, 3)}...${activeAccount.address.slice(-3)}]`
                      : "Connect Wallet"}
                    <i
                      className="fa-solid fa-right-to-bracket fa-beat fa-sm"
                      style={{ color: "white", marginTop: "6px", marginLeft: "10px" }}
                    ></i>
                  </a>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div id="LoginModal" className="modal fade" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Connect Wallet</h4>
              <button id="LoginModalClose" type="button" className="btn-close reset" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }} id="alert-container">
                {wallets.map((wallet) => (
                  <div className="btn-group" role="group" aria-label="Basic outlined example">
                    <button onClick={(_) => handleWalletClick(wallet)} type="button" className="btn btn-outline-secondary">
                      {wallet.metadata.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <input type="reset" id="res" style={{ display: "none" }} />
          </div>
        </div>
      </div>

      <a id="RegisterModalOpen" style={{ display: "none" }} href="#RegisterModal" data-bs-toggle="modal"></a>
      <div id="RegisterModal" className="modal fade" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Register</h4>
              {/* <button id="RegisterModalClose" type="button" className="btn-close reset" data-bs-dismiss="modal" aria-label="Close"></button> */}
            </div>
            <div className="modal-body">
              <form autoComplete="true" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Which better describes your affiliation</label>
                  <div>
                    {["institution", "company", "doa", "community", "student"].map((option) => (
                      <div key={option} className="form-check">
                        <label className="form-check-label">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="affiliation"
                            value={option}
                            checked={affiliation === option}
                            onChange={(e) => setAffiliation(e.target.value)}
                            required
                          />
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label style={{ textTransform: "capitalize" }} className="form-label">
                    {affiliation === "student" ? "Name" : `${affiliation} Name`}
                  </label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                {affiliation !== "student" && (
                  <div className="mb-3">
                    <label className="form-label">Established Year</label>
                    <input
                      type="number"
                      className="form-control"
                      value={establishedYear}
                      onChange={(e) => setEstablishedYear(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="mb-3">
                  <label className="form-label">Contact No</label>
                  <input type="tel" className="form-control" value={contactNo} onChange={(e) => setContactNo(e.target.value)} required />
                </div>

                <button
                  style={{ backgroundColor: "#1C1038" }}
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading == "false" ? false : true}
                >
                  {isLoading != "false" ? (
                    <>
                      {isLoading == "sign" ? "Signing" : isLoading == "true" ? "Preparing" : "Submitting"}...{" "}
                      <span className="spinner-grow text-light spinner-grow-sm" role="status" aria-hidden="true"></span>
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </form>
            </div>
            <input type="reset" id="res" style={{ display: "none" }} />
          </div>
        </div>
        <div id="mcontoast" data-count="0" className="toast-container position-fixed bottom-0 end-0 p-3">
          <div id="mliveToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div style={{ backgroundColor: "#000000", color: "#ffffff" }} className="toast-header">
              <img
                src="static/nftfiers-removebg-preview.png"
                style={{ height: "20px", width: "auto" }}
                className="rounded me-2"
                alt="..."
              />
              <small>Just Now</small>
              <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div id="mbo" className="toast-body"></div>
          </div>
        </div>
        <div id="contoast" data-count="0" className="toast-container position-fixed bottom-0 end-0 p-3">
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
      </div>
    </>
  );
};

export default Header;
