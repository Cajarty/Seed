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
    },
    getUnitTests : function() {
        return blockUnitTests;
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

const blockUnitTests = {
    /**
     * Block creation creates blocks with valid and accurate data, as well have as a correctly generated hash.
     */
    blockCreation_createsAValidBlockWithValidHash : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Validates that the block validation system is correct in positive cases.
     */
    blockValidation_createAndValidateABlock : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Validates that the block validation system is correct in failing blocks which don’t meet block validation rule #1.
     */
    blockValidation_failsBlocksBreakingRule1 : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Validates that the block validation system is correct in failing blocks which don’t meet block validation rule #2.
     */
    blockValidation_failsBlocksBreakingRule2 : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * An exception is thrown when an invalid block is checked for validation.
     */
    blockValidation_throwsMalFormedBlock : function(test, log) {
        test.assert(false, "Test Not Implemented");
    }
}