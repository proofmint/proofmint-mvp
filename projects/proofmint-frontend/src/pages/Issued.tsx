import algosdk from "algosdk";
import { useEffect, useState } from "react";
import { algorandClient, Caller } from "../utils";
import { WalletAccount } from "@txnlab/use-wallet-react";
import { APP_ID, ASSET_URL, IPFS_GATEWAY } from "../config";

export const Issued = ({
  createToast,
  role,
  isConnected,
  activeAccount,
}: {
  createToast: (msg: string, url?: string) => void;
  role: string;
  isConnected: boolean;
  activeAccount: WalletAccount | null;
}) => {
  const [issued, setIssued] = useState<
    {
      assetId: number;
      metadata: any;
      type: string;
      boxData: {
        address: string;
        nftClaim: number;
        mbrClaim: number;
      }[];
    }[]
  >([]);

  const [badges, setBadges] = useState<
    {
      assetId: number;
      metadata: any;
      type: string;
      boxData: {
        address: string;
        nftClaim: number;
        mbrClaim: number;
      }[];
    }[]
  >([]);

  const [certificates, setCertificates] = useState<
    {
      assetId: number;
      metadata: any;
      type: string;
      boxData: {
        address: string;
        nftClaim: number;
        mbrClaim: number;
      }[];
    }[]
  >([]);

  useEffect(() => {
    const badges = issued.filter((badge) => badge.type === "badge");
    setBadges(badges);
    const certificates = issued.filter((certificate) => certificate.type === "certificate");
    setCertificates(certificates);
  }, [issued]);

  async function getMetadata(asset: number) {
    const assetDetails = await algorandClient.client.indexer.lookupAssetByID(asset).do();
    if (assetDetails.asset.params.url) {
      const ipfshash: string = assetDetails.asset.params.url.split("ipfs://").pop();
      const finalUrl = `${IPFS_GATEWAY}${ipfshash}`;
      const metadata = await fetch(finalUrl);
      const metadatajson = await metadata.json();
      metadatajson.image = `${IPFS_GATEWAY}${metadatajson.image.split("ipfs://").pop()}`;
      return metadatajson;
    } else {
      return {};
    }
  }

  const getMint = async (assetId: number) => {
    const boxValueType = algosdk.ABIType.from("(address,uint8,uint8)[]");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mint: any = await Caller.appClient.getBoxValueFromABIType(algosdk.bigIntToBytes(assetId, 8), boxValueType);
    const mintDataArray = [];
    for (const mintData of mint) {
      const [address, nftClaim, mbrClaim]: [string, bigint, bigint] = mintData;
      mintDataArray.push({
        address,
        nftClaim: Number(nftClaim),
        mbrClaim: Number(mbrClaim),
      });
    }
    return mintDataArray;
  };

  function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  }

  async function processTransactions(txns: any) {
    const transactions = txns.transactions;
    const badges: {
      assetId: number;
      metadata: object;
      type: string;
      boxData: {
        address: string;
        nftClaim: number;
        mbrClaim: number;
      }[];
    }[] = [];
    for (var i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      const decoder = new TextDecoder();
      if (txn["application-transaction"]["foreign-assets"].length == 1) {
        const assetId = txn["application-transaction"]["foreign-assets"][0];
        const metadata = await getMetadata(assetId);
        const boxData = await getMint(assetId);
        console.log(txn.note);
        // convert b64 to string
        const noteField = decoder.decode(base64ToBytes(txn.note));
        const type = noteField.split("-")[noteField.split("-").length - 1];
        console.log(type);
        badges.push({ assetId, metadata, boxData, type });
      }
    }

    return badges;
  }

  useEffect(() => {
    document.title = "Issued | ProofMint";
    async function getIssued() {
      const methodSelector = Caller.appClient.getABIMethod("registerMint");
      if (methodSelector) {
        const encoder = new TextEncoder();
        let txns = await algorandClient.client.indexer
          .searchForTransactions()
          .notePrefix(encoder.encode("registermint"))
          .applicationID(APP_ID)
          .address(activeAccount?.address!)
          .addressRole("sender")
          .txType("appl")
          .do();

        let issued = await processTransactions(txns);
        while (txns.nextToken) {
          txns = await algorandClient.client.indexer
            .searchForTransactions()
            .notePrefix(encoder.encode("registermint"))
            .applicationID(APP_ID)
            .address(activeAccount?.address!)
            .addressRole("sender")
            .txType("appl")
            .nextToken(txns.nextToken)
            .do();
          issued = [...issued, ...(await processTransactions(txns))];
        }
        setIssued(issued);
      }
    }
    getIssued();
  }, []);

  const loadMetada = (_: any, metadata: any) => {
    const metadataBody = document.getElementById("Metadatabody");
    //add metadata json to modal in formatted way
    if (metadataBody) {
      metadataBody.innerHTML = `<pre>${JSON.stringify(metadata, null, 2)}</pre>`;
    }
    //open metadata modal
    const metadataModalOpen = document.getElementById("MetadataModalOpen");
    if (metadataModalOpen) {
      metadataModalOpen.click();
    }
  };

  const loadUserStatus = (
    _: any,
    boxData: {
      address: string;
      nftClaim: number;
      mbrClaim: number;
    }[]
  ) => {
    const usersClaimBody = document.getElementById("UsersClaimbody");
    //add user's claim status to modal in formatted way
    if (usersClaimBody) {
      usersClaimBody.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Address</th>
              <th scope="col">NFT Claim</th>
              <th scope="col">MBR Claim</th>
            </tr>
          </thead>
          <tbody>
            ${boxData
              .map(
                (data, index) => `
              <tr>
                <td>${data.address}</td>
                <td>${data.nftClaim == 0 ? "Not Claimed" : "Claimed"}</td>
                <td>${data.mbrClaim == 0 ? "Not Claimed" : "Claimed"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }
    //open user's claim status modal
    const usersClaimModalOpen = document.getElementById("UsersClaimModalOpen");
    if (usersClaimModalOpen) {
      usersClaimModalOpen.click();
    }
  };

  return (
    <>
      <div className="container">
        <h1>Issued</h1>
        <nav className="nav nav-pills flex-column flex-sm-row">
          <a
            className="flex-sm-fill text-sm-center nav-link active"
            data-bs-toggle="pill"
            data-bs-target="#pills-badges"
            type="button"
            role="tab"
            aria-controls="pills-badges"
            aria-selected="true"
            aria-current="page"
          >
            Badges
          </a>
          <a
            className="flex-sm-fill text-sm-center nav-link"
            data-bs-toggle="pill"
            data-bs-target="#pills-certificates"
            type="button"
            role="tab"
            aria-controls="pills-certificates"
            aria-selected="false"
          >
            Certificates
          </a>
        </nav>
        <div className="tab-content" id="pills-tabContent">
          <div className="tab-pane fade show active" id="pills-badges" role="tabpanel" aria-labelledby="pills-badges-tab">
            {badges.length > 0 ? (
              badges.map((badge, index) => (
                <div key={index} className="card" style={{ border: "1px solid #fff", width: "18rem" }}>
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img
                      src={badge.metadata.image}
                      className="card-img-top w-100 h-100"
                      alt={badge.metadata.fileName}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">
                      {badge.metadata.name} [{badge.metadata.symbol}]
                    </h5>
                    <p className="card-text">
                      {badge.boxData.length} Badge{badge.boxData.length > 0 ? "s" : ""} Issued
                    </p>
                    <p className="card-text">{badge.metadata.description}</p>
                  </div>
                  <div className="card-body">
                    <a style={{ cursor: "pointer", color: "#fff" }} onClick={(e) => loadMetada(e, badge.metadata)} className="card-link">
                      View Metadata
                    </a>
                    <br></br>
                    <a
                      style={{ cursor: "pointer", color: "#fff" }}
                      onClick={(e) => window.open(ASSET_URL + badge.assetId)}
                      className="card-link"
                    >
                      View in Explorer
                    </a>
                    <br></br>
                    <a style={{ cursor: "pointer", color: "#fff" }} onClick={(e) => loadUserStatus(e, badge.boxData)} className="card-link">
                      View User's Claim Status
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p>No badges issued</p>
            )}
          </div>
          <div className="tab-pane fade" id="pills-certificates" role="tabpanel" aria-labelledby="pills-certificates-tab">
            {certificates.length > 0 ? (
              certificates.map((certificate, index) => (
                <div key={index} className="card" style={{ border: "1px solid #fff", width: "18rem" }}>
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img
                      src={certificate.metadata.image}
                      className="card-img-top w-100 h-100"
                      alt={certificate.metadata.fileName}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">
                      {certificate.metadata.name} [{certificate.metadata.symbol}]
                    </h5>
                    <p className="card-text">
                      {certificate.boxData.length} Certificate{certificate.boxData.length > 0 ? "s" : ""} Issued
                    </p>
                    <p className="card-text">{certificate.metadata.description}</p>
                  </div>
                  <div className="card-body">
                    <a
                      style={{ cursor: "pointer", color: "#fff" }}
                      onClick={(e) => loadMetada(e, certificate.metadata)}
                      className="card-link"
                    >
                      View Metadata
                    </a>
                    <br></br>
                    <a
                      style={{ cursor: "pointer", color: "#fff" }}
                      onClick={(e) => window.open(ASSET_URL + certificate.assetId)}
                      className="card-link"
                    >
                      View in Explorer
                    </a>
                    <br></br>
                    <a
                      style={{ cursor: "pointer", color: "#fff" }}
                      onClick={(e) => loadUserStatus(e, certificate.boxData)}
                      className="card-link"
                    >
                      View User's Claim Status
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p>No certificates issued</p>
            )}
          </div>
        </div>
      </div>
      <a id="MetadataModalOpen" style={{ display: "none" }} href="#MetadataModal" data-bs-toggle="modal"></a>
      <div id="MetadataModal" className="modal fade">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Metadata</h4>
              <button id="MetadataModalClose" type="button" className="btn-close reset" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div id="Metadatabody" className="modal-body"></div>
          </div>
        </div>
      </div>

      <a id="UsersClaimModalOpen" style={{ display: "none" }} href="#UsersClaimModal" data-bs-toggle="modal"></a>
      <div id="UsersClaimModal" className="modal fade">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">User's Claim Status</h4>
              <button id="UsersClaimClose" type="button" className="btn-close reset" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div id="UsersClaimbody" className="modal-body"></div>
          </div>
        </div>
      </div>
    </>
  );
};
