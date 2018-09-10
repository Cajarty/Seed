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
        } else {
            return false;
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
    },
    getUnitTests : function() {
        return squasherUnitTests;
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

const squasherUnitTests = {
    /**
     * Confirms squasher would trigger on proper hashes for valid cases.
     */
    squashingTrigger_wouldTriggerSquasherForProperHashes : function(test, log) {
        let validHash = "0f30f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052";
        test.assert(module.exports.doesTriggerSquashing(validHash), "Should induce squashing with the validHash");
    },
    /**
     * Confirms squasher would not trigger on a invalid hash.
     */
    squashingTrigger_wouldNotTriggerSquasherForInvalidHashes : function(test, log) {
        let invalidHash = "93f0f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052";
        test.assertAreEqual(module.exports.doesTriggerSquashing(invalidHash), false, "Should not squashing with the invalid hash");
    },
    /**
     * Confirms squashing two objects works properly while following the “relative data” squashing rules.
     */
    squash_squashesRelativeData : function(test, log) {
        let data1 = {
            a : 5,
            b : -5,
            c : 1,
            e : { a : 5 }
        }
        let data2 = {
            a : -3,
            b : -2,
            d : 3,
            e : { a : 2 }
        }
        let expectedData = {
            a : 2,
            b : -7,
            c : 1,
            e : { a : 7 },
            d : 3
        }
        let resultedData = module.exports.squash(data1, data2);
        log("Squashing:: ", data1, data2);
        log("Resulted Data", resultedData);
        test.assertAreEqual(JSON.stringify(resultedData), JSON.stringify(expectedData), "Squashing the relative data's should result in expectedData");
    },
    /**
     * Confirms squashing two objects works properly while following the “absolute data” squashing rules.
     */
    squash_squashesAbsoluteData : function(test, log) {
        let data1 = {
            a : "Hello",
            b : { d : "a" },
            c : 1
        }
        let data2 = {
            a : "World",
            b : { d : "b" },
            d : 3
        }
        let expectedData = {
            a : "World",
            b : { d : "b" },
            c : 1,
            d : 3
        }
        let resultedData = module.exports.squash(data1, data2);
        log("Squashing:: ", data1, data2);
        log("Resulted Data", resultedData);
        test.assertAreEqual(JSON.stringify(resultedData), JSON.stringify(expectedData), "Squashing the absolute data's should result in expectedData");
    },
    /**
     * Confirms order matters with “absolute data” rules, with rearranging order changing the squashed result.
     */
    squash_orderMattersForAbsoluteData : function(test, log) {
        let data1 = {
            a : "Hello"
        }
        let data2 = {
            a : "World"
        }
        let expectedResult1 = {
            a : "World"
        }
        let expectedResult2 = {
            a : "Hello"
        }
        let result1 = module.exports.squash(data1, data2);
        log("Squashing:: ", data1, data2);
        log("Resulted Data", result1);
        let result2 = module.exports.squash(data2, data1);
        log("Squashing:: ", data2, data1);
        log("Resulted Data", result2);
        test.assertAreEqual(JSON.stringify(result1), JSON.stringify(expectedResult1), "Squashing Hello and World should become World under absolute data rules");
        test.assertAreEqual(JSON.stringify(result2), JSON.stringify(expectedResult2), "Squashing World and Hello should become Hello under absolute data rules");
    },
    /**
     * Confirm squashing transactions into a block produced a valid block
     */
    squash_transactionsIntoBlock : function(test, log) {
        let transactionsJSON = [ 
            {"transactionHash":"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7","sender":"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\":{\"relays\":2}},\"user\":\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"9762b25304ce5fa514cc3f0a2687ad59c522d0ebbd65330dc85ce3d6d58dcebe","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\",\"dependencies\":[]}"},{"transactionHash":"621c6ce08d2928c3213e619d93723bff8625c28ef8cd63ca368daca26107f753","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f","timestamp":1536513258201},
            {"transactionHash":"4f95dc9fca4f60827d3f6923dca45cfa85bfaa58cbbe56d16dc39b54ea8d4247","sender":"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\":{\"relays\":2}},\"user\":\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"a27c70a28ce1f5042a0567215544c5921207d0fe533fa9184bcd48480a9fca5f","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\":{\"relays\":3}},\"user\":\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\",\"dependencies\":[]}"},{"transactionHash":"652c3589b7a0da85c0144599c11c5fe724313cc2b159f6c4f9445fe2cd2b66c7","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"30460221008e4b34eb0ce48735f3aa55920b31777973c783c670a96808a75bfe303c8bad03022100976d76450e84b5ab5133fb3587eb12d1bb0fd8072559102f7eb61f28bea6512d","timestamp":1536110596764},
            {"transactionHash":"5d2e6ed3f77db4c4259d12d7c6888fdf6bc9e886969e0e23402bd63fe3e698d3","sender":"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":1},\"userData\":{\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\":{\"relays\":1}},\"user\":\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"93f0f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052","moduleChecksum":"fd37","functionChecksum":"ddf3","changeSet":"{\"moduleData\":{\"totalSupply\":1000},\"userData\":{\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":1000}},\"user\":\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"dependencies\":[]}"}],"signature":"3045022100ea9a5dbecc74ff485d61db9af007f178d4aef3ce20310afa4f50ca8d60d7aaef02203363780c7129be556f8b9fc9e27e0517fb3d9ee4f5327fefab4b06539bd69dfa","timestamp":1536513258112}
        ]
        let block = module.exports.transactionsToBlock(transactionsJSON);
        test.assertAreEqual(block.generation, 1, "Blocks made from transactions must be a first generation block");
        test.assertAreEqual(block.timestamp, 1536513258201, "Blocks inherit the oldest timestamp from their transactions");
        test.assert(block.transactions != undefined, "Must have transactions set");
        test.assert(block.changeSet != undefined, "Must have changeSet set");
    },
    /**
     * Confirm squashing blocks into a block produced a valid block
     */
    squash_blocksIntoBlock : function(test, log) {
        let transactionsJSON1 = [ 
            {"transactionHash":"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7","sender":"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\":{\"relays\":2}},\"user\":\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"9762b25304ce5fa514cc3f0a2687ad59c522d0ebbd65330dc85ce3d6d58dcebe","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\",\"dependencies\":[]}"},{"transactionHash":"621c6ce08d2928c3213e619d93723bff8625c28ef8cd63ca368daca26107f753","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f","timestamp":1536513258201},
            {"transactionHash":"4f95dc9fca4f60827d3f6923dca45cfa85bfaa58cbbe56d16dc39b54ea8d4247","sender":"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\":{\"relays\":2}},\"user\":\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"a27c70a28ce1f5042a0567215544c5921207d0fe533fa9184bcd48480a9fca5f","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\":{\"relays\":3}},\"user\":\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\",\"dependencies\":[]}"},{"transactionHash":"652c3589b7a0da85c0144599c11c5fe724313cc2b159f6c4f9445fe2cd2b66c7","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"30460221008e4b34eb0ce48735f3aa55920b31777973c783c670a96808a75bfe303c8bad03022100976d76450e84b5ab5133fb3587eb12d1bb0fd8072559102f7eb61f28bea6512d","timestamp":1536110596764},
            {"transactionHash":"5d2e6ed3f77db4c4259d12d7c6888fdf6bc9e886969e0e23402bd63fe3e698d3","sender":"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":1},\"userData\":{\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\":{\"relays\":1}},\"user\":\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"93f0f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052","moduleChecksum":"fd37","functionChecksum":"ddf3","changeSet":"{\"moduleData\":{\"totalSupply\":1000},\"userData\":{\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":1000}},\"user\":\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"dependencies\":[]}"}],"signature":"3045022100ea9a5dbecc74ff485d61db9af007f178d4aef3ce20310afa4f50ca8d60d7aaef02203363780c7129be556f8b9fc9e27e0517fb3d9ee4f5327fefab4b06539bd69dfa","timestamp":1536513258112}
        ]
        let block1 = module.exports.transactionsToBlock(transactionsJSON1);
        let transactionsJSON2 = [ 
            {"transactionHash":"5d9366698df744ddb04f4d29d91f3a6d1f96e84e95354f3cd5df58ce30d16371","sender":"04318cfd9e16640aa16ee586eadf54f37b481e37a190b52cb2a023d4787d3248a57b257f37cb8f38867754c10ce7df42fcd4513ea21df7da912b22ebb484ca22b8","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04318cfd9e16640aa16ee586eadf54f37b481e37a190b52cb2a023d4787d3248a57b257f37cb8f38867754c10ce7df42fcd4513ea21df7da912b22ebb484ca22b8\":{\"relays\":2}},\"user\":\"04318cfd9e16640aa16ee586eadf54f37b481e37a190b52cb2a023d4787d3248a57b257f37cb8f38867754c10ce7df42fcd4513ea21df7da912b22ebb484ca22b8\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"dc6f14379a5414e0c45ed8fdc25844250970453f2f85b8dae79b4b965264f165","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"0473fdb0946614347ee14e5f32041d11ccf8bda3c49f4a6727edaae57126caeabcb21b5eb394531b07d4af7a2ef91bfbfb4a87dcf79d137fb54113698a91ba3a6d\":{\"relays\":2}},\"user\":\"0473fdb0946614347ee14e5f32041d11ccf8bda3c49f4a6727edaae57126caeabcb21b5eb394531b07d4af7a2ef91bfbfb4a87dcf79d137fb54113698a91ba3a6d\",\"dependencies\":[]}"},{"transactionHash":"308c0cca1baf8646428a0ba87b289ed38b648edb0f090b042ce710073fc3e352","moduleChecksum":"fd37","functionChecksum":"49d5","changeSet":"{\"moduleData\":{\"totalSupply\":-25},\"userData\":{\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\":{\"balance\":-25}},\"user\":\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\",\"dependencies\":[]}"}],"signature":"3045022100c921f09f13a8911e76cce716656ea9f36fcfaa58f52f1b9695a0bb43db495ef602204e620b564ece58ba576efad81475fdef7ab455b272249b4cb7bf881f6adcd16b","timestamp":1536110596789},
            {"transactionHash":"8a7d74f9d203f5f0db0dbd115125107d9505d98e6eb509f63b3430e8a5b8764b","sender":"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db","execution":{"moduleName":"Seed","functionName":"approve","args":{"spender":"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0","value":250},"moduleChecksum":"fd37","functionChecksum":"4cf0","changeSet":"{\"moduleData\":{},\"userData\":{\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"allowance\":{\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\":250}}},\"user\":\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"5d2e6ed3f77db4c4259d12d7c6888fdf6bc9e886969e0e23402bd63fe3e698d3","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":1},\"userData\":{\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\":{\"relays\":1}},\"user\":\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\",\"dependencies\":[]}"},{"transactionHash":"4164dcf6320a110d0d4d22976c2477b8eadd78a98898911c17055bb83f96eba0","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"047f024b7ed528d504f1c1c428f9b500ab95e9f344cc255967091419effa1eb3b5338bd4de08a4d468dbc150a841c492ddf57d7e4e58b476350c97bd278f296b89\":{\"relays\":2}},\"user\":\"047f024b7ed528d504f1c1c428f9b500ab95e9f344cc255967091419effa1eb3b5338bd4de08a4d468dbc150a841c492ddf57d7e4e58b476350c97bd278f296b89\",\"dependencies\":[]}"}],"signature":"3046022100aaf7692b6e1c78496b48839899d22b778186014a4282f34759d53c75bd85e3940221008ecba7c37eba0284bf21d51952e3ad0d4f0ca7a79de8fc5a81dbad3bfffcc149","timestamp":1536513258136}
        ]
        let block2 = module.exports.transactionsToBlock(transactionsJSON2);
        let mergedBlock = module.exports.blocksToGenerationBlock([ block1, block2 ]);

        test.assertAreEqual(mergedBlock.generation, 2, "Blocks made from second generation block ");
        test.assertAreEqual(mergedBlock.timestamp, 1536513258201, "Blocks inherit the oldest timestamp from their transactions");
        test.assert(mergedBlock.transactions != undefined, "Must have transactions set");
        test.assert(mergedBlock.changeSet != undefined, "Must have changeSet set");
    }
}