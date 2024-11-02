import { Contract } from '@algorandfoundation/tealscript';

type AddressClaim = {
  address: Address;
  nftClaim: uint8;
  mbrClaim: uint8;
};

type UserDetails = {
  role: string;
  name: string;
  year: string;
  email: string;
  contact: string;
};

export class ProofMint extends Contract {
  mints = BoxMap<uint64, AddressClaim[]>();

  globalMintCount = GlobalStateKey<uint64>();

  externalPayeeAddress = GlobalStateKey<Address>();

  users = BoxMap<Address, UserDetails>();

  createApplication(externalPayee: Address): void {
    this.globalMintCount.value = 0;
    this.externalPayeeAddress.value = externalPayee;
  }

  increaseOpcodeLimit(): void {}

  registerAccount(role: string, name: string, year: string, email: string, contact: string): void {
    assert(this.users(this.txn.sender).exists === false, 'User already exists');
    if (role === 'institution' || role === 'company' || role === 'doa' || role === 'community') {
      this.users(this.txn.sender).value = { role: role, name: name, year: year, email: email, contact: contact };
    } else if (role === 'user') {
      this.users(this.txn.sender).value = { role: 'user', name: name, year: '', email: email, contact: contact };
    }
  }

  registerMint(assetId: AssetID, addresses: Address[], costs: PayTxn): void {
    assert(addresses.length > 0, 'No addresses provided');
    assert(assetId.clawback === this.app.address, 'Clawback address must be the app address');
    assert(assetId.creator.assetBalance(assetId) >= addresses.length, 'Not enough assets');
    assert(this.mints(assetId.id).exists === false, 'Mint already exists');
    const mintCount = this.globalMintCount.value + 1;
    this.globalMintCount.value = mintCount;
    const cost = 2500 + 3200 + 34 * addresses.length * 400 + addresses.length * 205000 + 1000;
    verifyPayTxn(costs, { amount: { greaterThanEqualTo: cost }, receiver: this.app.address });
    sendPayment({ receiver: this.externalPayeeAddress.value, amount: addresses.length * 1000, fee: 1000 });
    const addressClaims: AddressClaim[] = [];
    for (let i = 0; i < addresses.length; i += 1) {
      const oneAddressClaim: AddressClaim = { address: addresses[i], nftClaim: 0, mbrClaim: 0 };
      addressClaims.push(oneAddressClaim);
    }
    this.mints(assetId.id).value = addressClaims;
  }

  claimNft(assetId: AssetID): void {
    assert(this.mints(assetId.id).exists, 'No mint found');
    assert(assetId.clawback === this.app.address, 'Clawback address must be the app address');
    const checkResult = this.checkAddressAvailable(assetId, this.txn.sender);
    assert(checkResult[0], 'Address not found');
    assert(checkResult[2].nftClaim === 0, 'Address already claimed');
    assert(this.txn.sender.isOptedInToAsset(assetId), 'Address not opted in to asset');
    this.changeAddressClaimNft(assetId, checkResult[1]);
    sendAssetTransfer({
      sender: this.app.address,
      assetSender: assetId.creator,
      assetReceiver: this.txn.sender,
      assetAmount: 1,
      xferAsset: assetId,
      fee: 1000,
      note: 'claimnft-' + assetId.id.toString(),
    });
  }

  claimMbr(assetId: AssetID, address: Address): void {
    assert(this.mints(assetId.id).exists, 'No mint found');
    assert(assetId.clawback === this.app.address, 'Clawback address must be the app address');
    assert(this.txn.sender === this.externalPayeeAddress.value, 'Only external payee can claim');
    const checkResult = this.checkAddressAvailable(assetId, address);
    assert(checkResult[0], 'Address not found');
    assert(checkResult[2].mbrClaim === 0, 'Address already claimed');
    this.changeAddressClaimMbr(assetId, checkResult[1]);
    sendPayment({ receiver: address, amount: 202000, fee: 1000, note: 'claimmbr-' + assetId.id.toString() });
  }

  private changeAddressClaimNft(assetId: AssetID, addressIndex: uint64): void {
    this.mints(assetId.id).value[addressIndex] = {
      address: this.mints(assetId.id).value[addressIndex].address,
      nftClaim: 1,
      mbrClaim: this.mints(assetId.id).value[addressIndex].mbrClaim,
    };
  }

  private changeAddressClaimMbr(assetId: AssetID, addressIndex: uint64): void {
    this.mints(assetId.id).value[addressIndex] = {
      address: this.mints(assetId.id).value[addressIndex].address,
      nftClaim: this.mints(assetId.id).value[addressIndex].nftClaim,
      mbrClaim: 1,
    };
  }

  private checkAddressAvailable(assetId: AssetID, address: Address): [boolean, uint64, AddressClaim] {
    const addresses = this.mints(assetId.id).value;
    const addressesLength = this.mints(assetId.id).size / 33;
    let addressFound = false;
    let addressIndex = 0;
    let addressClaim: AddressClaim = { address: address, nftClaim: 0, mbrClaim: 0 };
    for (let i = 0; i < addressesLength; i += 1) {
      if (addresses[i].address === address) {
        addressFound = true;
        addressIndex = i;
        addressClaim = addresses[i];
        break;
      }
    }
    return [addressFound, addressIndex, addressClaim];
  }
}
