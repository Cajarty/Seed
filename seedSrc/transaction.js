let cryptoExporter = require("./cryptoHelper.js");

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