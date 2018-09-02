
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
    newFileSystemInjector : function(dataFolderName) {
        return new FileSystemInjector(dataFolderName);
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
     * @param {*} dataFolderName - The base folder name of the location data is stored in
     */
    constructor(dataFolderName) {
        this.dataFolder = dataFolderName;
        let dataFolderPath = __dirname + "/" + dataFolderName;
        ensureCreated(dataFolderPath);
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
                return __dirname + "/" + this.dataFolder + "/blockchain/" + generation + "/" + blockName + ".json";
            } else {
                return __dirname + "/" + this.dataFolder + "/blockchain/" + generation;
            }
        } else {
            return __dirname + "/" + this.dataFolder + "/blockchain";
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
            return __dirname + "/" + this.dataFolder + "/entanglement/" + transactionName + ".json";
        } else {
            return __dirname + "/" + this.dataFolder + "/entanglement";
        }
    }

    /**
     * Removes a transaction from storage
     * 
     * @param {*} transactionName - The name/hash of a transaction in storage
     */
    removeTransaction(transactionName) {
        fs.unlink(this.transactionPath(transactionName), (err, data) => {
            if (err) {
                throw err;
            }
        });
    }

    /**
     * Removes a block from storage
     * 
     * @param {*} generation - The generation of a block in storage
     * @param {*} blockName - The name/hash of a block in storage
     */
    removeBlock(generation, blockName) {
        fs.unlink(this.blockPath(generation, blockName), (err, data) => {
            if (err) {
                throw err;
            }
        });
    }

    /**
     * Writes a block to storage
     * 
     * @param {*} storageName - The name to use in storage (e.g. block hash)
     * @param {*} storageObject - The block to store in storage
     * @param {*} generation - The generation of block it is
     */
    writeBlock(storageName, storageObject, generation) {
        ensureCreated(this.blockPath(generation));
        let path = this.blockPath(generation, storageName);
        fs.writeFile(path, storageObject, (err, data) => {
            if (err) {
                throw err;
            }
        });
        return true;
    }

    /**
     * Writes a transaction to storage
     * 
     * @param {*} storageName - The name of the transaction to store
     * @param {*} storageObject - The transaction to store
     */
    writeTransaction(storageName, storageObject) {
        let path = this.transactionPath(storageName);
        fs.writeFile(path, storageObject, (err, data) => {
            if (err) {
                throw err;
            }
        });
        return true;
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