
require("sjcl.js");

class Transaction {
    constructor() {
        this.transactionHash = "";
        this.merkelDAGHash = "";
        this.work = [];
        this.moduleName = "";
        this.signature = "";
        this.merkelData = "";
    }
}

//NO TESTS
class Account {
    constructor(privateKey, cryptographyHelper) {
        this.privateKey = privateKey;
        this.publicHash = cryptographyHelper.PrivateKeyToPublicHash(this.privateKey);
        this.publicKey = cryptographyHelper.PublicHashToPublicKey(this.publicHash);
        this.accountAddress = cryptographyHelper.PublicKeyToAccountID(this.accountAddress);
        this.cryptographyHelper = cryptographyHelper;
    }

    signTransaction(transactionToSign) {
        return this.cryptographyHelper.signTransaction(this, transactionToSign);
    }

    isValid() {
        return this.cryptographyHelper.IsValidPrivateKey(this.privateKey) && this.cryptographyHelper.IsValidPublicAddress(this.accountAddress);
    }
}

class Crytography {

    PrivateKeyToPublicHash(privateKey) {

    }

    PublicHashToPublicKey(publicHash) {

    }

    PublicKeyToPublicAddress(publicKey) {

    }

    SignTransaction(privateKey, transactionHash) {

    }

    IsValidPrivateKey(privateKey) {

    }

    IsValidPublicAddress(publicAddress) {
        
    }

    SHA256(toHash) {

    }

    Base56Encoding(toEncode) {

    }

    Base56Decoding(toDecode) {

    }

    Checksum(toGetChecksomeFrom) {
        //LACKING TESTS
    }

    Base56CheckEncoding(toCheckEncode) {
        //LACKING TESTS
    }

    Base56CheckDecoding(toCheckDecode) {
        //LACKING TESTS
    }
}

class CryptographyUnitTests {
    constructor() {
        this.cryptography = new Crytography()

        ////SHA256 WORKS AS EXPECTED
        ProveSHA256GivesProperHashes();
        ProveSHA256GivesDifferentHashesForDifferentInputs();

        ////BASE56 ENCODING WORKS AS EXPECTED
        ProvateBASE56EncodesAndDecodes();

        ////PRIVATE KEY -> PUBLIC HASH
        ProveValidPrivateKeyMakesProperPublicHash();
        ProveTwoValidPrivateKeysDontMakeTheSamePublicHash();
        ProveInvalidPrivateKeyThrowsOnToPublicHash();

        ////PUBLIC HASH -> PUBLIC KEY
        ProvePublicHashCreatesProperPublicKey();
        ProveTwoPublicHashesDontGenerateTheSamePublicKey();
        ProvePrivateKeyGeneratesProperPublicKey();

        ////PUBLIC KEY -> PUBLIC ADDRESS
        ProvePublicKeyGeneratesProperPublicAddress();
        ProveTwoPublicKeysDontGenerateTheSamePublicAddress();
        ProvePrivateKeyGeneratesProperPublicAddress();

        ////TRANSACTION SIGNING
        ProveValidPrivateKeyCanSignTransaction();
        ProveTwoValidPrivateKeysDontGenerateTheSameSignatureForTheSameTransaction();
        ProveTwoTransactionsDontGenerateTheSameSignatureForTheSamePrivateKey();
        ProveInvalidPrivateKeysThrowOnSigning();
    }

    Assert(expression) {
        if (!expression) {
            throw "ASSERT FAILED";
        }
    }

    ////SHA256
    ProveSHA256GivesProperHashes() {
        var toHash = "[To hash]";
        var properResult = "[proper result]";

        var result = this.cryptography.SHA256(toHash);

        Assert(toHash == properResult);
    }

    ProveSHA256GivesDifferentHashesForDifferentInputs() {
        var toHash1 = "[To hash]";
        var toHash2 = "[To hash]";
        var properResult1 = "[proper result]";
        var properResult2 = "[proper result]";

        var result1 = this.cryptography.SHA256(toHash1);
        var result2 = this.cryptography.SHA256(toHash2);

        Assert(result1 != result2);
        Assert(toHash1 == properResult1);
        Assert(toHash2 == properResult2);
    }

    ////BASE56 Encoding/Decoding
    ProvateBASE56EncodesAndDecodes() {
        var toEncode = "[To encode]";
        var properEncoded = "[idea value]";

        var encodedValue = this.cryptography.Base56Encoding(toEncode);
        var decodedValue = this.cryptography.Base56Decoding(encodedValue);

        Assert(properEncoded == encodedValue);
        Assert(toEncode == decodedValue);
    }

    ////PRIVATE KEY -> PUBLIC HASH
    ProveValidPrivateKeyMakesProperPublicHash() {
        var validPrivateKey = "[Replace with valid private key]";
        var properPublicHash = "[Replace with publicHash we should get]";
        var createdPublicHash = this.cryptography.PrivateKeyToPublicHash(validPrivateKey);

        Assert(createdPublicHash == properPublicHash);
    }

    ProveTwoValidPrivateKeysDontMakeTheSamePublicHash() {
        var validPrivateKey1 = "[Replace with valid private key]";
        var validPrivateKey2 = "[Replace with valid private key]";
        
        var properPublicHash1 = "[Replace with publicHash we should get]";
        var properPublicHash2 = "[Replace with publicHash we should get]";

        var createdPublicHash1 = this.cryptography.PrivateKeyToPublicHash(validPrivateKey1);
        var createdPublicHash2 = this.cryptography.PrivateKeyToPublicHash(validPrivateKey2);

        Assert(createdPublicHash1 != createdPublicHash2);
        Assert(createdPublicHash1 == properPublicHash1);
        Assert(createdPublicHash2 == properPublicHash2);
    }

    ProveInvalidPrivateKeyThrowsOnToPublicHash() {
        var invalidPrivateKey = "[Replace with invalid private key]";

        var pass = false;

        try {
            this.cryptography.PrivateKeyToPublicHash(invalidPrivateKey);
        } catch (err) {
            pass = true;
        }

        Assert(pass);
    }

    ////PUBLIC HASH -> PUBLIC KEY
    ProvePublicHashCreatesProperPublicKey() {
        var publicHash = "[Replace with valid publicHash]";
        var properPublicKey = "[Replace with publicKey we should get]";

        var createdPublicKey = this.cryptography.PublicHashToPublicKey(publicHash);

        Assert(properPublicKey == createdPublicKey);
    }

    ProveTwoPublicHashesDontGenerateTheSamePublicKey() {
        var publicHash1 = "[Replace with valid publicHash]";
        var publicHash2 = "[Replace with valid publicHash]";

        var properPublicKey1 = "[Replace with publicKey we should get]";
        var properPublicKey2 = "[Replace with publicKey we should get]";

        var createdPublicKey1 = this.cryptography.PublicHashToPublicKey(publicHash1);
        var createdPublicKey2 = this.cryptography.PublicHashToPublicKey(publicHash2);

        Assert(createdPublicKey1 != createdPublicKey2);
        Assert(properPublicKey1 == createdPublicKey1);
        Assert(properPublicKey2 == createdPublicKey2);
    }

    ProvePrivateKeyGeneratesProperPublicKey() {
        var privateKey = "[Insert valid private key]";
        var properPublicKey = "[Insert public key for the private key]";

        var createdPublicKey = this.cryptography.PublicHashToPublicKey(this.cryptography.PrivateKeyToPublicHash(privateKey));

        Assert(properPublicKey == createdPublicKey);
    }

    ////PUBLIC KEY -> PUBLIC ADDRESS
    ProvePublicKeyGeneratesProperPublicAddress() {
        var publicKey = "[Insert public key]";
        var properPublicAddress = "[Insert public address for public key]";

        var createdPublicAddress = this.cryptography.PublicKeyToPublicAddress(publicKey);

        Assert(properPublicAddress == createdPublicAddress);
    }

    ProveTwoPublicKeysDontGenerateTheSamePublicAddress() {
        var publicKey1 = "[Insert public key]";
        var publicKey2 = "[Insert public key]";
        var properPublicAddress1 = "[Insert public address for public key]";
        var properPublicAddress2 = "[Insert public address for public key]";

        var createdPublicAddress1 = this.cryptography.PublicKeyToPublicAddress(publicKey1);
        var createdPublicAddress2 = this.cryptography.PublicKeyToPublicAddress(publicKey2);

        Assert(createdPublicAddress1 != createdPublicAddress2);
        Assert(createdPublicAddress1 == properPublicAddress1);
        Assert(createdPublicAddress2 == properPublicAddress2);

    }

    ProvePrivateKeyGeneratesProperPublicAddress() {
        var privateKey = "[Insert valid private key]";
        var properPublicAddress = "[Public address for private key]";

        var publicHash = this.cryptography.PrivateKeyToPublicHash(privateKey);
        var publicKey = this.cryptography.PublicHashToPublicKey(publicHash);
        var publicAddress = this.cryptography.PublicKeyToPublicAddress(publicKey);

        Assert(properPublicAddress == publicAddress);
    }

    ////TRANSACTION SIGNING
    ProveValidPrivateKeyCanSignTransaction() {
        var privateKey = "[Insert valid private key]";
        var transaction = "[Transaction]";
        var properSignature = "[Proper signature]";

        var signature = this.cryptography.SignTransaction(privateKey, transaction);

        Assert(properSignature == signature);
    }

    ProveTwoValidPrivateKeysDontGenerateTheSameSignatureForTheSameTransaction() {
        var privateKey1 = "[Insert valid private key]";
        var privateKey2 = "[Insert valid private key]";
        var transaction = "[Transaction]";

        var properSignature1 = "[Proper signature]";
        var properSignature2 = "[Proper signature]";

        var signature1 = this.cryptography.SignTransaction(privateKey1, transaction);
        var signature2 = this.cryptography.SignTransaction(privateKey2, transaction);

        Assert(signature1 != signature2);
        Assert(properSignature1 == signature1);
        Assert(properSignature2 == signature2);
    }

    ProveTwoTransactionsDontGenerateTheSameSignatureForTheSamePrivateKey() {
        var privateKey = "[Insert valid private key]";
        var transaction1 = "[Transaction]";
        var transaction2 = "[Transaction]";

        var properSignature1 = "[Proper signature]";
        var properSignature2 = "[Proper signature]";

        var signature1 = this.cryptography.SignTransaction(privateKey, transaction1);
        var signature2 = this.cryptography.SignTransaction(privateKey, transaction2);

        Assert(signature1 != signature2);
        Assert(properSignature1 == signature1);
        Assert(properSignature2 == signature2);
    }

    ProveInvalidPrivateKeysThrowOnSigning() {
        var invalidPrivateKey = "[Insert invalid private key]";
        var transaction = "[Transaction]";
        var properSignature = "[Proper signature]";

        var success = false;

        try {
            var signature = this.cryptography.SignTransaction(invalidPrivateKey, transaction);
        } catch (e) {
            success = true;
        }

        Assert(success);
    }
}

class AccountUnitTests {
    //Test account gets a valid PrivateKey and generates proper PublicHash/PublicKey/PublicAddress
    //Test account gets an invalid PrivateKey and generates an empty class

    //Test valid account can sign a transaction and the right signature is stored on the transaction
}