/***************************
 * localStorageInjector.js *
 ***************************
 * 
 * Exports an implementation of the IDatabaseInjector pattern which implements saving/loading
 * to a browsers localstorage
 * 
 * This implementation should work for any key/storage object passed in
 */

module.exports = {
    /**
     * Creates a new LocalStorageInjector implementation
     * 
     * @param {*} localStorage - LocalStorage object giving access to localStorage
     * 
     * @return - A new LocalStorageInjector object
     */
    newLocalStorageInjector : function(localStorage) {
        return new LocalStorageInjector(localStorage);
    },
    getUnitTests : function() {
        return localStorageInjectorUnitTests;
    }
}

const conformHelper = require("../helpers/conformHelper.js");
const unitTestingExporter = require("../tests/unitTesting.js");

/**
 * Helper function for taking a LocalStorage object and determining all the keys
 * which belong to blocks and which generation of blockchain they belong too.
 * 
 * This returns just the keys in a mapped object, NOT the data from storage
 * 
 * @param {*} localStorage - The local storage to extract information from
 */
let parseLocalStorageToBlockKeys = function(localStorage) {
    let result = {};
    let keys = Object.keys(localStorage);
    for(let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let split = key.split("_");
        if (split.length == 2) { // If could split on the "_"
            let generation = split[0];
            let blockHash = split[1];

            if (!result[generation]) {
                result[generation] = [];
            }
            result[generation].push(blockHash);
        }
    }
    return result;
}

/**
 * Helper function for taking a LocalStorage object and determining all the keys
 * which belong to transactions.
 * 
 * This returns just the keys in a mapped object, NOT the data from storage
 * 
 * @param {*} localStorage - The local storage to extract information from
 */
let parseLocalStorageToTransactionKeys = function(localStorage) {
    let result = [];
    let keys = Object.keys(localStorage);
    for(let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let split = key.split("_");
        if (split.length == 1) { // If could NOT split on the "_"
            result.push(key);
        }
    }
    return result;
}

/**
 * A IDatabaseInjector implementation which reads/writes blocks/transactions from local storage.
 * 
 * This implementation should work for any key/storage object passed in
 */
class LocalStorageInjector /* implements IDatabaseInjector.interface */ {
    /**
     * Constructor for the local storage implementation
     * 
     * @param {*} localStorage - LocalStorage object giving access to localStorage
     */
    constructor(localStorage) {
        this.localStorage = localStorage;
    }

    /**
     * Removes a transaction from storage.
     * 
     * Is Async to match interface, however executes synchronously with localStorage
     * 
     * @param {*} transactionName - The name/hash of a transaction in storage
     * @param {*} callback - (optional) A function(error, data) to invoke upon completetion
     */
    removeTransactionAsync(transactionName, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }
        delete this.localStorage[transactionName];
        callback(undefined, transactionName);
    }

    /**
     * Removes a block from storage.
     * 
     * Is Async to match interface, however executes synchronously with localStorage
     * 
     * @param {*} generation - The generation of a block in storage
     * @param {*} blockName - The name/hash of a block in storage
     * @param {*} callback - (optional) A function(error, data) to invoke upon completetion
     */
    removeBlockAsync(generation, blockName, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }

        let blockKey = generation + "_" + blockName;
        delete this.localStorage[blockKey];
        callback(undefined, blockName);
    }

    /**
     * Writes a block to storage.
     * 
     * Is Async to match interface, however executes synchronously with localStorage
     * 
     * @param {*} storageName - The name to use in storage (e.g. block hash)
     * @param {*} storageObject - The block to store in storage
     * @param {*} generation - The generation of block it is
     * @param {*} callback - (optional) A function(error, data) to invoke upon completetion
     */
    writeBlockAsync(storageName, storageObject, generation, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }
        let blockKey = generation + "_" + storageName;
        this.localStorage[blockKey] = storageObject
        callback(undefined, storageName);
    }

    /**
     * Writes a block to storage.
     * 
     * @param {*} storageName - The name to use in storage (e.g. block hash)
     * @param {*} storageObject - The block to store in storage
     * @param {*} generation - The generation of block it is
     */
    writeBlockSync(storageName, storageObject, generation, callback) {
        let blockKey = generation + "_" + storageName;
        this.localStorage[blockKey] = storageObject
    }

    /**
     * Writes a transaction to storage.
     * 
     * Is Async to match interface, however executes synchronously with localStorage
     * 
     * @param {*} storageName - The name of the transaction to store
     * @param {*} storageObject - The transaction to store
     * @param {*} callback - (optional) A function(error, data) to invoke upon completetion
     */
    writeTransactionAsync(storageName, storageObject, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }
        this.localStorage[storageName] = storageObject
        callback(undefined, storageName);
    }

    /**
     * Writes a transaction to storage.
     * 
     * @param {*} storageName - The name of the transaction to store
     * @param {*} storageObject - The transaction to store
     */
    writeTransactionSync(storageName, storageObject) {
        this.localStorage[storageName] = storageObject
    }

    /**
     * Reads a block from storage.
     * 
     * Is Async to match interface, however executes synchronously with localStorage
     * 
     * @param {*} generation - The generation of block it is
     * @param {*} storageName - The name of the block in storage
     * @param {*} callback - The callback to invoke upon finishing reading
     */
    readBlockAsync(generation, storageName, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }
        let blockKey = generation + "_" + storageName;
        let block = this.localStorage[blockKey];
        if (block) {
            callback(undefined, block);
        } else {
            callback("Failed to read transaction from local storage.", block);
        }
    }

    /**
     * Reads a block from storage synchronously, returning the block upon completion.
     * 
     * @param {*} generation - The generation of block it is
     * @param {*} storageName - The name of the block in storage
     */
    readBlockSync(generation, storageName) {
        let blockKey = generation + "_" + storageName;
        return this.localStorage[blockKey]
    }

    /**
     * Reads all blocks of a certain generation synchronously, returning as an array
     * 
     * @param {*} generation - The generation of blocks to be read
     */
    readBlockchainSync(generation) {
        let blocks = [];
        let blockchains = parseLocalStorageToBlockKeys(this.localStorage);
        let blockchain = blockchains[generation];
        if (blockchain) {
            for(let i = 0; i < blockchain.length; i++) {
                let blockHash = blockchain[i];
                let blockKey = generation + "_" + blockHash;
                blocks.push( this.localStorage[blockKey]);
            }
        }
        return blocks;
    }

    /**
     * Reads all blockchains of all generations and returns them as a long array of blocks
     */
    readBlockchainsSync() {
        let blocks = [];
        let blockchains = parseLocalStorageToBlockKeys(this.localStorage);
        let generations = Object.keys(blockchains);
        for(let g = 0; g < generations.length; g++) {
            let generation = generations[g];
            let blockchain = blockchains[generation];
            if (blockchain) {
                for(let i = 0; i < blockchain.length; i++) {
                    let blockHash = blockchain[i];
                    let blockKey = generation + "_" + blockHash;
                    blocks.push(this.localStorage[blockKey]);
                }
            }
        }
        return blocks;
    }

    /**
     * Reads a transaction from storage asynchronously, invoking a callback upon completion.
     * 
     * @param {*} storageName - The name of the transaction in storage
     * @param {*} callback - The callback to invoke upon finishing reading
     */
    readTransactionAsync(storageName, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }
        let transaction = this.localStorage[storageName];
        if (transaction) {
            callback(undefined, transaction);
        } else {
            callback("Failed to read transaction from local storage.", transaction);
        }
    }

    /**
     * Reads a transaction synchronously from storage and returns it
     * 
     * @param {*} storageName - The name of the transaction in storage
     */
    readTransactionSync(storageName) {
        return this.localStorage[storageName];
    }

    /**
     * Reads the entanglement from storage synchronously, returning all transactions read
     */
    readEntanglementSync() {
        let transactions = [];
        let transactionHashes = parseLocalStorageToTransactionKeys(this.localStorage);
        for(let i = 0; i < transactionHashes.length; i++) {
            let transactionHash = transactionHashes[i];
            transactions.push(this.readTransactionSync(transactionHash));
        }
        return transactions;
    }
}

const testLocalStorage = {};

/**
 * TESTING NOTICE:
 *      The LocalStorageInjector uses local storage the same way you would use any mapping.
 * For example, it calls
 *      delete localStorage[key]
 * rather than
 *      localStorage.remoteItem(key)
 * 
 * This subtle difference allows the LocalStorageInjector to be passed in any object and
 * have it be used for storage, not just LocalStorage. This could therefore also be used for SessionStorage
 * or other mapping implementations.
 */
const localStorageInjectorUnitTests = {
    /**
     * Confirm that transactions can be written to storage asynchronously.
     */
    localStorage_storesTransactionsAsynchronously : function(test, log) {
        let testTransaction = unitTestingExporter.getTestTransactions()[0];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        lsInjector.writeTransactionAsync(testTransaction.transactionHash, JSON.stringify(testTransaction), (err) => {
            test.runAssertsFromAsync(() => {
                test.assert(err == null, "Test was supposed to pass however failed with error: " + err);
            }, "localStorage_storesTransactionsAsynchronously");
        });
    },
    /**
     * Confirm that transactions can be written to storage synchronously.
     */
    localStorage_storesTransactionsSynchronously : function(test, log) {
        let testTransaction2 = unitTestingExporter.getTestTransactions()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let success = false;
        try {
            lsInjector.writeTransactionSync(testTransaction2.transactionHash, JSON.stringify(testTransaction2));
            success = true;
        } catch (e) {
            log(e);
        }
        test.assert(success, "Writing synchronously should not fail for valid data");
    },
    /**
     * Confirm that blocks can be written to storage asynchronously.
     */
    localStorage_storesBlocksAsynchronously : function(test, log) {
        let testBlock = unitTestingExporter.getTestBlocks()[0];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        lsInjector.writeBlockAsync(testBlock.blockHash, JSON.stringify(testBlock), testBlock.generation, (err) => {
            test.runAssertsFromAsync(() => {
                test.assert(err == null, "Test was supposed to pass however failed with error: " + err);
            }, "localStorage_storesBlocksAsynchronously");
        });
    },
    /**
     * Confirm that blocks can be written to storage synchronously.
     */
    localStorage_storesBlocksSynchronously : function(test, log) {
        let testBlock2 = unitTestingExporter.getTestBlocks()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let success = false;
        try {
            lsInjector.writeBlockSync(testBlock2.blockHash, JSON.stringify(testBlock2), testBlock2.generation);
            success = true;
        } catch (e) {
            log(e);
        }
        test.assert(success, "Writing synchronously should not fail for valid data");
    },
    /**
     * Confirm that LocalStorage can read transactions synchronously.
     */
    localStorage_readsTransactionsSynchronously : function(test, log) {
        let testTransaction2 = unitTestingExporter.getTestTransactions()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        test.assertFail(() => {
            let readTransaction = lsInjector.readTransactionSync(testTransaction2.transactionHash);
            test.assertAreEqual(readTransaction, JSON.string(testTransaction2), "The read transaction should match the written one from previous test");
        }, "Reading synchronously should not fail as the data should reliably exist from previous synchronous test");
    },
    /**
     * Confirm that LocalStorage can read transactions asynchronously.
     */
    localStorage_readsTransactionsAsynchronously : function(test, log) {
        let testTransaction = unitTestingExporter.getTestTransactions()[0];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let readTransaction = lsInjector.readTransactionAsync(testTransaction.transactionHash, (err, transaction) => {
            if (err != null) {
                test.runAssertsFromAsync(() => {
                    test.assert(err != null, "Reading threw unexpected error: " + err);
                    test.assertAreEqual(transaction.toString(), JSON.stringify(testTransaction), "Should have read the same data as test transaction");
                }, "localStorage_readsTransactionsAsynchronously");
            }
        });
    },
    /**
     * Confirm that LocalStorage can read blocks synchronously. 
     */
    localStorage_readsBlocksSynchronously : function(test, log) {
        let testBlock2 = unitTestingExporter.getTestBlocks()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        test.assertFail(() => {
            let readBlock = lsInjector.readBlockSync(testBlock2.blockHash);
            test.assertAreEqual(readBlock, JSON.string(testBlock2), "The read block should match the written one from previous test");
        }, "Reading synchronously should not fail as the data should reliably exist from previous synchronous test");
    },
    /**
     * Confirm that LocalStorage can read blocks asynchronously.
     */
    localStorage_readsBlocksAsynchronously : function(test, log) {
        let testBlock = unitTestingExporter.getTestBlocks()[0];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let readBlock = lsInjector.readBlockAsync(testBlock.generation, testBlock.blockHash, (err, block) => {
            if (err != null) {
                test.runAssertsFromAsync(() => {
                    test.assert(err != null, "Reading threw unexpected error: " + err);
                    test.assertAreEqual(block.toString(), JSON.stringify(testBlock), "Should have read the same data as test block");
                }, "localStorage_readsBlocksAsynchronously");
            }
        });
    },
    /**
     * Confirm that transactions can be removed from storage.
     */
    localStorage_removesTransactionFromStorage : function(test, log) {
        let testTransaction = unitTestingExporter.getTestTransactions()[0];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let copyTransaction = conformHelper.deepCopy(testTransaction);
        copyTransaction.transactionHash = "MODIFIEDCOPY";
        // Must save a copy that won't interrupt other tests as we're removing it asynchronously
        lsInjector.writeTransactionAsync(copyTransaction.transactionHash, JSON.stringify(copyTransaction), (err) => {
            if (err == null) {
                // As the copy saved, remove it
                lsInjector.removeTransactionAsync(copyTransaction.transactionHash, (err) => {
                    // If it failed to remove, invoke the error message
                    if (err == null) {
                        test.runAssertsFromAsync(() => {
                            test.assert(err == null, "Test was supposed to pass however failed with error: " + err);
                        }, "localStorage_removesTransactionFromStorage");
                    }
                });
            } else {
                test.runAssertsFromAsync(() => {
                    test.assert(err == null, "Test was supposed to pass however failed with error: " + err);
                }, "localStorage_removesTransactionFromStorage");
            }
        });
    },
    /**
     * Confirm that blocks can be removed from storage.
     */
    localStorage_removesBlocksFromStorage : function(test, log) {
        let testBlock = unitTestingExporter.getTestBlocks()[0];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let copyBlock = conformHelper.deepCopy(testBlock);
        copyBlock.blockHash = "MODIFIEDCOPY";
        // Must save a copy that won't interrupt other tests as we're removing it asynchronously
        lsInjector.writeBlockAsync(copyBlock.blockHash, JSON.stringify(copyBlock), copyBlock.generation, (err) => {
            if (err == null) {
                // As the copy saved, remove it
                lsInjector.removeBlockAsync(copyBlock.generation, copyBlock.blockHash, (err) => {
                    // If it failed to remove, invoke the error message
                    if (err == null) {
                        test.runAssertsFromAsync(() => {
                            test.assert(err == null, "Test was supposed to pass however failed with error: " + err);
                        }, "localStorage_removesBlocksFromStorage");
                    }
                });
            } else {
                test.runAssertsFromAsync(() => {
                    test.assert(err == null, "Test was supposed to pass however failed with error: " + err);
                }, "localStorage_removesBlocksFromStorage");
            }
        });
    },
    /**
     * Confirm that LocalStorage can read all transactions in the entanglement synchronously.
     */
    localStorage_readsFullEntanglementFromStorage : function(test, log) {
        let testTransaction2 = unitTestingExporter.getTestTransactions()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let transactions = lsInjector.readEntanglementSync();
        // transaction[0] and [2] may or may not be partially written at this point due to them being asynchronous,
        // however, transaction[1] should be fully written as it was synchronous
        test.assertAreEqual(transactions[1], JSON.stringify(testTransaction2), "The second transaction read should be valid" );
    },
    /**
     * Confirm that LocalStorage can read all blocks for a generation from the blockchain synchronously.
     */
    localStorage_readsABlockchainFromStorage : function(test, log) {
        let testBlock2 = unitTestingExporter.getTestBlocks()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let blocks = lsInjector.readBlockchainSync(1);
        // We'll check that block[1] matches where we expect it to be
        test.assertAreEqual(blocks[1], JSON.stringify(testBlock2), "The first block read should be valid" );
    },
    /**
     * Confirm that LocalStorage can read all blocks for all generations of blockchains synchronously.
     */
    localStorage_readsAllBlockchainsFromStorage : function(test, log) {
        let testBlock2 = unitTestingExporter.getTestBlocks()[1];
        let lsInjector = module.exports.newLocalStorageInjector(testLocalStorage);
        test.assert(lsInjector != undefined, "Failed to create a local storage injector");
        let blocks = lsInjector.readBlockchainsSync();
        // blocks[1] and blocks[2] may or may not be partially written at this pint due to the being asynchronous,
        // hpwever, block[0] should be fully written as it was synchronous
        log("##1##: " + blocks[1]);
        log("##1##: " + testBlock2);
        test.assertAreEqual(blocks[1], JSON.stringify(testBlock2), "The first block read should be valid" );
    }
}