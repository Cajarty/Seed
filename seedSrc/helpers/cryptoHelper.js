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
    getUnitTests : function() {
        return cryptoUnitTests;
    }
 }

 const crypto = require("crypto")
 const base58Encoder = require('bs58');
 const unitTestingExporter = require("../tests/unitTesting.js");
 
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
    SHA256_throwsOnUndefinedData:
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
const cryptoUnitTests = {
    /**
     * Correctly hash with SHA256.
     */
    SHA256_hashesValidData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let hash = cryptoHelper.sha256("TestData");
        let realHash = "814d78962b0f8ac2bd63daf9f013ed0c07fe67fbfbfbc152b30a476304a0535d";
        test.assertAreEqual(hash, realHash, "Failed to generate correct SHA256 hash");
    },
    /**
     * Correctly hashes small data with SHA256.
     */
    SHA256_hashesSmallData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let hash = cryptoHelper.sha256("l");
        let realHash = "acac86c0e609ca906f632b0e2dacccb2b77d22b0621f20ebece1a4835b93f6f0";
        test.assertAreEqual(hash, realHash, "Failed to generate correct SHA256 hash");
    },
    /**
     * Correctly hashes large data with SHA256.
     */
    SHA256_hashesLargeData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let hash = cryptoHelper.sha256("This is a lot of data to hash. Wow, look at thow many bits this is. This is some proper, high quality unit testing going on. Sooooooo many bits. Thanks for staying with us tonight folks, just wanna make sure that this thing doesent actually care about the length of the string being passed in... or array. Damnit, I guess I need to do this for a regular array sometime. I think it'll be fine for now though");
        let realHash = "a0793d2b62d37b62a906423749713e44b3dec4fd87a2862671f808ed83de09d2";
        test.assertAreEqual(hash, realHash, "Failed to generate correct SHA256 hash");
    },
    /**
     * Throws a error message when attempting to hash undefined data.
     */
    SHA256_throwsOnUndefinedData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            let hash = cryptoHelper.sha256(undefined);
        } catch (e) {
            success = true;
        }
        test.assert(success, "Failed to throw on undefined data");
    },
    /**
     * Throws a error message when attempting to hash empty data.
     */
    SHA256_throwsOnEmptyData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            let hash = cryptoHelper.sha256("");
        } catch (e) {
            success = true;
        }
        test.assert(success, "Failed to throw on empty data");
    },
    /**
     * Correctly generates a private key
     */
    GeneratePrivateKey_generatesProperPrivateKey : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey = cryptoHelper.generatePrivateKey();
        
        //A proper private key can sign and verify
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        let signature = cryptoHelper.sign(privateKey, "Data");

        test.assert(cryptoHelper.verifySignature(publicKey, signature, "Data"), "Private key generated failed to perform");
    },
    /**
     * Correctly generates a private key with user defined entropy.
     */
    GeneratePrivateKey_entropyCanBeAdded : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey = cryptoHelper.generatePrivateKey({ entropy: "dfh3hfiu34hf3784h3784fh374gf73g4f783h47fg34fg348f837yrh384f7834f3y84hf834f" });
        
        //A proper private key can sign and verify
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        let signature = cryptoHelper.sign(privateKey, "Data");
        test.assert(cryptoHelper.verifySignature(publicKey, signature, "Data"), "Private key generated failed to perform");
    },
    /**
     * Correctly fetches the public key that belongs to a proposed private key.
     */
    GenerateKeyPair_generatesProperKeyPair : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let keyPair = cryptoHelper.generateKeyPair();
        
        //A proper key pair key can sign and verify
        let signature = cryptoHelper.sign(keyPair.privateKey, "Data");
        test.assert(cryptoHelper.verifySignature(keyPair.publicKey, signature, "Data"), "Private key generated failed to perform");
    },
    /**
    * Correctly generates a key pair with entropy
    */
    GenerateKeyPair_entropyCanBeAdded : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let keyPair = cryptoHelper.generateKeyPair({ entropy : "saddfh3hfiu34hf3784h3784fh374gf73g4f783h47fg34fg348f837yrh384f7834f3y84hf834f" });
        
        //A proper key pair key can sign and verify
        let signature = cryptoHelper.sign(keyPair.privateKey, "Data");
        test.assert(cryptoHelper.verifySignature(keyPair.publicKey, signature, "Data"), "Private key generated failed to perform");
    },
    /**
     * Correctly fetches the public key that belongs to a proposed private key.
     */
    GetPublicKey_getsProperPublicKey : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey = cryptoHelper.generatePrivateKey({ entropy : "saddfh3hfiu34hf3784h3784fh374gf73g4f783h47fg34fg348f837yrh384f7834f3y84hf834f" });
        let publicKey = cryptoHelper.getPublicKey(privateKey);

        //A proper key pair key can sign and verify
        let signature = cryptoHelper.sign(privateKey, "Data");
        test.assert(cryptoHelper.verifySignature(publicKey, signature, "Data"), "Private key generated failed to perform");
    },
    /**
     * Throws a error message when attempting to fetch the public key for a undefined private key.
     */
    GetPublicKey_throwsOnNullPrivate : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            cryptoHelper.getPublicKey(null);
        } catch (e) {
            success = true;
        }
        test.assert(success, "Failed to throw on invalid private key");
    },
    /**
     * Correctly takes a public key and correctly converts it to a public address.
     */
    PublicKeyToPublicAddress_getsProperAddress : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let publicKey = "04caae0f0c1c3b06081759b3a5f4c3ed1792594be080b4caef10395280e63f2613397715c67cd8047b43909c4d990908997fef303419c7d9e756de9335cd8e55c6";
        let desiredPublicAddress = "RXTydsXRVzex9P3EmACTPPfSbTdhZ4kiUKAmVpgyDL3aDiLvZycSnkPFGKxR7wzdzyEQ32LgEikMkjHFyXw75TJ5";
        let actualPublicAddress = cryptoHelper.publicKeyToPublicAddress(publicKey);
        test.assertAreEqual(desiredPublicAddress, actualPublicAddress, "Failed to generate the proper base58 encoded address");
    },
    /**
     * Throws a error message when a empty parameter is passed in instead of a valid public key.
     */
    PublicKeyToPublicAddress_throwsOnEmptyData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let success = false;
        try {
            cryptoHelper.publicKeyToPublicAddress(null);
        } catch (e) {
            success = true;
        }
        test.assert(success, "Failed to throw on empty data");
    },
    /**
     * Correctly signs data on behalf of a private key.
     */
    Sign_createsProperSignature : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let signature = "30450221009890126d6f75445ff3eea197a5a129ac6191fe68c2e2797381f17889df2fb551022079f19c6c3613d2d48eab1816aae82858da55a23d9da26c6a3920547afa4a6501";
        let data = "Data";
        let publicKeyMade = cryptoHelper.getPublicKey(privateKey);
        let newSig = cryptoHelper.sign(publicKeyMade, data);
        test.assertAreEqual(newSig, signature, "Failed to create proper signature");
    },
    /**
     * Throws a error message when a undefined parameter is passed in instead of a valid private key.
     */
    Sign_throwsOnEmptyData : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let pair = cryptoHelper.generateKeyPair();
        let success = false;
        try {
            let newSig = cryptoHelper.sign(pair.privateKey, null);
        } catch (e) {
            success = true;
        }
        test.assert(success, "Failed to throw on null data being signed");
    },
    /**
     * Correctly verifies the validity of a signature. 
     */
    VerifySignature_verifiesValidSignatures : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let signature = "304402202c36a015e6c977f3dce025e14283a4436f1148b6dcf9e55274ae713e67a9168002203e8c78c10657f23c53a008dbcf6e69d06206f0d7ee1c80a739a68ec0edf62b7f";
        let data = "Data";
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        test.assert(cryptoHelper.verifySignature(publicKey, signature, data), "Failed to verify proper signature");
    },
    /**
     * Catches invalid signatures when failing to validate them.
     */
    VerifySignature_failsOnInvalidSignature : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let signature = "BadSignature";
        let data = "Data";
        let publicKey = cryptoHelper.getPublicKey(privateKey);
        test.assertAreEqual(cryptoHelper.verifySignature(publicKey, signature, data), false, "Failed to fail on bad signature");
    },
    /**
     * Throws a error message when a undefined parameter is passed in instead of a valid hash key.
     */
    VerifySignature_cantVerifyOtherAccountsSignature : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let privateKey1 = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let privateKey2 = cryptoHelper.generatePrivateKey();
        let signature = "304402202c36a015e6c977f3dce025e14283a4436f1148b6dcf9e55274ae713e67a9168002203e8c78c10657f23c53a008dbcf6e69d06206f0d7ee1c80a739a68ec0edf62b7f";
        let data = "Data";
        let publicKey1 = cryptoHelper.getPublicKey(privateKey1);
        let publicKey2 = cryptoHelper.getPublicKey(privateKey2);
        test.assertAreEqual(cryptoHelper.verifySignature(publicKey2, signature, data), false, "Should fail on validating the wrong signature");
        test.assert(cryptoHelper.verifySignature(publicKey1, signature, data), "Should validate the right signature");
    },
    /**
     * Correctly generates the proper checksum when given a valid hash.
     */
    HashToChecksum_generatesProperChecksum : function(test, verbose, log) {
        let cryptoHelper = new CryptoHelper();
        let hash = "4eaad9d904d152a6ec92378720a8554fde49061ffd1ec8a0806af56c38eabb29";
        let actualChecksum = "4eaa";
        let returnedChecksum = cryptoHelper.hashToChecksum(hash);
        test.assertAreEqual(actualChecksum, returnedChecksum, "The checksum was supposed to be " + actualChecksum + " However was " + returnedChecksum);

    }
}