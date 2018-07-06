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

module.exports = {
    newCryptoHelper: function() {
       return new CryptoHelper();
    },
    runUnitTests : function() {
        console.log("UnitTests :: cryptoHelper.js :: Begin");
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
        console.log("UnitTests :: cryptoHelper.js :: Complete");
    }
 }

 const crypto = require("crypto")
 const base58Encoder = require('bs58');
 const stringToUInt8ArrayEncoder = new TextEncoder("utf-8");

//Eliptic PublicKey Encryption, SHA256 Hashing and Base58 Encoding wrapper
class CryptoHelper {
    /**
     * Fast string-to-hashcode JavaScript implementation based off of the Java implementation
     * 
     * Repurposed from: https://stackoverflow.com/a/7616484/4907948
     */
    fastStringHashCode(stringToHash) {
        let hash = 0;
        let chr = 0;
        if (stringToHash.length === 0) {
            return hash
        };
        for(let i = 0; i < stringToHash.length; i++) {
            chr = stringToHash.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    //SHA256 hash 
    sha256(toHash) {
        if (toHash == null) {
            throw new Error("Cannot hash empty data");
        }
        return crypto.createHash("sha256").update(toHash).digest("hex");
    }

    //options: { entropy : "ExtraEntropyRequiresAbout80ExtraBytes" }
    generatePrivateKey(options) {
        return this.generateKeyPair(options).privateKey;
    }

    //options: { entropy : "ExtraEntropyRequiresAbout80ExtraBytes" }
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

    isPublicKeyValid(publicKey) {
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
        try {
            ec.keyFromPublic(publicKey, 'hex');
        } catch(e) {
            console.log(e);
            return false;
        }
        return true;
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
        let encoded = signature.toDER('hex');
        return encoded;
    }

    verifySignature(publicKey, signature, data) {
        let hash = this.sha256(data);
        let EC = require('elliptic').ec;
        let ec = new EC('secp256k1');
        let key = ec.keyFromPublic(publicKey, 'hex');;
        let result = false;
        try {
            result = key.verify(hash, signature);
        } catch (e) {

        }
        return result;
    }

    hashToChecksum(hashToChecksum) {
        if (hashToChecksum == undefined || hashToChecksum == null || hashToChecksum.length < 4) {
            throw new Error("Not valid data to checksum");
        }
        return hashToChecksum.substring(0, 4);
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
        let publicKey = "04caae0f0c1c3b06081759b3a5f4c3ed1792594be080b4caef10395280e63f2613397715c67cd8047b43909c4d990908997fef303419c7d9e756de9335cd8e55c6";
        let desiredPublicAddress = "RXTydsXRVzex9P3EmACTPPfSbTdhZ4kiUKAmVpgyDL3aDiLvZycSnkPFGKxR7wzdzyEQ32LgEikMkjHFyXw75TJ5";
        let actualPublicAddress = cryptoHelper.publicKeyToPublicAddress(publicKey);
        this.assert(desiredPublicAddress == actualPublicAddress, "Failed to generate the proper base58 encoded address");
    }
    PublicKeyToPublicAddress_throwsOnEmptyData() {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            cryptoHelper.publicKeyToPublicAddress(null);
        } catch (e) {
            success = true;
        }
        this.assert(success, "Failed to throw on empty data");
    }
    Sign_createsProperSignature() {
        let cryptoHelper = new CryptoHelper();
        let privateKey = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let signature = "30450221009890126d6f75445ff3eea197a5a129ac6191fe68c2e2797381f17889df2fb551022079f19c6c3613d2d48eab1816aae82858da55a23d9da26c6a3920547afa4a6501";
        let data = "Data";
        let publicKeyMade = cryptoHelper.getPublicKey(privateKey);
        let newSig = cryptoHelper.sign(publicKeyMade, data);
        this.assert(newSig == signature, "Failed to create proper signature");
    }
    Sign_throwsOnEmptyData() {
        let cryptoHelper = new CryptoHelper();
        let pair = cryptoHelper.generateKeyPair();
        let success = false;
        try {
            let newSig = cryptoHelper.sign(pair.privateKey, null);
        } catch (e) {
            success = true;
        }
        this.assert(success, "Failed to throw on null data being signed");
    }
    VerifySignature_verifiesValidSignatures() {
        let cryptoHelper = new CryptoHelper();
        let privateKey = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let signature = "304402202c36a015e6c977f3dce025e14283a4436f1148b6dcf9e55274ae713e67a9168002203e8c78c10657f23c53a008dbcf6e69d06206f0d7ee1c80a739a68ec0edf62b7f";
        let data = "Data";
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        this.assert(cryptoHelper.verifySignature(publicKey, signature, data), "Failed to verify proper signature");
    }
    VerifySignature_failsOnInvalidSignature() {
        let cryptoHelper = new CryptoHelper();
        let privateKey = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let signature = "BadSignature";
        let data = "Data";
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        this.assert(cryptoHelper.verifySignature(publicKey, signature, data) == false, "Failed to fail on bad signature");
    }
    VerifySignature_cantVerifyOtherAccountsSignature() {
        let cryptoHelper = new CryptoHelper();
        let privateKey1 = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let privateKey2 = cryptoHelper.generatePrivateKey();
        let signature = "304402202c36a015e6c977f3dce025e14283a4436f1148b6dcf9e55274ae713e67a9168002203e8c78c10657f23c53a008dbcf6e69d06206f0d7ee1c80a739a68ec0edf62b7f";
        let data = "Data";
        let publicKey1 = cryptoHelper.getPublicKey(privateKey1);
        let publicKey2 = cryptoHelper.getPublicKey(privateKey2);
        this.assert(cryptoHelper.verifySignature(publicKey2, signature, data) == false, "Should fail on validating the wrong signature");
        this.assert(cryptoHelper.verifySignature(publicKey1, signature, data), "Should validate the right signature");
    }
}