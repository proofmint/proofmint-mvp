import algosdk from 'algosdk';

// console.log(algosdk.secretKeyToMnemonic(algosdk.generateAccount().sk));
// console.log(algosdk.secretKeyToMnemonic(algosdk.generateAccount().sk));
// console.log(algosdk.secretKeyToMnemonic(algosdk.generateAccount().sk));

const account = algosdk.mnemonicToSecretKey(
  'trap easy flame country track actress bronze multiply material ocean hood remind clog truth again acquire oyster leg muffin feel alarm awful edit ability learn'
);

const decoder = new TextDecoder();
console.log('public key', account.addr);
console.log('private key', account.sk);

const privateKeyHex = Array.from(account.sk)
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');
console.log(privateKeyHex);

// Assuming `privateKey` is your Uint8Array
const privateKeyBase64 = btoa(String.fromCharCode(...account.sk));
console.log(privateKeyBase64);

// ghost worry border energy merry cry among portion coconut must section sting defy speak deer tragic way path obtain scene exit wedding miracle abandon nothing
// nuclear gadget float near little supply whisper rather east life credit engine blanket media whisper small term kingdom near awful burden federal capital about pledge
// forget usual bacon rebuild clock wild zoo shop wave endorse notice bamboo dirt elite cotton vast romance pass brave tragic usual double identify ability hello
// BDWVZ6BX2F43BGZRODI5XQFPDSS2L2Z7AKWNCECMVAHDYLA3EL72RMGVYM
// WQP7UQRVFOBID2LHRDFTWSHAXTVNDZXKRFFWXDYCL4SSMS7VYD3XCA4CWU
// SCE42N7IX5DJ5P3N3CHSRQP4GLGEKUFGVLQRPHLCV6NVNL3UB2GHCWTROY
