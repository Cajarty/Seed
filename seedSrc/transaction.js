/******************
 * transaction.js *
 ******************
 * 
 * Exports the creation of transactions.
 * 
 * Transaction:
 *      Transaction Hash
 *      Sender Address
 *      Execution
 *          - ModuleName, FunctionName, Arguments
 *          - ModuleChecksum, FunctionChecksum, ChangeSet
 *      Trusted Transactions
 *      Nonce
 *      Signature
 * 
 * Exported Functions:
 *      createTransaction(children, updateData)
 *          - Creates a new transaction object
 */

module.exports = {
    createTransaction: function() {
       return new Transaction();
    },
    createTransaction: function(children, updateData) {
        let transaction = new Transaction();
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        let childrenMerkelDAGHash = "";
        let work = [];
        for(let i = 0; i < children.length; ++i) {
            //Make sure children[i] is valid
            //work.push();
            childrenMerkelDAGHash += children[i].childrenMerkelDAGHash;
        }
        transaction.transactionHash = cryptoHelper.sha256(transaction.toHashableString());
        transaction.merkelDAGHash = cryptoHelper.sha256(this.transactionHash + childrenMerkelDAGHash);
        //Sign this.transactionHash
        //Store the signature
        return transaction;
    }
 }

 let cryptoExporter = require("./helpers/cryptoHelper.js");

class Transaction {
    constructor() {
        this.transactionHash = "";
        this.merkelDAGHash = "";
        this.work = [];
        this.moduleName = "";
        this.signature = "";
        this.merkelData = "";
        this.updateData = {};
    }

    toHashableString() {
        let result = "";
        result += this.merkelDAGHash;
        result += this.work.toString();
        result += moduleName;
        result += merkelData;
        result += updateData.toString();
        return result;
    }

    getValidationInfo() {
        let result = "";
        result += this.transactionHash;
        result += "|";
        result += cryptoExporter.newCryptoHelper().sha256(this.updateData);
        result += "|";
        result += this.merkelDAGHash;
        result += "|";
        result += this.signature;
        return result;
    }
}