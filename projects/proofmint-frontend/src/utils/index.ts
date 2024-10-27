import * as algosdk from "algosdk";
import * as algokit from "@algorandfoundation/algokit-utils";
import { ProofMintClient } from "../contracts/ProofMint";
import { APP_ID, externalPayeeMnemonic } from "../config";
export const algorandClient = algokit.AlgorandClient.testNet();

export const Caller = new ProofMintClient(
  {
    resolveBy: "id",
    id: APP_ID,
  },
  algorandClient.client.algod
);

export const getExternalPayee = async () => {
  const globalState = await Caller.getGlobalState();
  return algosdk.encodeAddress(globalState.externalPayeeAddress?.asByteArray()!);
};

export const getUserDetails = async (userAddress: string) => {
  const userABI = algosdk.ABIType.from("(string,string,string,string,string)");
  try {
    const userAddressPublicKey = algosdk.decodeAddress(userAddress).publicKey;
    const user: any = await Caller.appClient.getBoxValueFromABIType(userAddressPublicKey, userABI);
    return { role: user[0], name: user[1], year: user[2], email: user[3], contact: user[4] };
  } catch (e) {
    return null;
  }
};

export const externalPayee = algosdk.mnemonicToSecretKey(externalPayeeMnemonic);
