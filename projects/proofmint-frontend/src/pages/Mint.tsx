import { useEffect, useRef, useState } from "react";
import "../assets/css/mint.css";
import algosdk, { Transaction } from "algosdk";
import { APP_ADDRESS, APP_ID, ASSET_URL, PINATA_API_JWT, TX_URL } from "../config";
import { WalletAccount } from "@txnlab/use-wallet-react";
import { useNavigate } from "react-router-dom";
import { algorandClient, Caller, getExternalPayee } from "../utils";
import { platform } from "os";

export const Mint = ({
  createToast,
  role,
  isConnected,
  activeAccount,
  transactionSigner,
}: {
  createToast: (msg: string, url?: string) => void;
  role: string;
  isConnected: boolean;
  activeAccount: WalletAccount | null;
  transactionSigner: (txnGroup: Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>;
}) => {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const inputElementRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [formDetails, setFormDetails] = useState({
    assetName: "",
    unitName: "",
    nftDescription: "",
    properties: {} as Record<string, string>,
    imageSrc: "",
    imageAlt: "",
    addresses: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState("");

  useEffect(() => {
    if (!isConnected || !activeAccount) {
      navigate("/");
    }
    if (role == "user" || role == "guest" || role == "noregister") {
      navigate("/");
    }
    const dropZone = dropZoneRef.current;
    const inputElement = inputElementRef.current;
    const img = imgRef.current;
    const p = pRef.current;

    if (!dropZone || !inputElement || !img || !p) return;

    const handleFile = (file: File) => {
      img.style.display = "block";
      p.style.display = "none";
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        img.src = reader.result as string;
        img.alt = file.name;
        setFormDetails((prevDetails) => ({ ...prevDetails, imageSrc: img.src, imageAlt: img.alt }));
      };
    };

    const handleInputChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const clickFile = target.files?.[0];
      if (clickFile) {
        handleFile(clickFile);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file) {
        handleFile(file);
      }
    };

    inputElement.addEventListener("change", handleInputChange);
    dropZone.addEventListener("click", () => inputElement.click());
    dropZone.addEventListener("dragover", (e) => e.preventDefault());
    dropZone.addEventListener("drop", handleDrop);

    return () => {
      inputElement.removeEventListener("change", handleInputChange);
      dropZone.removeEventListener("click", () => inputElement.click());
      dropZone.removeEventListener("dragover", (e) => e.preventDefault());
      dropZone.removeEventListener("drop", handleDrop);
    };
  }, []);

  const addProperty = () => {
    const key = document.getElementById("key") as HTMLInputElement;
    const value = document.getElementById("value") as HTMLInputElement;
    if (!key || !value) return;

    if (key.value === "" || value.value === "") {
      createToast("Please fill the key and value fields");
    } else {
      const prop = document.getElementById("prop");
      if (!prop) return;
      const newDiv = document.createElement("div");
      newDiv.className = "row";
      newDiv.id = `prop-${prop.childNodes.length}`;
      newDiv.innerHTML = `
                          <div class='group'>
                            <input readonly name='prop[${key.value}]' value='${value.value}' id='inp-${prop.childNodes.length}'>
                            <label for='inp-${prop.childNodes.length}'>${key.value}</label>
                          </div>
                          <div style='padding:0;'>
                            <button type='button' class='add-btn' data-id='${prop.childNodes.length}'>
                              <svg width='12px' height='12px' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'>
                                <path fill='#1c1038' d='M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z'/>
                              </svg>
                            </button>
                          </div>`;
      prop.appendChild(newDiv);
      setFormDetails({ ...formDetails, properties: { ...formDetails.properties, [key.value]: value.value } });
      key.value = "";
      value.value = "";

      // Add event listener for the delete button
      newDiv.querySelector("button")?.addEventListener("click", () => deleteProperty(prop.childNodes.length - 1));
    }
  };

  const deleteProperty = (id: number) => {
    const prop = document.getElementById(`prop-${id}`);
    if (prop) {
      prop.remove();
      const newProperties = { ...formDetails.properties };
      delete newProperties[Object.keys(newProperties)[id]];
      setFormDetails({ ...formDetails, properties: newProperties });
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1); // Ignore the first row (header)
      const addresses = lines.map((line) => line.split(",")[0].trim()).filter((address) => validateAlgorandAddress(address));
      createToast(`${addresses.length} valid addresses found`);
      setFormDetails({ ...formDetails, addresses });
    };
    reader.readAsText(file);
  };

  const validateAlgorandAddress = (address: string): boolean => {
    return algosdk.isValidAddress(address);
  };

  function dataURIToBlob(dataURI: string) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
  }
  const uploadB64ImageToIPFS = async (b64Image: string, filename: string) => {
    try {
      const imageBlob = dataURIToBlob(b64Image);
      const file = new File([imageBlob], filename);
      const data = new FormData();
      data.append("file", file);

      const upload = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_API_JWT}`,
        },
        body: data,
      });
      const uploadRes: {
        IpfsHash: string;
        PinSize: number;
        Timestamp: string;
        isDuplicate: boolean;
      } = await upload.json();
      return uploadRes.IpfsHash;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const calculateSHA256 = async (blobContent: Blob | undefined): Promise<string> => {
    if (!blobContent) {
      throw Error("No Blob found in calculateSHA256");
    }
    try {
      const arrayBuffer = await blobContent.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return hashHex;
    } catch (error: any) {
      throw error;
    }
  };

  async function pinJSONToIPFS(metadata: object) {
    try {
      const data = JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: "metadata.json",
        },
      });
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_API_JWT}`,
        },
        body: data,
      });
      const resData: {
        IpfsHash: string;
        PinSize: number;
        Timestamp: string;
        isDuplicate: boolean;
      } = await res.json();
      return resData.IpfsHash;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(await getExternalPayee());
      console.log(formDetails);
      if (formDetails.addresses.length === 0) {
        createToast("Please upload a valid CSV file with addresses");
        return;
      }
      if (formDetails.imageSrc === "") {
        createToast("Please upload an image file");
        return;
      }
      if (formDetails.assetName === "" || formDetails.unitName === "" || formDetails.nftDescription === "") {
        createToast("Please fill all the fields");
        return;
      }
      setIsSubmitting("Uploading Image to IPFS...");
      const ImageCID = await uploadB64ImageToIPFS(formDetails.imageSrc, formDetails.imageAlt);
      if (!ImageCID) {
        createToast("Error uploading image to IPFS");
        setIsSubmitting("");
        return;
      }
      const imageHash = await calculateSHA256(dataURIToBlob(formDetails.imageSrc));
      setIsSubmitting("Uploading Metadata to IPFS...");
      console.log(formDetails.properties);
      const metadata = {
        name: formDetails.assetName,
        symbol: formDetails.unitName,
        description: formDetails.nftDescription,
        image: `ipfs://${ImageCID}#arc3`,
        creator: activeAccount?.address,
        image_integrity: `sha256-${imageHash}`,
        fileName: formDetails.imageAlt,
        properties: { ...formDetails.properties, timeStamp: new Date().toISOString(), appId: APP_ID, platform: "ProofMint" },
      };
      const metadataCID = await pinJSONToIPFS(metadata);
      if (!metadataCID) {
        createToast("Error uploading metadata to IPFS");
        setIsSubmitting("");
        return;
      }
      const atc = new algosdk.AtomicTransactionComposer();
      atc.addTransaction({
        txn: algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
          assetName: formDetails.assetName,
          unitName: formDetails.unitName,
          from: activeAccount?.address!,
          total: formDetails.addresses.length,
          decimals: 0,
          suggestedParams: await algorandClient.client.algod.getTransactionParams().do(),
          defaultFrozen: false,
          assetURL: `ipfs://${metadataCID}#arc3`,
          manager: activeAccount?.address!,
          reserve: activeAccount?.address!,
          freeze: activeAccount?.address!,
          clawback: APP_ADDRESS,
        }),
        signer: transactionSigner,
      });
      createToast("Please sign the transaction in your wallet");
      setIsSubmitting("Please sign the transaction in your wallet...");
      await atc.gatherSignatures();

      const txn = await atc.execute(algorandClient.client.algod, 3);
      const assetDetails = await algorandClient.client.algod.pendingTransactionInformation(txn.txIDs[0]).do();
      const assetId = assetDetails["asset-index"];
      createToast(`Badge created with ID: ${assetId}`, ASSET_URL + assetId);

      setIsSubmitting("Registering Mint to Contract...");
      createToast("Registering Mint to Contract...");
      const encoder = new TextEncoder();
      const addresses = formDetails.addresses;
      const costsAmount = 2500 + 3200 + 34 * addresses.length * 400 + addresses.length * 205000 + 1000;
      const mbrPay = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAccount?.address!,
        to: APP_ADDRESS,
        amount: costsAmount,
        suggestedParams: await algorandClient.client.algod.getTransactionParams().do(),
        note: encoder.encode(`registermint-${assetId}-badge`),
      });
      console.log(addresses, APP_ADDRESS, activeAccount?.address!);
      setIsSubmitting("Please sign the transaction in your wallet...");
      createToast("Please sign the transaction in your wallet");
      // repeat 8 times { appIndex: 0, name: algosdk.bigIntToBytes(assetId, 8) } in array
      const bxs = Array.from({ length: 5 }, (_, i) => ({ appIndex: 0, name: algosdk.bigIntToBytes(assetId, 8) }));

      const createMint = Caller.compose().registerMint(
        { assetId, addresses, costs: mbrPay },
        {
          boxes: bxs,
          assets: [assetId],
          accounts: [
            activeAccount?.address!, // creator of nft
            await getExternalPayee(), // external Payer
          ],
          sender: { addr: activeAccount?.address!, signer: transactionSigner },
          note: `registermint-${assetId}-badge`,
        }
      );
      for (let i = 0; i < 7; i++) {
        createMint.increaseOpcodeLimit({}, { sender: { addr: activeAccount?.address!, signer: transactionSigner }, note: i });
      }
      const res = await createMint.execute();
      createToast("Successfully Registered Mint in Contract", TX_URL + res.txIds[0]);
      setIsSubmitting("");
      navigate("/issued");
    } catch (error) {
      console.log(error);
      createToast("Error minting badge");
      setIsSubmitting("");
    }
    // Handle form submission logic here
  };

  return (
    <>
      <div className="container">
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
            <div className="card-wrapper">
              <div className="card">
                <form
                  className="form"
                  onSubmit={(e) => {
                    handleSubmit(e);
                  }}
                >
                  <h3 style={{ fontWeight: 500, marginBlock: 10, marginInlineStart: 5 }}>Badge Image</h3>
                  <div id="drop-zone" ref={dropZoneRef}>
                    <img className="hideimg" src="" alt="" ref={imgRef} />
                    <p ref={pRef}>Drop file or click to upload</p>
                    <input type="file" name="nft_image" id="myfile" hidden ref={inputElementRef} />
                  </div>
                  <div className="group">
                    <input
                      placeholder="‎"
                      name="asset_name"
                      type="text"
                      required
                      value={formDetails.assetName}
                      onChange={(e) => setFormDetails({ ...formDetails, assetName: e.target.value })}
                    />
                    <label htmlFor="name">Badge Name</label>
                  </div>
                  <div className="group">
                    <input
                      placeholder="‎"
                      name="unit_name"
                      type="text"
                      required
                      value={formDetails.unitName}
                      onChange={(e) => setFormDetails({ ...formDetails, unitName: e.target.value })}
                    />
                    <label htmlFor="name">Badge UNIT Name</label>
                  </div>
                  <div className="group">
                    <textarea
                      placeholder="‎"
                      id="comment"
                      name="nft_description"
                      rows={5}
                      required
                      value={formDetails.nftDescription}
                      onChange={(e) => setFormDetails({ ...formDetails, nftDescription: e.target.value })}
                    ></textarea>
                    <label htmlFor="comment">Badge Description</label>
                  </div>

                  <h3 style={{ fontWeight: 500, marginBlock: 10, marginInlineStart: 5 }}>NFT Properties</h3>
                  <div className="row">
                    <div className="group half">
                      <input placeholder="" id="key" type="text" />
                      <label htmlFor="key">Key</label>
                    </div>
                    <div className="group half">
                      <input placeholder="" id="value" type="text" />
                      <label htmlFor="Value">Value</label>
                    </div>
                    <div>
                      <button type="button" className="add-btn" onClick={addProperty}>
                        <svg width="12px" height="12px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                          <path
                            fill="#1c1038"
                            d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div id="prop"></div>
                  <h3 style={{ fontWeight: 500, marginBlock: 10, marginInlineStart: 5 }}>Wallet Addresses</h3>
                  <div className="group">
                    <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCSVUpload} required />
                  </div>
                  <button style={{ width: "71%" }} type="submit" disabled={isSubmitting == "" ? false : true}>
                    {isSubmitting != "" ? (
                      <>
                        {isSubmitting}
                        <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                      </>
                    ) : (
                      "Mint Badge"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="tab-pane fade" id="pills-certificates" role="tabpanel" aria-labelledby="pills-certificates-tab">
            Coming Soon...
          </div>
        </div>
      </div>
    </>
  );
};
