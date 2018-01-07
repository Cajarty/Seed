const cryptographyExporter = require("./cryptography.js");

module.exports = {
    newAccount: function() {
       return new Account();
    },
    newAccountUnitTests: function() {
        return new AccountUnitTests();
    }
 }

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

class AccountUnitTests {
    

}