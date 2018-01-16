
module.exports = {
    createTransaction: function() {
       return new Transaction();
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
    }
}