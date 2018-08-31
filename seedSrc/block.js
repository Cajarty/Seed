/************
 * block.js *
 ************
 * 
 * Exports the creation of blocks
 * 
 * Exported Functions:
 *      newBlock(generation, transactions, changeSet, timestamp)
 *          - Creates a new block with the passed in data
 */

const cryptoExporter = require("./helpers/cryptoHelper.js");

module.exports = {
    /**
     * Creates a new block with the passed in data
     * 
     * @param generation - Which generation (1+) the block is
     * @param transactions - The transactions data object to store
     * @param changeSet - The squashed changeSet to store
     * @param timestamp - The last timestamp of all the transactions belonging to this block
     */
    newBlock: function(generation, transactions, changeSet, timestamp) {
       return new Block(generation, transactions, changeSet, timestamp);
    }
 }

class Block {
    /**
     * The constructor for creating a new block. Stores the data then calculates its own hash
     * 
     * @param {*} generation - Which generation (1+) the block is
     * @param {*} transactions - The transactions data object to store
     * @param {*} changeSet - The squashed changeSet to store
     * @param {*} timestamp - The last timestamp of all the transactions belonging to this block
     */
    constructor(generation, transactions, changeSet, timestamp) {
        this.generation = generation;
        this.transactions = transactions;
        this.changeSet = changeSet;
        this.timestamp = timestamp;
        this.updateHash();
    }

    /**
     * Recalcualtes the transaction hash based on the internal hashable data
     */
    updateHash() {
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        this.blockHash = cryptoHelper.sha256(this.getHashableData());
    }

    /**
     * Rebuilds the data into a long string that can then be hashed
     */
    getHashableData() {
        let hashable = "";
        hashable += this.generation;
        let transactionKeys = Object.keys(this.transactions);
        for(let i = 0; i < transactionKeys.length; i++) {
            let sender = transactionKeys[i];
            let signature = this.transactions[sender];
            hashable += sender;
            hashable += signature;
        }
        hashable += this.changeSet;
        hashable += this.timestamp;
        return hashable;
    }
}
