//https://nodejs.org/api/crypto.html
//https://github.com/cryptocoinjs/bs58

const crypto = require("crypto")
const transactionHelper = require("./transaction.js");
//const base58Encoder = require('base58') //base58Encoder.encode(stuff) //decode
const base58Encoder = require('bs58');
const stringToUInt8ArrayEncoder = new TextEncoder("utf-8");

module.exports = {
    newCryptographyHelper: function() {
       return new CryptographyHelper();
    },
    newCryptographyUnitTests: function() {
        return new CryptographyUnitTests();
    }
 }

class CryptographyHelper {
    SHA256(toHash) {
        const sha256Hasher = crypto.createHash("sha256");
        sha256Hasher.update(toHash);
        const result = sha256Hasher.digest("hex");
        return result;
    }

    GeneratePrivateKey() {
        
    }

    PrivateKeyToPublicHash(privateKey) {
        return this.SHA256(stringToUInt8ArrayEncoder.encode(privateKey));
    }

    PublicHashToPublicKey(publicHash) {
        return this.SHA256(this.SHA256(publicHash));
    }

    PublicKeyToPublicAddress(publicKey) {
        const bytes = Buffer.from(publicKey, 'hex')
        return base58Encoder.encode(bytes);
    }

    SignTransaction(privateKey, transactionHash) {
        const sign = crypto.createSign("SHA256");
        sign.update(transactionHash);
        let result = sign.sign(privateKey, "utf8");
        sign.end();
        return result;
    }

    VerifyTransaction(publicKey, signature, dataSigned) {
        const verify = crypto.createVerify('SHA256');
        verify.write(dataSigned);
        let result = verify.verify(publicKey, signature);
        verify.end();
        return result;
    }

    IsValidPrivateKey(privateKey) {
    }

    IsValidPublicAddress(publicAddress) {
        
    }
}

class CryptographyUnitTests {
    constructor() {
        this.cryptography = new CryptographyHelper()
        
        this.privateKey1 = "UNITTESTPRIVATEKEY";
        this.publicHash1 = "193580dc409c83527610bec05830f2a23ef96f30d49b2993de18d2c407c6894a";
        this.publicKey1 = "f15787b4fcf1b74e40572b877c1573cf565f377ba2ae7498435955dbb2bd6e7d";
        this.publicAddress1 = "HF6fhZTvVryti9ebLjZkQyYqkyEmPLwJubynNEZA8Uda";

        this.privateKey2 = "UnitTestPrivateKey";
        this.publicHash2 = "7a3d09ea9b0cc1e9332411dc0f0578b3b04bd869cd4491ff39e616c0c2bcaa04";
        this.publicKey2 = "0ff57e4e97ab75a0ae06b47aedb71db8f98c3c677e82759a01c4cb45dac32447";
        this.publicAddress2 = "25JEQHzmFmWyX4o5GKKPJacM99jvHA9TSjpSsEaAmNP8";
        
        console.log(this.cryptography.VerifyTransaction(this.publicKey1, this.cryptography.SignTransaction(this.privateKey1, this.cryptography.SHA256("ToHash")), this.cryptography.SHA256("ToHash") ));
    }

    AssertAreEqual(first, second) {
        if (first != second) {
            throw new Error("ASSERT-EQUALITY FAILED: [" + first + "] and [" + second + "]");
        }
    }

    Assert(expression) {
        if (!expression) {
            throw new Error("ASSERT FAILED");
        }
    }

    ////SHA256
    ProveSHA256GivesProperHashes() {
        let toHash = "[To hash]";
        let properResult = "[proper result]";

        let result = this.cryptography.SHA256(toHash);

        this.AssertAreEqual(toHash, properResult);
    }

    ProveSHA256GivesDifferentHashesForDifferentInputs() {
        let toHash1 = "[To hash]";
        let toHash2 = "[To hash]";
        let properResult1 = "[proper result]";
        let properResult2 = "[proper result]";

        let result1 = this.cryptography.SHA256(toHash1);
        let result2 = this.cryptography.SHA256(toHash2);

        this.Assert(result1 != result2);
        this.AssertAreEqual(toHash1, properResult1);
        this.AssertAreEqual(toHash2, properResult2);
    }

    ////BASE56 Encoding/Decoding
    ProvateBASE56EncodesAndDecodes() {
        let toEncode = "[To encode]";
        let properEncoded = "[idea value]";

        let encodedValue = this.cryptography.Base56Encoding(toEncode);
        let decodedValue = this.cryptography.Base56Decoding(encodedValue);

        this.AssertAreEqual(properEncoded, encodedValue);
        this.AssertAreEqual(toEncode, decodedValue);
    }

    ////PRIVATE KEY -> PUBLIC HASH
    ProveValidPrivateKeyMakesProperPublicHash() {
        let createdPublicHash = this.cryptography.PrivateKeyToPublicHash(this.privateKey1);
        this.AssertAreEqual(createdPublicHash, this.publicHash1);
    }

    ProveTwoValidPrivateKeysDontMakeTheSamePublicHash() {
        let createdPublicHash1 = this.cryptography.PrivateKeyToPublicHash(this.privateKey1);
        let createdPublicHash2 = this.cryptography.PrivateKeyToPublicHash(this.privateKey2);

        this.Assert(createdPublicHash1 != createdPublicHash2);
        this.AssertAreEqual(createdPublicHash1, this.publicHash1);
        this.AssertAreEqual(createdPublicHash2, this.publicHash2);
    }

    ProveInvalidPrivateKeyThrowsOnToPublicHash() {
        let invalidPrivateKey = "[Replace with invalid private key]";

        let pass = false;

        try {
            this.cryptography.PrivateKeyToPublicHash(invalidPrivateKey);
        } catch (err) {
            pass = true;
        }

        this.Assert(pass);
    }

    ////PUBLIC HASH -> PUBLIC KEY
    ProvePublicHashCreatesProperPublicKey() {
        let createdPublicKey = this.cryptography.PublicHashToPublicKey(this.publicHash1);
        this.AssertAreEqual(this.publicKey1, createdPublicKey);
    }

    ProveTwoPublicHashesDontGenerateTheSamePublicKey() {
        let createdPublicKey1 = this.cryptography.PublicHashToPublicKey(this.publicHash1);
        let createdPublicKey2 = this.cryptography.PublicHashToPublicKey(this.publicHash2);

        this.Assert(createdPublicKey1 != createdPublicKey2);
        this.AssertAreEqual(this.publicKey1, createdPublicKey1);
        this.AssertAreEqual(this.publicKey2, createdPublicKey2);
    }

    ProvePrivateKeyGeneratesProperPublicKey() {
        let createdPublicKey = this.cryptography.PublicHashToPublicKey(this.cryptography.PrivateKeyToPublicHash(this.privateKey1));

        this.AssertAreEqual(this.publicKey1, createdPublicKey);
    }

    ////PUBLIC KEY -> PUBLIC ADDRESS
    ProvePublicKeyGeneratesProperPublicAddress() {
        let createdPublicAddress = this.cryptography.PublicKeyToPublicAddress(this.publicKey1);

        this.AssertAreEqual(this.publicAddress1, createdPublicAddress);
    }

    ProveTwoPublicKeysDontGenerateTheSamePublicAddress() {
        let createdPublicAddress1 = this.cryptography.PublicKeyToPublicAddress(this.publicKey1);
        let createdPublicAddress2 = this.cryptography.PublicKeyToPublicAddress(this.publicKey2);

        this.Assert(createdPublicAddress1 != createdPublicAddress2);
        this.AssertAreEqual(createdPublicAddress1, this.publicAddress1);
        this.AssertAreEqual(createdPublicAddress2, this.publicAddress2);
    }

    ProvePrivateKeyGeneratesProperPublicAddress() {
        let publicHash = this.cryptography.PrivateKeyToPublicHash(this.privateKey1);
        let publicKey = this.cryptography.PublicHashToPublicKey(publicHash);
        let publicAddress = this.cryptography.PublicKeyToPublicAddress(publicKey);

        this.AssertAreEqual(this.publicAddress1, publicAddress);
    }

    ////TRANSACTION SIGNING
    ProveValidPrivateKeyCanSignTransaction() {
        let transaction = "SignThisData";
        let properSignature = "[Proper signature]";

        let signature = this.cryptography.SignTransaction(this.privateKey1, transaction);

        this.AssertAreEqual(properSignature, signature);
    }

    ProveTwoValidPrivateKeysDontGenerateTheSameSignatureForTheSameTransaction() {
        let privateKey1 = "[Insert valid private key]";
        let privateKey2 = "[Insert valid private key]";
        let transaction = "[Transaction]";

        let properSignature1 = "[Proper signature]";
        let properSignature2 = "[Proper signature]";

        let signature1 = this.cryptography.SignTransaction(privateKey1, transaction);
        let signature2 = this.cryptography.SignTransaction(privateKey2, transaction);

        this.Assert(signature1 != signature2);
        this.AssertAreEqual(properSignature1, signature1);
        this.AssertAreEqual(properSignature2, signature2);
    }

    ProveTwoTransactionsDontGenerateTheSameSignatureForTheSamePrivateKey() {
        let privateKey = "[Insert valid private key]";
        let transaction1 = "[Transaction]";
        let transaction2 = "[Transaction]";

        let properSignature1 = "[Proper signature]";
        let properSignature2 = "[Proper signature]";

        let signature1 = this.cryptography.SignTransaction(privateKey, transaction1);
        let signature2 = this.cryptography.SignTransaction(privateKey, transaction2);

        this.Assert(signature1 != signature2);
        this.AssertAreEqual(properSignature1, signature1);
        this.AssertAreEqual(properSignature2, signature2);
    }

    ProveInvalidPrivateKeysThrowOnSigning() {
        let invalidPrivateKey = "[Insert invalid private key]";
        let transaction = "[Transaction]";
        let properSignature = "[Proper signature]";

        let success = false;

        try {
            let signature = this.cryptography.SignTransaction(invalidPrivateKey, transaction);
        } catch (e) {
            success = true;
        }

        this.Assert(success);
    }

    RunTests() {
        console.log("UnitTest::Cryptography::Begin");
        ////SHA256 WORKS AS EXPECTED
        /*ProveSHA256GivesProperHashes();
        ProveSHA256GivesDifferentHashesForDifferentInputs();*/

        ////BASE56 ENCODING WORKS AS EXPECTED
        //ProvateBASE56EncodesAndDecodes();

        ////PRIVATE KEY -> PUBLIC HASH
        this.ProveValidPrivateKeyMakesProperPublicHash();
        this.ProveTwoValidPrivateKeysDontMakeTheSamePublicHash();
        //this.ProveInvalidPrivateKeyThrowsOnToPublicHash();
        
        ////PUBLIC HASH -> PUBLIC KEY
        this.ProvePublicHashCreatesProperPublicKey();
        this.ProveTwoPublicHashesDontGenerateTheSamePublicKey();
        this.ProvePrivateKeyGeneratesProperPublicKey();

        ////PUBLIC KEY -> PUBLIC ADDRESS
        this.ProvePublicKeyGeneratesProperPublicAddress();
        this.ProveTwoPublicKeysDontGenerateTheSamePublicAddress();
        this.ProvePrivateKeyGeneratesProperPublicAddress();

        ////TRANSACTION SIGNING
        /*ProveValidPrivateKeyCanSignTransaction();
        ProveTwoValidPrivateKeysDontGenerateTheSameSignatureForTheSameTransaction();
        ProveTwoTransactionsDontGenerateTheSameSignatureForTheSamePrivateKey();
        ProveInvalidPrivateKeysThrowOnSigning();*/
        console.log("UnitTest::Cryptography::Complete");
    }
}