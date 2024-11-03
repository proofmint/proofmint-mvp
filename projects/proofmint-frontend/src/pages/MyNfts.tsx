import { useEffect, useState } from "react";
import { algorandClient, Caller, externalPayee } from "../utils";
import algosdk, { Transaction } from "algosdk";
import { WalletAccount } from "@txnlab/use-wallet-react";
import { APP_ID, ASSET_URL, IPFS_GATEWAY, TX_URL } from "../config";
import { useNavigate } from "react-router-dom";
export const MyNfts = ({
  activeAccount,
  createToast,
  transactionSigner,
}: {
  activeAccount: WalletAccount | null;
  createToast: (msg: string, url?: string) => void;
  transactionSigner: (txnGroup: Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>;
}) => {
  const navigate = useNavigate();
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

  function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  }

  const [mints, setMints] = useState<
    { assetId: number; mbrClaim: number; nftClaim: number; metadata: any; type: string; addressIndex: number }[]
  >([]);
  const [badges, setBadges] = useState<
    { assetId: number; mbrClaim: number; nftClaim: number; metadata: any; type: string; addressIndex: number }[]
  >([]);

  const [certificates, setCertificates] = useState<
    { assetId: number; mbrClaim: number; nftClaim: number; metadata: any; type: string; addressIndex: number }[]
  >([]);

  useEffect(() => {
    const getBoxNames = async () => {
      const boxs = await Caller.appClient.getBoxNames();
      const boxNames: number[] = [];
      boxs.forEach((boxName) => {
        if (boxName.nameRaw.length === 8) {
          boxNames.push(Number(algosdk.bytesToBigInt(boxName.nameRaw)));
        }
      });
      const mints: { assetId: number; mbrClaim: number; nftClaim: number; metadata: any; type: string; addressIndex: number }[] = [];
      for (let i = 0; i < boxNames.length; i++) {
        console.log(boxNames[i]);
        const mint = await getMint(boxNames[i]);
        // check if the user is eligible for claim
        console.log(mint, activeAccount?.address!);
        const userMint = mint.find((m) => m.address === activeAccount?.address!);
        console.log(userMint);
        if (userMint) {
          const addressIndex = mint.findIndex((m) => m.address === activeAccount?.address!);
          const metadata = await getMetadata(boxNames[i]);
          const encoder = new TextEncoder();
          const typeTxn = await algorandClient.client.indexer
            .searchForTransactions()
            .applicationID(APP_ID)
            .notePrefix(encoder.encode(`registermint-${boxNames[i]}`))
            .do();
          if (typeTxn.transactions.length > 0) {
            const txn = typeTxn.transactions[0];
            const decoder = new TextDecoder();
            const noteField = decoder.decode(base64ToBytes(txn.note));
            const type = noteField.split("-")[noteField.split("-").length - 1];
            mints.push({
              assetId: boxNames[i],
              mbrClaim: userMint.mbrClaim,
              nftClaim: userMint.nftClaim,
              metadata,
              type,
              addressIndex,
            });
          }
        }
      }
      console.log(mints);
      setMints(mints);
    };
    getBoxNames();
  }, []);

  useEffect(() => {
    const badges = mints.filter((badge) => badge.type === "badge");
    setBadges(badges);
    const certificates = mints.filter((certificate) => certificate.type === "certificate");
    setCertificates(certificates);
  }, [mints]);

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

  const [claiming, setClaiming] = useState("");

  const Claim = async (
    _: any,
    mint: { assetId: number; mbrClaim: number; nftClaim: number; metadata: any; type: string; addressIndex: number }
  ) => {
    try {
      if (!activeAccount) {
        createToast("Please connect your wallet");
        return;
      }
      if (mint.mbrClaim == 0) {
        setClaiming("Claiming MBR...");
        const claim = await Caller.claimMbr(
          { assetId: mint.assetId, address: activeAccount?.address!, index: mint.addressIndex },
          {
            boxes: [{ appIndex: 0, name: algosdk.bigIntToBytes(mint.assetId, 8) }],
            assets: [mint.assetId],
            sender: externalPayee,
            accounts: [activeAccount?.address!],
          }
        );
      }
      setClaiming("Claiming NFT...");
      const claimMint = Caller.compose().addTransaction({
        txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: activeAccount.address,
          to: activeAccount.address,
          assetIndex: mint.assetId,
          amount: 0,
          suggestedParams: await algorandClient.client.algod.getTransactionParams().do(),
        }),
        signer: transactionSigner,
      });

      claimMint.claimNft(
        { assetId: mint.assetId, index: mint.addressIndex },
        {
          boxes: [{ appIndex: 0, name: algosdk.bigIntToBytes(mint.assetId, 8) }],
          assets: [mint.assetId],
          accounts: [activeAccount.address, mint.metadata.creator],
          sender: { addr: activeAccount.address, signer: transactionSigner },
        }
      );
      const claimMintTx = await claimMint.execute();
      createToast("NFT Claimed Successfully..", `${TX_URL}${claimMintTx.transactions[0].txID()}`);
      setClaiming("");
      window.location.reload();
    } catch (e: any) {
      console.log(e);
      createToast(`Error Occured: ${e.message}`);
      setClaiming("");
    }
  };

  return (
    <>
      <div className="container">
        <h1>My NFTs</h1>
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
                    <p className="card-text">{badge.nftClaim == 0 ? "Not Claimed" : "Claimed"}</p>
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
                    <button
                      style={{ cursor: "pointer", color: "#1c1038", backgroundColor: "#fff", marginTop: "22px" }}
                      onClick={(e) => Claim(e, badge)}
                      className="btn"
                      disabled={badge.nftClaim == 1 ? true : claiming == "" ? false : true}
                    >
                      {badge.nftClaim == 1 ? (
                        "Claimed"
                      ) : claiming == "" ? (
                        "Claim"
                      ) : (
                        <>
                          {claiming}
                          <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                        </>
                      )}
                    </button>
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
                    <p className="card-text">{certificate.nftClaim == 0 ? "Not Claimed" : "Claimed"}</p>
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
                    <button
                      style={{ cursor: "pointer", color: "#1c1038", backgroundColor: "#fff", marginTop: "22px" }}
                      onClick={(e) => Claim(e, certificate)}
                      className="btn"
                      disabled={certificate.nftClaim == 1 ? true : claiming == "" ? false : true}
                    >
                      {certificate.nftClaim == 1 ? (
                        "Claimed"
                      ) : claiming == "" ? (
                        "Claim"
                      ) : (
                        <>
                          {claiming}
                          <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                        </>
                      )}
                    </button>
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
    </>
  );
};
