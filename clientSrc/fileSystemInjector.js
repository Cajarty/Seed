
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

    transactionPath(transactionName) {
        if (transactionName) {
            return __dirname + "/" + this.dataFolder + "/entanglement/" + transactionName + ".json";
        } else {
            return __dirname + "/" + this.dataFolder + "/entanglement";
        }
    }

    removeTransaction(transactionName) {
        fs.unlink(this.transactionPath(transactionName), (err, data) => {
            if (err) {
                throw err;
            }
        });
    }

    removeBlock(generation, blockName) {
        fs.unlink(this.blockPath(generation, blockName), (err, data) => {
            if (err) {
                throw err;
            }
        });
    }

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

    writeTransaction(storageName, storageObject) {
        let path = this.transactionPath(storageName);
        fs.writeFile(path, storageObject, (err, data) => {
            if (err) {
                throw err;
            }
        });
        return true;
    }

    readBlock(generation, storageName, callback) {
        if (!callback) {
            callback = (err, data) => {
                if (err) {
                    throw err;
                }
            }
        }
        fs.readFile(this.blockPath(generation, storageName), callback);
    }

    readBlockSync(generation, storageName) {
        return fs.readFileSync(this.blockPath(generation, storageName)).toString();
    }

    readBlockchain(generation) {
        let blocks = [];
        let files = getFiles(this.blockPath(generation));
        for(let i = 0; i < files.length; i++) {
            let blockHash = files[i].split(".")[0];
            let result = this.readBlockSync(generation, blockHash);
            blocks.push(result);
        }
        return blocks;
    }

    readBlockchains() {
        let blocks = [];
        let generations = getDirectories(this.blockPath());
        for(let i = 0; i < generations.length; i++) {
            let generation = parseInt(generations[i]);
            blocks = blocks.concat(this.readBlockchain(generation));
        }
        return blocks;
    }

    readTransaction(storageName) {
        fs.readFile(this.transactionPath(storageName), (err, data) => {
            if (err) {
                throw err;
            }
        });
    }

    readTransactionSync(storageName) {
        return fs.readFileSync(this.transactionPath(storageName)).toString();
    }

    readEntanglement() {
        let transactions = [];
        let files = getFiles(this.transactionPath());
        for(let i = 0; i < files.length; i++) {
            let transactionHash = files[i].split(".")[0];
            transactions.push(this.readTransactionSync(transactionHash));
        }
        return transactions;
    }
}