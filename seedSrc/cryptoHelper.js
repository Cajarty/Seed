/*##############################################################
ClassDesign: /seedSrc/cryptography_classDesignsAndTests.txt

CryptoHelper:
    SHA256(data):
        //returns a SHA256 hash of the data. Throws if data is empty
    GeneratePrivateKey(optionalEntropy):
        //returns a generated privateKey for an sepk256 elliptic curve. Optional extra entropy
    GenerateKeyPair(optionalEntropy):
        //returns a generated privateKey and publicKey for an sepk256 elliptic curve. Optional entropy
    GetPublicKey(privateKey):
        //returns the public key attributed with a given private key. Throws if null or empty key
    PublicKeyToPublicAddress(publicKey, network):
        //returns the base58check encoded public address for a given key network (e.g. "01" test, "00" main)
    Sign(privateKey, data):
        //returns a signature for the given data by a given private key. Throws on empty or null privateKey or data
    VerifySignature(publicKey, signature, data):
        //returns a bool for whether the signature is valid. Throws for empty publicKey, signature or data
##############################################################*/

const crypto = require("crypto")
const transactionHelper = require("./transaction.js");
const base58Encoder = require('bs58');
const stringToUInt8ArrayEncoder = new TextEncoder("utf-8");

module.exports = {
    newCryptoHelper: function() {
       return new CryptoHelper();
    },
    runCryptoHelperUnitTests : function() {
        let tester = new CryptoHelperUnitTests();
        tester.SHA256_hashesValidData();
        tester.SHA256_hashesSmallData();
        tester.SHA256_hashesLargeData();
        tester.SHA256_throwsOnEmptyData();
        tester.GeneratePrivateKey_generatesProperPrivateKey();
        tester.GeneratePrivateKey_entropyCanBeAdded();
        tester.GenerateKeyPair_generatesProperKeyPair();
        tester.GenerateKeyPair_entropyCanBeAdded();
        tester.GetPublicKey_getsProperPublicKey();
        tester.GetPublicKey_throwsOnNullPrivate();
        tester.PublicKeyToPublicAddress_getsProperAddress();
        tester.PublicKeyToPublicAddress_throwsOnEmptyData();
        tester.Sign_createsProperSignature();
        tester.Sign_throwsOnEmptyData();
        tester.VerifySignature_verifiesValidSignatures();
        tester.VerifySignature_failsOnInvalidSignature();
        tester.VerifySignature_cantVerifyOtherAccountsSignature();
    }
 }

class CryptoHelper {
    sha256(toHash) {
        if (toHash == null) {
            throw new Error("Cannot hash empty data");
        }
        return crypto.createHash("sha256").update(toHash).digest("hex");
    }

    generatePrivateKey(options) {
        return this.generateKeyPair(options).privateKey;
    }

    generateKeyPair(options) {
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
        let keyPair = ec.genKeyPair(options);
        return { privateKey: keyPair.getPrivate('hex'), publicKey: keyPair.getPublic('hex') };
    }

    getPublicKey(privateKey) {
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
        let keyPair = ec.keyFromPrivate(privateKey, 'hex');
        return keyPair.getPublic("hex");
    }

    publicKeyToPublicAddress(publicKey) {
        const bytes = Buffer.from(publicKey, 'hex')
        return base58Encoder.encode(bytes);
    }

    sign(privateKey, data) {
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
        let key = ec.keyFromPrivate(privateKey, 'hex');
        let hash = this.sha256(data);
        let signature = key.sign(hash);
        // Export DER encoded signature in Array
        let encoded = signature.toDER();
        return signature;
    }

    verifySignature(publicKey, signature, data) {
        let hash = this.sha256(data);
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
        let key = ec.keyFromPublic(publicKey, 'hex');
        return key.verify(hash, signature);
    }
}

/*#####################UNIT TESTS###########################
CryptoHelperUnitTests:
    SHA256_hashesValidData:
    SHA256_hashesSmallData:
    SHA256_hashesLargeData:
    SHA256_throwsOnEmptyData:
    GeneratePrivateKey_generatesProperPrivateKey:
    GeneratePrivateKey_entropyCanBeAdded:
    GenerateKeyPair_generatesProperKeyPair:
    GenerateKeyPair_entropyCanBeAdded:
    GetPublicKey_getsProperPublicKey:
    GetPublicKey_throwsOnNullPrivate:
    PublicKeyToPublicAddress_getsProperAddress:
    PublicKeyToPublicAddress_throwsOnEmptyData:
    Sign_createsProperSignature:
    Sign_throwsOnEmptyData:
    VerifySignature_verifiesValidSignatures:
    VerifySignature_failsOnInvalidSignature:
    VerifySignature_cantVerifyOtherAccountsSignature:
##############################################################*/

class CryptoHelperUnitTests {
    assert(expression, failMessage) {
        if (!expression) {
            throw new Error(failMessage);
        }
    }

    SHA256_hashesValidData() {
        let cryptoHelper = new CryptoHelper();
        let hash = cryptoHelper.sha256("TestData");
        let realHash = "814d78962b0f8ac2bd63daf9f013ed0c07fe67fbfbfbc152b30a476304a0535d";
        this.assert(hash == realHash, "Failed to generate correct SHA256 hash");
    }
    SHA256_hashesSmallData() {
        let cryptoHelper = new CryptoHelper();
        let hash = cryptoHelper.sha256("l");
        let realHash = "acac86c0e609ca906f632b0e2dacccb2b77d22b0621f20ebece1a4835b93f6f0";
        this.assert(hash == realHash, "Failed to generate correct SHA256 hash");
    }
    SHA256_hashesLargeData() {
        let cryptoHelper = new CryptoHelper();
        let hash = cryptoHelper.sha256("This is a lot of data to hash. Wow, look at thow many bits this is. This is some proper, high quality unit testing going on. Sooooooo many bits. Thanks for staying with us tonight folks, just wanna make sure that this thing doesent actually care about the length of the string being passed in... or array. Damnit, I guess I need to do this for a regular array sometime. I think it'll be fine for now though");
        let realHash = "a0793d2b62d37b62a906423749713e44b3dec4fd87a2862671f808ed83de09d2";
        this.assert(hash == realHash, "Failed to generate correct SHA256 hash");
    }
    SHA256_throwsOnEmptyData() {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            let hash = cryptoHelper.sha256(null);
        } catch (e) {
            success = true;
        }
        this.assert(success, "Failed to throw on null data");
    }
    GeneratePrivateKey_generatesProperPrivateKey() {
        let cryptoHelper = new CryptoHelper();
        let privateKey = cryptoHelper.generatePrivateKey();
        
        //A proper private key can sign and verify
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        let signature = cryptoHelper.sign(privateKey, "Data");

        this.assert(cryptoHelper.verifySignature(publicKey, signature, "Data"), "Private key generated failed to perform");
    }
    GeneratePrivateKey_entropyCanBeAdded() {
        let cryptoHelper = new CryptoHelper();
        let privateKey = cryptoHelper.generatePrivateKey({ entropy: "dfh3hfiu34hf3784h3784fh374gf73g4f783h47fg34fg348f837yrh384f7834f3y84hf834f" });
        
        //A proper private key can sign and verify
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        let signature = cryptoHelper.sign(privateKey, "Data");
        this.assert(cryptoHelper.verifySignature(publicKey, signature, "Data"), "Private key generated failed to perform");
    }
    GenerateKeyPair_generatesProperKeyPair() {
        let cryptoHelper = new CryptoHelper();
        let keyPair = cryptoHelper.generateKeyPair();
        
        //A proper key pair key can sign and verify
        let signature = cryptoHelper.sign(keyPair.privateKey, "Data");
        this.assert(cryptoHelper.verifySignature(keyPair.publicKey, signature, "Data"), "Private key generated failed to perform");
    }
    GenerateKeyPair_entropyCanBeAdded() {
        let cryptoHelper = new CryptoHelper();
        let keyPair = cryptoHelper.generateKeyPair({ entropy : "saddfh3hfiu34hf3784h3784fh374gf73g4f783h47fg34fg348f837yrh384f7834f3y84hf834f" });
        
        //A proper key pair key can sign and verify
        let signature = cryptoHelper.sign(keyPair.privateKey, "Data");
        this.assert(cryptoHelper.verifySignature(keyPair.publicKey, signature, "Data"), "Private key generated failed to perform");
    }
    GetPublicKey_getsProperPublicKey() {
        let cryptoHelper = new CryptoHelper();
        let privateKey = cryptoHelper.generatePrivateKey({ entropy : "saddfh3hfiu34hf3784h3784fh374gf73g4f783h47fg34fg348f837yrh384f7834f3y84hf834f" });
        let publicKey = cryptoHelper.getPublicKey(privateKey);

        //A proper key pair key can sign and verify
        let signature = cryptoHelper.sign(privateKey, "Data");
        this.assert(cryptoHelper.verifySignature(publicKey, signature, "Data"), "Private key generated failed to perform");
    }
    GetPublicKey_throwsOnNullPrivate() {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            cryptoHelper.getPublicKey(null);
        } catch (e) {
            success = true;
        }
        this.assert(success, "Failed to throw on invalid private key");
    }
    PublicKeyToPublicAddress_getsProperAddress() {
        let cryptoHelper = new CryptoHelper();
        
    }
    PublicKeyToPublicAddress_throwsOnEmptyData() {
        let cryptoHelper = new CryptoHelper();
    }
    Sign_createsProperSignature() {
        let cryptoHelper = new CryptoHelper();
    }
    Sign_throwsOnEmptyData() {
        let cryptoHelper = new CryptoHelper();
    }
    VerifySignature_verifiesValidSignatures() {
        let cryptoHelper = new CryptoHelper();
    }
    VerifySignature_failsOnInvalidSignature() {
        let cryptoHelper = new CryptoHelper();
    }
    VerifySignature_cantVerifyOtherAccountsSignature() {
        let cryptoHelper = new CryptoHelper();
    }
}

/*class CryptographyUnitTests {
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

    ////KEY GENERATION
    ProveValidKeyGenerationViaKeyPair() {
        let keyPair = this.cryptography.GenerateKeyPair();
        let transactionHash = this.cryptography.SHA256("[ToSign]");
        
        let signature = this.cryptography.SignTransaction(keyPair.privateKey, transactionHash);

        let validation = this.cryptography.VerifyTransaction(keyPair.publicKey, signature, transactionHash);

        this.Assert(validation);
    }

    ProveValidKeyGenerationViaPrivateKey() {
        let privateKey = this.cryptography.GeneratePrivateKey();
        let publicKey = this.cryptography.GetPublicKey(privateKey);
        let transactionHash = this.cryptography.SHA256("[ToSign]");
        
        let signature = this.cryptography.SignTransaction(privateKey, transactionHash);

        let validation = this.cryptography.VerifyTransaction(publicKey, signature, transactionHash);

        this.Assert(validation);
    }

    ProveDifferentKeyGenerationEachTime() {
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
    }

    ProveWorksWithExtraEntropy() {
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
    }


    RunTests() {
        console.log("UnitTest::Cryptography::Begin");
        ////SHA256 WORKS AS EXPECTED
        //ProveSHA256GivesProperHashes();
        //ProveSHA256GivesDifferentHashesForDifferentInputs();

        ////BASE56 ENCODING WORKS AS EXPECTED
        //ProvateBASE56EncodesAndDecodes();

        ////KEY GENERATION
        this.ProveValidKeyGenerationViaKeyPair();
        this.ProveValidKeyGenerationViaPrivateKey();

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
        //ProveValidPrivateKeyCanSignTransaction();
        //ProveTwoValidPrivateKeysDontGenerateTheSameSignatureForTheSameTransaction();
        //ProveTwoTransactionsDontGenerateTheSameSignatureForTheSamePrivateKey();
        //ProveInvalidPrivateKeysThrowOnSigning();
        console.log("UnitTest::Cryptography::Complete");
    }
}*/