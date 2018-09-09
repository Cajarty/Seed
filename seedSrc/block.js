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
const conformHelper = require("./helpers/conformHelper.js");

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
        if (!rule1TestForWellformed(block)) {
            throw "The block must be well-formed with all data present";
        }
        return (rule2TestForTransactionValidation(block));
    },
    getUnitTests : function() {
        return blockUnitTests;
    }
 }

 let rule1TestForWellformed = function(block) {
    return block.generation != undefined && block.generation >= 1 && block.transactions != undefined && block.changeSet != undefined && block.timestamp != undefined;
 }

let rule2TestForTransactionValidation = function(block) {
    let transactions = JSON.parse(block.transactions);
    let keys = Object.keys(transactions);
    for(let i = 0; i < keys.length; i++) {
        let transactionHash = keys[i];
        let transactionData = transactions[transactionHash];
        let sender = transactionData[0];
        let signature = transactionData[4]
        console.info("Confirming::", sender, signature, transactionHash);
        if (!cryptoExporter.newCryptoHelper().verifySignature(sender, signature, transactionHash)) {
            return false;
        }
    }
    return true;
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

const testBlock = {
    "generation" : 1,
    "transactions" : "{ \"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7\" : [\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\", \"ec72\", \"4b75\", \"{}\", \"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f\"] }",
    "changeSet" : "{ \"Relay\" : \"totalRelays\":1, \"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\"}",
    "timestamp" : 1536513258201,
    "blockHash" : "bbcb78dc89c4e184fccc79bbbf5afe7e58915b58b1b604ff2a55a32420e0d86c"
}

const blockUnitTests = {
    /**
     * Block creation creates blocks with valid and accurate data, as well have as a correctly generated hash.
     */
    blockCreation_createsAValidBlockWithValidHash : function(test, log) {
        let newBlock = module.exports.newBlock(testBlock.generation, testBlock.transactions, testBlock.changeSet, testBlock.timestamp);
        test.assertAreEqual(testBlock.generation, newBlock.generation, "Generation should be passed into the new block");
        test.assertAreEqual(testBlock.transactions, newBlock.transactions, "Transactions should be passed into the new block");
        test.assertAreEqual(testBlock.changeSet, newBlock.changeSet, "ChangeSets should be passed into the new block");
        test.assertAreEqual(testBlock.timestamp, newBlock.timestamp, "Timestamps should be passed into the new block");
        test.assertAreEqual(testBlock.blockHash, newBlock.blockHash, "New block should have generated the same hash as the old block");
    },
    /**
     * Validates that the block validation system is correct in positive cases.
     */
    blockValidation_createAndValidateABlock : function(test, log) {
        let newBlock = module.exports.newBlock(testBlock.generation, testBlock.transactions, testBlock.changeSet, testBlock.timestamp);
        test.assert(module.exports.isValid(newBlock), "The newly created block should be valid");
    },
    /**
     * Validates that the block validation system is correct in failing blocks which don’t meet block validation rule #1.
     */
    blockValidation_failsBlocksBreakingRule1 : function(test, log) {
        let badBlockZeroGeneration = conformHelper.deepCopy(testBlock);
        badBlockZeroGeneration.generation = 0;
        test.assertAreEqual(rule1TestForWellformed(badBlockZeroGeneration), false, "Should have failed with a generation of zero");
        delete badBlockZeroGeneration.generation;
        test.assertAreEqual(rule1TestForWellformed(badBlockZeroGeneration), false, "Should have failed with a undefined generation");

        let badBlockNoTransactions = conformHelper.deepCopy(testBlock);
        delete badBlockNoTransactions.transactions;
        test.assertAreEqual(rule1TestForWellformed(badBlockNoTransactions), false, "Should have failed with undefined transactions");

        let badBlockNoChangeSet = conformHelper.deepCopy(testBlock);
        delete badBlockNoChangeSet.changeSet;
        test.assertAreEqual(rule1TestForWellformed(badBlockNoChangeSet), false, "Should have failed with undefined changeSet");

        let badBlockNoTimestamp = conformHelper.deepCopy(testBlock);
        delete badBlockNoTimestamp.timestamp;
        test.assertAreEqual(rule1TestForWellformed(badBlockNoTimestamp), false, "Should have failed with undefined timestamp");
    },
    /**
     * Validates that the block validation system is correct in failing blocks which don’t meet block validation rule #2.
     */
    blockValidation_failsBlocksBreakingRule2 : function(test, log) {
        test.assert(rule2TestForTransactionValidation(testBlock), "Test block should pass test as it has valid transactions data");
        let badBlockInvalidTransactions = conformHelper.deepCopy(testBlock);
        badBlockInvalidTransactions.transactions = "{ \"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7\" : [\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\", \"ec72\", \"4b75\", \"{}\", \"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38g\"] }";
        test.assertAreEqual(rule2TestForTransactionValidation(badBlockInvalidTransactions), false, "Should have failed to validate the signature, as the transaction data was tampered with");
    },
    /**
     * An exception is thrown when an invalid block is checked for validation.
     */
    blockValidation_throwsMalFormedBlock : function(test, log) {
        test.assertFail(() => {
            let badBlockZeroGeneration = conformHelper.deepCopy(testBlock);
            badBlockZeroGeneration.generation = 0;
            module.exports.isValid(badBlockZeroGeneration);
        }, "The malformed block should have thrown an error when checked through the module.exports for validity");
    }
}