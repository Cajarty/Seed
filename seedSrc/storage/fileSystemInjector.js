
/*************************
 * fileSystemInjector.js *
 *************************
 * 
 * Exports an implementation of the IDatabaseInjector pattern which implements saving/loading
 * to the local file system
 * 
 */

module.exports = {
    /**
     * Creates a new FileSystemInjector implementation
     * 
     * @return - A new FileSystemInjector object
     */
    newFileSystemInjector : function(baseDirectory, dataFolderName) {
        return new FileSystemInjector(baseDirectory, dataFolderName);
    },
    getUnitTests : function() {
        return fileStorageInjectorUnitTests;
    }
}

const fs = require('fs')
const readdirSync = fs.readdirSync;
const statSync = fs.statSync;
const { join } = require('path')

/**
 * Helper function which ensures a directory exists, and creates it if not
 * 
 * @param {*} directory - The directory to check for/create
 */
let ensureCreated = function(directory) {
    if (!fs.existsSync(directory)){
        fs.mkdirSync(directory);
    }
}

/**
 * Helper function which gets all the sundirectory names of a directory
 * 
 * @param {*} path - The path to grab the subdirectories from
 */
let getDirectories = path => readdirSync(path).filter(fileOrFolder => statSync(join(path, fileOrFolder)).isDirectory());

/**
 * Helper function which gets all the file names of a directory
 * 
 * @param {*} path - The path to grab the files from
 */
let getFiles = path => readdirSync(path).filter(fileOrFolder => statSync(join(path, fileOrFolder)).isFile());

/**
 * A IDatabaseInjector implementation which reads/writes blocks/transactions from the file system
 */
class FileSystemInjector /* implements IDatabaseInjector.interface */ {
    /**
     * Constructor for the fileSystemInjector class. Creates the base directories of the project if they do
     * not already exists.
     * 
     * The subdirectories would look like:
     *  /dataFolderName/entanglement
     *  /dataFolderName/blockchain
     * 
     * @param {*} baseDirectory - The root directory of where dataFolder will reside
     * @param {*} dataFolderName - The base folder name of the location data is stored in
     */
    constructor(baseDirectory, dataFolderName) {
        this.dataFolderPath = baseDirectory + "/" + dataFolderName;
        ensureCreated(this.dataFolderPath);
        ensureCreated(this.blockPath());
        ensureCreated(this.transactionPath());
    }

    /**
     * Creates the path name for a block, with optional parameters for a subdirectory and possible file name.
     * 
     * e.g. 
     *  blockPath() returns "/dataFolderPath/blockchain"
     *  blockPath(1) returns "/dataFolderPath/1"
     *  blockPath(1, "hash") returns /dataFolderPath/1/hash.json
     * 
     * @param {*} generation - (optional) The generation of the block whos path we are getting
     * @param {*} blockName - (optional) The hash of the block whos path we are getting
     */
    blockPath(generation, blockName) {
        if (generation) {
            if (blockName) {
                return this.dataFolderPath + "/blockchain/" + generation + "/" + blockName + ".json";
            } else {
                return this.dataFolderPath + "/blockchain/" + generation;
            }
        } else {
            return this.dataFolderPath + "/blockchain";
        }
    }

    /**
     * Creates the path name for a transaction
     * 
     * e.g. 
     *  transactionPath() returns "/dataFolderPath/entanglement"
     *  transactionPath("hash") returns "/dataFolderPath/entanglement/hash.json"
     * 
     * @param {*} transactionName - (optional) The hash of the transaction we are getting
     */
    transactionPath(transactionName) {
        if (transactionName) {
            return this.dataFolderPath + "/entanglement/" + transactionName + ".json";
        } else {
            return this.dataFolderPath + "/entanglement";
        }
    }

    /**
     * Removes a transaction from storage asyncrhonously, invoking an optional
     * callback upon completion
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
        fs.unlink(this.transactionPath(transactionName), callback);
    }

    /**
     * Removes a block from storage asynchronously, invoking an optional
     * callback upon completion
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
        fs.unlink(this.blockPath(generation, blockName), callback);
    }

    /**
     * Writes a block to storage asynchronously, invoking an optional
     * callback upon completion
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
        ensureCreated(this.blockPath(generation));
        let path = this.blockPath(generation, storageName);
        fs.writeFile(path, storageObject, callback);
    }

    /**
     * Writes a transaction to storage asynchronously, invoking an optional
     * callback upon completion
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
        let path = this.transactionPath(storageName);
        fs.writeFile(path, storageObject, callback);
    }

    /**
     * Reads a block from storage asynchronously, with a callback to invoke
     * on once reading has finished
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
        fs.readFile(this.blockPath(generation, storageName), callback);
    }

    /**
     * Reads a block from storage synchronously, returning the block upon completion.
     * 
     * @param {*} generation - The generation of block it is
     * @param {*} storageName - The name of the block in storage
     */
    readBlockSync(generation, storageName) {
        return fs.readFileSync(this.blockPath(generation, storageName)).toString();
    }

    /**
     * Reads all blocks of a certain generation synchronously, returning as an array
     * 
     * @param {*} generation - The generation of blocks to be read
     */
    readBlockchainSync(generation) {
        let blocks = [];
        let files = getFiles(this.blockPath(generation));
        for(let i = 0; i < files.length; i++) {
            let blockHash = files[i].split(".")[0];
            let result = this.readBlockSync(generation, blockHash);
            blocks.push(result);
        }
        return blocks;
    }

    /**
     * Reads all blockchains of all generations and returns them as a long array of blocks
     */
    readBlockchainsSync() {
        let blocks = [];
        let generations = getDirectories(this.blockPath());
        for(let i = 0; i < generations.length; i++) {
            let generation = parseInt(generations[i]);
            blocks = blocks.concat(this.readBlockchainSync(generation));
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
        fs.readFile(this.transactionPath(storageName), callback);
    }

    /**
     * Reads a transaction synchronously from storage and returns it
     * 
     * @param {*} storageName - The name of the transaction in storage
     */
    readTransactionSync(storageName) {
        return fs.readFileSync(this.transactionPath(storageName)).toString();
    }

    /**
     * Reads the entanglement from storage synchronously, returning all transactions read
     */
    readEntanglementSync() {
        let transactions = [];
        let files = getFiles(this.transactionPath());
        for(let i = 0; i < files.length; i++) {
            let transactionHash = files[i].split(".")[0];
            transactions.push(this.readTransactionSync(transactionHash));
        }
        return transactions;
    }
}

const fileStorageInjectorUnitTests = {
    /**
     * Confirm that transactions can be written to storage asynchronously.
     */
    fileStorage_storesTransactionsAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that transactions can be written to storage synchronously.
     */
    fileStorage_storesTransactionsSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that blocks can be written to storage asynchronously.
     */
    fileStorage_storesBlocksAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that blocks can be written to storage synchronously.
     */
    fileStorage_storesBlocksSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read transactions synchronously.
     */
    fileStorage_readsTransactionsSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read transactions asynchronously.
     */
    fileStorage_readsTransactionsAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read blocks synchronously. 
     */
    fileStorage_readsBlocksSynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read blocks asynchronously.
     */
    fileStorage_readsBlocksAsynchronously : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that transactions can be removed from storage.
     */
    fileStorage_removesTransactionFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that blocks can be removed from storage.
     */
    fileStorage_removesBlocksFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read all transactions in the entanglement synchronously.
     */
    fileStorage_readsFullEntanglementFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read all blocks for a generation from the blockchain synchronously.
     */
    fileStorage_readsABlockchainFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm that FileStorage can read all blocks for all generations of blockchains synchronously.
     */
    fileStorage_readsAllBlockchainsFromStorage : function(test, log) {
        test.assert(false, "Test Not Implemented");
    }
}