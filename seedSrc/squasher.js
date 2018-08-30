/***************
 * squasher.js *
 ***************
 * 
 * Exports functions related to squashing transactions/blocks and creating new recycled blocks out of them
 * 
 * Exported Functions:
 *      transactionsToBlock(transactionsToSquash)
 *          - Squashes an array of transactions into a block
 *      blocksToGenerationBlock(blocksToSquash)
 *          - Squashes an array of blocks into a block
 */

const blockExporter = require("./block.js");

module.exports = {
    /**
     * Squashes an array of transactions into a block
     * 
     * @param {*} transactionsToSquash - Array of transactions to squash
     */
    transactionsToBlock(transactionsToSquash) {
        sortTimestamped(transactionsToSquash);
        let generation = 1;
        let mapping = createMappingOfLeanDataFromTransactions(transactionsToSquash);
        let changeSet = createChangeSetFromTransactions(transactionsToSquash);
        let timestamp = transactionsToSquash[transactionsToSquash.length - 1].timestamp;

        let block = blockExporter.newBlock(generation, JSON.stringify(mapping), JSON.stringify(changeSet), timestamp);

        return block;
    },
    /**
     * Squashes an array of blocks into a block
     * 
     * @param {*} blocksToSquash - Array of blocks to squash
     */
    blocksToGenerationBlock(blocksToSquash) {
        sortTimestamped(blocksToSquash);
        if (confirmGenerationsMatch(blocksToSquash)) {
            let generation = blocksToSquash[0].generation + 1;
            let mapping = createMappingOfLeanDataFromBlocks(blocksToSquash);
            let changeSet = createChangeSetFromBlocks(blocksToSquash);
            let timestamp = blocksToSquash[blocksToSquash.length - 1].timestamp;

            let block = blockExporter.newBlock(generation, JSON.stringify(mapping), JSON.stringify(changeSet), timestamp);

            return block;
        }
    },
    /**
     * Checks whether a given hash would trigger the squashing mechanism
     * 
     * NOTE: These values are temporary and will be fine tuned. Currently this triggers much more often
     * than generally desired so it is invoked at least once per unit test.
     * 
     * @param {*} hash - Hash to check for squashing mechanism
     */
    doesTriggerSquashing(hash) {
        if (hash.length > 0 && (hash[0] == '0' || hash[0] == '1' )) {
            return true;
        }
    },
    /**
     * Squashes two objects into one, where B is squashed into A, overpowering it for absolutes
     * 
     * { a : 10, b : -10, c : "Hello" } and { a : -5, c : "World", d : 10  }
     * becomes
     * { a : 5, b : -10, c : "World", d : 10 }
     * 
     * @param {*} objectA - Object to squash (who will have absolute values overwritten)
     * @param {*} objectB - Object to squash (who will have absolute power overwrite)
     */
    squash(objectA, objectB) {
        return squashObjects(objectA, objectB);
    }
}

/**
 * Helper function for confirming all blocks to squash are from the same generation
 * 
 * @param {*} blocksToSquash - An array of blocks that will be squashed
 */
let confirmGenerationsMatch = function(blocksToSquash) {
    for(let i = 1; i < blocksToSquash.length; i++) {
        if (blocksToSquash[i].generation != blocksToSquash[0].generation) {
            return false;
        }
    }
    return true;
}

/**
 * Sorts an array of timestamped objects in order of oldest to newest
 * 
 * @param {*} timestamped - Array of objects with a "timestamp" property in epoch time
 */
let sortTimestamped = function(timestamped) {
    timestamped.sort(function(a, b){return a.timestamp - b.timestamp});
}

/**
 * Takes a transaction and returns a version with extracted data that takes
 * up less bytes, while still technically being enough information to validate it
 * if we do have the proper module/function loaded
 * 
 * @param {*} transaction - Transaction to create lean data of
 */
let transactionToLeanData = function(transaction) {
    return [transaction.sender, transaction.execution.moduleChecksum, transaction.execution.functionChecksum, JSON.stringify(transaction.execution.args), transaction.signature];
}

/**
 * Squashes two objects into one, where B is squashed into A, overpowering it for absolutes
 * 
 * { a : 10, b : -10, c : "Hello" } and { a : -5, c : "World", d : 10  }
 * becomes
 * { a : 5, b : -10, c : "World", d : 10 }
 * 
 * @param {*} objectA - Object to squash (who will have absolute values overwritten)
 * @param {*} objectB - Object to squash (who will have absolute power overwrite)
 */
let squashObjects = function(objectA, objectB) {
    let result = {};
    let keys = Object.keys(objectA).concat(Object.keys(objectB));
    for(let i = 0; i < keys.length; i++) {
        let key = keys[i];

        // If on A but not B, keep A's
        if (objectA[key] && !objectB[key]) {
            result[key] = objectA[key];
        }
        // If on B but not on A, keep B's
        else if (!objectA[key] && objectB[key]) {
            result[key] = objectB[key];
        } 
        // Otherwise its on both, so squash them
        else {
            result[key] = squashDatas(objectA[key], objectB[key]);
        }
    }
    return result;
}

/**
 * Takes in two pieces of data and "squashes" them into one.
 * 
 * For relative values (i.e. numbers), they are added together, so 5 and -3 become 2
 * For absolute values (i.e. strings), dataB overpowers dataA, so "Hello" and "World" become "World"
 * For objects, recursively re-invokes this, so their inner properties follow the same relative/absolute values
 * 
 * @param {*} dataA - First data to merge
 * @param {*} dataB - Second data to merge
 */
let squashDatas = function(dataA, dataB) {
    switch(typeof dataA) {
        // If the old data was a number
        case "number":
            // Number changes are relative
            return dataA + dataB;
        case "string":
            return dataB;
        case "object":
            // Objets are absolute and Object.assigned over
            return squashObjects(dataA, dataB);
    }
    console.info("ERROR: Datas to squash were not a number, string or object", typeof dataA, dataA, typeof dataB, dataB);
}

/**
 * Takes a transaction and extracts its changeSet value, then reforms it to the form a ledger wants to apply
 * 
 * @param {*} transaction - Transaction to extract changeSet from
 */
let transactionToChangeSet = function(transaction) {
    let result = {};
    let transactionChanges = JSON.parse(transaction.execution.changeSet);
    result[transaction.execution.moduleName] = transactionChanges.moduleData;
    result[transaction.execution.moduleName]["userData"] = transactionChanges.userData;
    return result;
}

/**
 * Takes an array of changeSets and merged them using the "squashObject" function recursively to make the
 * squashed version.
 * 
 * @param {*} changeSets - Array of changeSets to squash into one
 */
let squash = function(changeSets) {
    let squashed = changeSets[0];
    for(let i = 1; i < changeSets.length; i++) {
        squashed = squashObjects(squashed, changeSets[i]);
    }
    return squashed;
}

/**
 * Takes an array of transactions and creates a mapping of lean datas from the transactions, compressing the data
 * 
 * @param {*} transactions - Array of transactions to compress
 */
let createMappingOfLeanDataFromTransactions = function(transactions) {
    let mapping = {};
    for(let i = 0; i < transactions.length; i++) {
        let transaction = transactions[i];
        mapping[transaction.transactionHash] = transactionToLeanData(transaction);
    }
    return mapping;
}

/**
 * Takes an array of blocks and concats their mappings of lean transaction datas to make a larger mapping
 * 
 * @param {*} blocks 
 */
let createMappingOfLeanDataFromBlocks = function(blocks) {
    let mapping = JSON.parse(blocks[0].transactions);
    for(let i = 1; i < blocks.length; i++) {
        mapping = Object.assign(mapping, JSON.parse(blocks[i].transactions));
    }
    return mapping;
}

/**
 * Takes an array of transactions and creates a squashed changeSet from their changeSets
 * 
 * @param {*} transactions - Array of transactions to squash
 */
let createChangeSetFromTransactions = function(transactions) {
    let changeSets = [];
    for(let i = 0; i < transactions.length; i++) {
        let transaction = transactions[i];
        changeSets.push(transactionToChangeSet(transaction));
    }
    return squash(changeSets);
}

/**
 * Takes an array of blocks and creates a squashed ChangeSet from their changeSets
 * 
 * @param {*} blocks - Array of blocks to squash
 */
let createChangeSetFromBlocks = function(blocks) {
    let changeSets = [];
    for(let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        changeSets.push(JSON.parse(block.changeSet));
    }
    return squash(changeSets);
}