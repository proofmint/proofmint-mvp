/* eslint-disable no-console */

import * as algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { ProofMintClient } from './clients/ProofMintClient';

const transferTestTokens = async (
  algodClient: algosdk.Algodv2,
  sender: algosdk.Account,
  reciever: string,
  amount: number
) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const xferTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    to: reciever,
    suggestedParams,
    amount: algokit.algos(amount).microAlgos,
  });
  const signedXferTxn = xferTxn.signTxn(sender.sk);
  try {
    await algodClient.sendRawTransaction(signedXferTxn).do();
    await algosdk.waitForConfirmation(algodClient, xferTxn.txID().toString(), 3);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return false;
  }
};

const getMint = async (Caller: ProofMintClient, assetId: number) => {
  const boxValueType = algosdk.ABIType.from('(address,uint8,uint8)[]');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mint: any = await Caller.appClient.getBoxValueFromABIType(algosdk.bigIntToBytes(assetId, 8), boxValueType);
  return mint;
};

(async () => {
  const algorandClient = algokit.AlgorandClient.testNet();
  const admin = algosdk.mnemonicToSecretKey(
    'ghost worry border energy merry cry among portion coconut must section sting defy speak deer tragic way path obtain scene exit wedding miracle abandon nothing'
  );
  const externalPayee = algosdk.mnemonicToSecretKey(
    'nuclear gadget float near little supply whisper rather east life credit engine blanket media whisper small term kingdom near awful burden federal capital about pledge'
  );
  const user2 = algosdk.mnemonicToSecretKey(
    'forget usual bacon rebuild clock wild zoo shop wave endorse notice bamboo dirt elite cotton vast romance pass brave tragic usual double identify ability hello'
  );

  const newUser = algosdk.generateAccount();

  // await transferTestTokens(algorandClient.client.algod, admin, user1.addr, 100);
  // await transferTestTokens(algorandClient.client.algod, admin, user2.addr, 100);

  const Caller = new ProofMintClient(
    {
      sender: admin,
      resolveBy: 'id',
      id: 727210068,
    },
    algorandClient.client.algod
  );

  // await Caller.create.createApplication({ externalPayee: externalPayee.addr });

  const { appId, appAddress } = await Caller.appClient.getAppReference();
  console.log('APP ID : ', appId);
  console.log('APP ADDRESS : ', appAddress);

  // await transferTestTokens(algorandClient.client.algod, admin, appAddress, 100);
  const tokenCreate = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: admin.addr,
    assetName: 'ProofMint',
    unitName: 'PM',
    total: 3,
    decimals: 0,
    defaultFrozen: false,
    manager: admin.addr,
    reserve: admin.addr,
    freeze: admin.addr,
    clawback: appAddress,
    suggestedParams: await algorandClient.client.algod.getTransactionParams().do(),
  });
  const signedTokenCreate = tokenCreate.signTxn(admin.sk);
  await algorandClient.client.algod.sendRawTransaction(signedTokenCreate).do();
  const tokenCreateTx = await algosdk.waitForConfirmation(algorandClient.client.algod, tokenCreate.txID(), 3);
  const assetId = tokenCreateTx['asset-index'];
  console.log('Asset ID : ', assetId);

  const addresses = [admin.addr, user2.addr, newUser.addr];
  const costsAmount = 2500 + 3200 + 34 * addresses.length * 400 + addresses.length * 205000 + 1000;
  const mbrPay = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: admin.addr,
    to: appAddress,
    amount: costsAmount,
    suggestedParams: await algorandClient.client.algod.getTransactionParams().do(),
  });
  const createMint = await Caller.registerMint(
    { assetId, addresses, costs: mbrPay },
    {
      boxes: [{ appIndex: 0, name: algosdk.bigIntToBytes(assetId, 8) }],
      assets: [assetId],
      accounts: [
        admin.addr, // creator of nft
        externalPayee.addr, // external Payer
      ],
    }
  );
  console.log(`Created Mint for ${assetId} : `, await getMint(Caller, assetId));

  const mbrSend = await Caller.claimMbr(
    { assetId, address: newUser.addr },
    {
      boxes: [{ appIndex: 0, name: algosdk.bigIntToBytes(assetId, 8) }],
      assets: [assetId],
      sender: externalPayee,
      accounts: [newUser.addr], // mbr balance claimee
    }
  );
  console.log(`Claimed MBR : ${mbrSend.transaction.txID()}`);

  const claimMint = Caller.compose().addTransaction({
    transaction: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: newUser.addr,
      to: newUser.addr,
      assetIndex: assetId,
      amount: 0,
      suggestedParams: await algorandClient.client.algod.getTransactionParams().do(),
    }),
    signer: newUser,
  });

  claimMint.claimNft(
    { assetId },
    {
      sender: newUser,
      boxes: [{ appIndex: 0, name: algosdk.bigIntToBytes(assetId, 8) }],
      assets: [assetId],
      accounts: [
        newUser.addr, // asset receiver
        admin.addr, // asser sender
      ],
    }
  );

  const claimMintTx = await claimMint.execute();
  console.log(`Claimed Mint for ${assetId} by ${newUser} : `, await getMint(Caller, assetId));
})();
