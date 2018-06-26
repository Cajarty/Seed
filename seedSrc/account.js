/*##############################################################
ClassDesign: /seedSrc/cryptography_classDesignsAndTests.txt

AccountExporter:
    newAccount(wrapperInfoObject):
        //Creates a new account, stores it in this file in a dictionary, then returns a shell version
        //back without a private key stored that can request from the original to sign when needed
        //This is to avoid leaking private keys to the global namespace
    logIn(existingAccount):
        //Takes an account that's already built and hooks it into the system

Account:
    constructor(entropy):
        //Creates a new user with a new privateKey/publicKey using the added entropy
    constructor(privateKey):
        //Creates with ability to sign & validate signatures
    constructor(publicKey):
        //Creates with ability to validate signatures
    sign(data):
        //Signs a transaction, applying their signature to it
        //throws if not a privateKey created Account
    verifySignature(signature, data):
        //Verifys that they did sign a transaction
##############################################################*/

const cryptographyExporter = require("./helpers/cryptoHelper.js");

//Dictionary of { publicKey : Account }'s for logged in accounts
let loggedInAccounts = {};

module.exports = {
    /*
        Exported Function used to encapsulate account creation. Accounts with private keys are stored in this file
        and return shell Account results back. This is done to not leak private keys into the global namespace, however
        security is still too low with this method.
    */
    newAccount: function(info) {
       let account = new Account(info);
       if (account.privateKey != null && account.publicKey != null && loggedInAccounts[account.publicKey] == null) {
           //Log in, don't return with the key
           loggedInAccounts[account.publicKey] = account;

           account = new Account({ publicKey : account.publicKey, network : info.network });
       }
       return account;
    },
    /*
        Exported function to encapsulate logging in should someone construct their own Account object. Error checking
        is required in order to make sure they pass a valid object in.
    */
    logIn: function(account) {
        //If already logged in, we reject, that way no program can try to swap users
        if (account.privateKey != null && account.publicKey != null && account.publicAddress != null && loggedInAccounts[account.publicKey] == null) {
           //Test account is valid
           loggedInAccounts[account.publicKey] = account;
        } else {
            throw new Error("Trying to log into an account that is not valid");
        }
    },
    runUnitTests: function() {
        console.log("UnitTests :: account.js :: Begin");
        let unitTests = new AccountUnitTests();
        unitTests.constructor_privateKeyGeneratesValidData();
        unitTests.constructor_nullPrivateKeyThrows();
        unitTests.constructor_publicKeyGeneratesValidData();
        unitTests.constructor_nullPublicKeyThrows();
        unitTests.canSign_returnsTrueForPrivateKeyAccounts();
        unitTests.canSign_returnsFalseForPublicKeyAccounts();
        unitTests.sign_privateKeyAccountCanSignAndVerify();
        unitTests.sign_publicKeyAccountThrows();
        unitTests.sign_twoAccountsOneTransactionGenerateDifferentSignatures();
        unitTests.sign_oneAccountTwoTransactionsGenerateDifferentSignatures();
        unitTests.verify_publicKeyAccountsCanVerify();
        unitTests.verify_returnsFalseOnBadSignatures();
        unitTests.verify_cantVerifySignaturesAAccountDidntSign();
        //unitTests.accountExporter_newAccountHasNoPrivateKey();
        //unitTests.accountExporter_newAccountCanStillSignWithoutPrivateKey();
        //unitTests.accountExporter_logInLogsInValidAccounts();

        console.log("UnitTests :: account.js :: Complete");
    }
 }

class Account {
    // info { privateKey : key, publicKey : key, entropy : entropy }
    constructor(info) {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        if (info.network != null) {
            //Are you us
            if (info.privateKey != null) {
                this.privateKey = info.privateKey;
                this.publicKey = cryptoHelper.getPublicKey(this.privateKey);
                this.publicAddress = cryptoHelper.publicKeyToPublicAddress(this.publicKey, info.network);
            } 
            //Are you a generic user
            else if (info.publicKey != null) {
                this.privateKey = null;
                this.publicKey = info.publicKey;
                this.publicAddress = cryptoHelper.publicKeyToPublicAddress(this.publicKey, info.network);
            } 
            //Are we a new user
            else if (info.entropy != null) {
                let keys = cryptoHelper.generateKeyPair({ entropy : info.entropy });
                this.privateKey = keys.privateKey;
                this.publicKey = keys.publicKey;
                this.publicAddress = cryptoHelper.publicKeyToPublicAddress(this.publicKey, info.network);
            } else {
                throw new Error("Either privateKey, publicKey or entropy must be set to create an account");
            }
        } else {
            throw new Error("No network information set for account");
        }
    }

    /* 
        Signs a transaction if the data is loaded. If this account cannot sign itself, it checks
        the list of logged in accounts and see's if one there matches its public key, then asks
        the logged in equivalent account to sign on its behalf. This is done to allow shell Accounts
        without the private keys saved to be passed around in the glboal namespace, without leaking
        private keys.
    */
    sign(data) {
        if (data != null) {
            //If we can sign, sign
            if (this.canSign()) {
                return cryptographyExporter.newCryptoHelper().sign(this.privateKey, data);
            }
            //If we can't sign, but our logged in person exists, try them 
            else if (this.publicKey != null && loggedInAccounts[this.publicKey] != null) {
                let loggedInAccount = loggedInAccounts[this.publicKey];
                if (loggedInAccount.privateKey != null) {
                    return loggedInAccount.sign(data);
                } else {
                    throw new Error("Failed to sign with any private key. Not logged in to this account")
                }
            //Otherwise, failed to sign
            } else {
                throw new Error("Failed to sign, account is invalid");
            }
        } else {
            throw new Error("Failed to sign because the data was null");
        }
    }

    //Any user can verify signatures with the publicKey, signature and data
    verifySignature(signature, data) {
        if (this.publicKey != null) {
            if (signature != null && data != null) {
                let result;
                try {
                    result = cryptographyExporter.newCryptoHelper().verifySignature(this.publicKey, signature, data);
                } catch (e) {
                    return false; //Failed to validate
                }
                return result;
            } else {
                throw new Error("Cannot verify null signatures or data");
            }
        } else {
            throw new Error("Cannot verify a signature without a public key");
        }
    }

    canSign() {
        return this.privateKey != null;
    }
}

/*#####################UNIT TESTS###########################
AccountUnitTests:
    constructor_privateKeyGeneratesValidData():
    constructor_nullPrivateKeyThrows():
    constructor_publicKeyGeneratesValidData():
    constructor_nullPublicKeyThrows():
    constructor_entropyGeneratesKeys():
    canSign_returnsTrueForPrivateKeyAccounts():
    canSign_returnsFalseForPublicKeyAccounts():
    sign_privateKeyAccountCanSign():
    sign_publicKeyAccountThrows():
    sign_twoAccountsOneTransactionGenerateDifferentSignatures():
    sign_oneAccountTwoTransactionsGenerateDifferentSignatures():
    verify_privateKeyAccountsCanVerify():
    verify_publicKeyAccountsCanVerify():
    verify_returnsFalseOnBadSignatures():
    verify_cantVerifySignaturesAAccountDidntSign():
##############################################################*/


class AccountUnitTests {
    assert(expression, elseError) {
        if (!expression) {
            throw new Error(elseError);
        }
    }

    constructor_privateKeyGeneratesValidData() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validPrivateKey = cryptoHelper.generatePrivateKey();

        let user = new Account({ privateKey : validPrivateKey, network : "00" });

        this.assert(user.privateKey != null, "Failed to store private key");
        this.assert(user.publicKey != null, "Failed to generate public key");
        this.assert(user.publicAddress != null, "Failed to generate public address");
    }
    constructor_nullPrivateKeyThrows() {
        let success = false;
        try {
            let user = new Account({ privateKey : null, network : "00" });
        } catch (e) {
            success = true;
        }
        this.assert(success, "Failed to throw on creating account with null private key");
    }
    constructor_publicKeyGeneratesValidData() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validKeyPair = cryptoHelper.generateKeyPair();

        let user = new Account({ publicKey : validKeyPair.publicKey, network : "00" });

        this.assert(user.privateKey == null, "Public key generated user should not have a private key");
        this.assert(user.publicKey != null, "Failed to store public key");
        this.assert(user.publicAddress != null, "Failed to generate public address");
    }
    constructor_nullPublicKeyThrows() {
        let success = false;
        try {
            let user = new Account({ publicKey : null, network : "00" });
        } catch (e) {
            success = true;
        }
        this.assert(success, "Failed to throw on creating account with null private key and public key");
    }
    constructor_entropyGeneratesKeys() {
        let user = new Account({ entropy : "123", network : "00" });
        this.assert(user.privateKey != null, "Failed to generate private key");
        this.assert(user.publicKey != null, "Failed to generate public key");
        this.assert(user.publicAddress != null, "Failed to generate public address");
    }
    canSign_returnsTrueForPrivateKeyAccounts() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validPrivateKey = cryptoHelper.generatePrivateKey();

        let user = new Account({ privateKey : validPrivateKey, network : "00" });

        this.assert(user.canSign() == true, "Should be able to sign since valid private key");
    }
    canSign_returnsFalseForPublicKeyAccounts() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validPrivateKey = cryptoHelper.generatePrivateKey();

        let user = new Account({ publicKey : cryptoHelper.getPublicKey(validPrivateKey), network : "00" });

        this.assert(user.canSign() == false, "Should not be able to sign since valid private key");
    }
    sign_privateKeyAccountCanSignAndVerify() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validPrivateKey = cryptoHelper.generatePrivateKey();
        let user = new Account({ privateKey : validPrivateKey, network : "00" });

        let signature = user.sign("DataToSign");

        this.assert(signature != null, "Signature created was null");
        this.assert(user.verifySignature(signature, "DataToSign") == true);
    }
    sign_publicKeyAccountThrows() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validKeyPair = cryptoHelper.generateKeyPair();
        let user = new Account({ publicKey : validKeyPair.publicKey, network : "00" });
        let success = false;
        try {
            let signature = user.sign("DataToSign");
        } catch (e) {
            success = true;
        }
        this.assert(success, "User generated with public key should not able to sign");
    }
    sign_twoAccountsOneTransactionGenerateDifferentSignatures() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let data = "SharedData";
        let user1 = new Account( { privateKey : cryptoHelper.generateKeyPair().privateKey, network : "00" });
        let user2 = new Account( { privateKey : cryptoHelper.generateKeyPair().privateKey, network : "00" });
        let signature1 = user1.sign(data);
        let signature2 = user2.sign(data);
        
        this.assert(signature1 != signature2, "Signature created was null");
        this.assert(user1.verifySignature(signature1, data) == true, "Signature couldnt be verified");
        this.assert(user2.verifySignature(signature2, data) == true, "Signature couldnt be verified");
    }
    sign_oneAccountTwoTransactionsGenerateDifferentSignatures() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let data1 = "Data1";
        let data2 = "Data2";
        let user = new Account( { privateKey : cryptoHelper.generateKeyPair().privateKey, network : "00" });
        let signature1 = user.sign(data1);
        let signature2 = user.sign(data2);
        
        this.assert(signature1 != signature2, "Signature created was null");
        this.assert(user.verifySignature(signature1, data1) == true, "Signature couldnt be verified");
        this.assert(user.verifySignature(signature2, data2) == true, "Signature couldnt be verified");
    }
    verify_publicKeyAccountsCanVerify() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validPrivateKey = cryptoHelper.generatePrivateKey();
        let user = new Account({ privateKey : validPrivateKey, network : "00"  });
        let publicKeyAccount = new Account({ publicKey : user.publicKey, network : "00"  });

        let signature = user.sign("DataToSign");

        this.assert(signature != null, "Signature created was null");
        this.assert(publicKeyAccount.verifySignature(signature, "DataToSign") == true);
    }
    verify_returnsFalseOnBadSignatures() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let validPrivateKey = cryptoHelper.generatePrivateKey();
        let user = new Account({ privateKey : validPrivateKey, network : "00"  });

        let signature = user.sign("DataToSign");

        this.assert(signature != null, "Signature created was null");
        this.assert(user.verifySignature("wrongSignature", "DataToSign") == false);
    }
    verify_cantVerifySignaturesAAccountDidntSign() {
        let cryptoHelper = cryptographyExporter.newCryptoHelper();
        let data = "SharedData";
        let user1 = new Account( { privateKey : cryptoHelper.generateKeyPair().privateKey, network : "00" });
        let user2 = new Account( { privateKey : cryptoHelper.generateKeyPair().privateKey, network : "00" });
        let signature1 = user1.sign(data);
        let signature2 = user2.sign(data);
        
        this.assert(user2.verifySignature(signature1, data) == false, "Different users validated eachothers signatures");
        this.assert(user1.verifySignature(signature2, data) == false, "Different users validated eachothers signatures");
    }
}