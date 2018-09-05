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
    },
    /**
     * Checks whether a block is considered valid or not (given the current state of the ledger)
     * 
     * #1: Block is well-formed
     * #2: All signatures can be verified
     * 
     * @param block - Block to check for validity
     */
    isValid: function(block) {
        let result = true;

        // Rule 1
        if (block.generation >= 1 && block.transactions && block.changeSet && block.timestamp) {

            // Rule 2
            let transactions = JSON.parse(block.transactions);
            let keys = Object.keys(transactions);
            for(let i = 0; i < keys.length; i++) {
                let transactionHash = keys[i];
                let transactionData = transactions[transactionHash];
                let sender = transactionData[0];
                let signature = transactionData[4]
                console.info("Confirming::", sender, signature, transactionHash);
                if (!cryptoExporter.newCryptoHelper().verifySignature(sender, signature, transactionHash)) {
                    result = false;
                }
            }
        } else {
            result = false;
        }

        return result;
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
