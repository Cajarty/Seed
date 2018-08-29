const blockExporter = require("./block.js");

module.exports = {
    transactionsToBlock(transactionsToSquash) {
        // Confirm all childrens in the DAG have their timestamps in a viable order
        sortTimestamped(transactionsToSquash);
        let generation = 1;
        let mapping = createMappingOfLeanDataFromTransactions(transactionsToSquash);
        let changeSet = createChangeSetFromTransactions(transactionsToSquash);
        let timestamp = transactionsToSquash[transactionsToSquash.length - 1].timestamp;

        let block = blockExporter.newBlock(generation, JSON.stringify(mapping), JSON.stringify(changeSet), timestamp);

        //console.info("FIRST GENERATION BLOCK", block);

        return block;
    },
    blocksToGenerationBlock(blocksToSquash) {
        sortTimestamped(blocksToSquash);
        if (confirmGenerationsMatch(blocksToSquash)) {
            let generation = blocksToSquash[0].generation + 1;
            let mapping = createMappingOfLeanDataFromBlocks(blocksToSquash);
            let changeSet = createChangeSetFromBlocks(blocksToSquash);
            let timestamp = blocksToSquash[blocksToSquash.length - 1].timestamp;

            let block = blockExporter.newBlock(generation, JSON.stringify(mapping), JSON.stringify(changeSet), timestamp);

           // console.info(generation + " GENERATION BLOCK", block);

            return block;
        }
    },
    doesTriggerSquashing(hash) {
        if (hash.length > 0 && (hash[0] == '0' || hash[0] == '1' )) {
            return true;
        }
    }
}

let confirmGenerationsMatch = function(blocksToSquash) {
    for(let i = 1; i < blocksToSquash.length; i++) {
        if (blocksToSquash[i].generation != blocksToSquash[0].generation) {
            return false;
        }
    }
    return true;
}

let sortTimestamped = function(timestamped) {
    timestamped.sort(function(a, b){return a.timestamp - b.timestamp});
}

let transactionToLeanData = function(transaction) {
    return [transaction.sender, transaction.execution.moduleChecksum, transaction.execution.functionChecksum, JSON.stringify(transaction.execution.args), transaction.signature];
}

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
    console.info("EFFOR", dataA, dataB);
}

let transactionToChangeSet = function(transaction) {
    let result = {};
    let transactionChanges = JSON.parse(transaction.execution.changeSet);
    result[transaction.execution.moduleName] = transactionChanges.moduleData;
    result[transaction.execution.moduleName]["userData"] = transactionChanges.userData;
    return result;
}

let squash = function(changeSets) {
    let squashed = changeSets[0];
    for(let i = 1; i < changeSets.length; i++) {

        squashed = squashObjects(squashed, changeSets[i]);
    }


    return squashed;
}

let createMappingOfLeanDataFromTransactions = function(transactions) {
    let mapping = {};
    for(let i = 0; i < transactions.length; i++) {
        let transaction = transactions[i];
        mapping[transaction.transactionHash] = transactionToLeanData(transaction);
    }
    return mapping;
}

let createMappingOfLeanDataFromBlocks = function(blocks) {
    let mapping = JSON.parse(blocks[0].transactions);
    for(let i = 1; i < blocks.length; i++) {
        mapping = Object.assign(mapping, JSON.parse(blocks[i].transactions));
    }
    return mapping;
}


let createChangeSetFromTransactions = function(transactions) {
    let changeSets = [];
    for(let i = 0; i < transactions.length; i++) {
        let transaction = transactions[i];
        changeSets.push(transactionToChangeSet(transaction));
    }
    return squash(changeSets);
}

let createChangeSetFromBlocks = function(blocks) {
    let changeSets = [];
    for(let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        changeSets.push(JSON.parse(block.changeSet));
    }
    return squash(changeSets);
}

/*
Block = {
    blockHash,
    1,
    mapping(transactionHash => [sender, "fd47", "49d5", {args}, signature]),
    {
        combined change
    }
}
*/

let countSize = function(array) {
    let result = "";
    for(let i = 0; i < array.length; i++) {
        result += JSON.stringify(array[i]);
    }
    return result.length;
}