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
    let keys = Object.keys(this.localStorage);
    for(let i = 0; i < localStorage.length; i++) {
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
    let keys = Object.keys(this.localStorage);
    for(let i = 0; i < localStorage.length; i++) {
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
        this.localStorage.removeItem(transactionName);
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
        this.localStorage.removeItem(blockKey);
        callback(undefined, blockname);
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
     * Writes a transaction to.
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
                blocks.push(blockchain[i]);
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
                    blocks.push(blockchain[i]);
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

const localStorageInjectorUnitTests = {
    /**
     * Confirm that transactions can be written to storage asynchronously.
     */
    localStorage_storesTransactionsAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that transactions can be written to storage synchronously.
     */
    localStorage_storesTransactionsSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that blocks can be written to storage asynchronously.
     */
    localStorage_storesBlocksAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that blocks can be written to storage synchronously.
     */
    localStorage_storesBlocksSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read transactions synchronously.
     */
    localStorage_readsTransactionsSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read transactions asynchronously.
     */
    localStorage_readsTransactionsAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read blocks synchronously. 
     */
    localStorage_readsBlocksSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read blocks asynchronously.
     */
    localStorage_readsBlocksAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that transactions can be removed from storage.
     */
    localStorage_removesTransactionFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that blocks can be removed from storage.
     */
    localStorage_removesBlocksFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read all transactions in the entanglement synchronously.
     */
    localStorage_readsFullEntanglementFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read all blocks for a generation from the blockchain synchronously.
     */
    localStorage_readsABlockchainFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that LocalStorage can read all blocks for all generations of blockchains synchronously.
     */
    localStorage_readsAllBlockchainsFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    }
}