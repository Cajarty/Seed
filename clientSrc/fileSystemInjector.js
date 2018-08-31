


const fs = require('fs')
const readdirSync = fs.readdirSync;
const statSync = fs.statSync;
const { join } = require('path')

module.exports = {
    newFileSystemInjector : function(dataFolderName) {
        return new FileSystemInjector(dataFolderName);
    }
}

let ensureCreated = function(directory) {
    if (!fs.existsSync(directory)){
        fs.mkdirSync(directory);
    }
}

let getDirectories = path => readdirSync(path).filter(fileOrFolder => statSync(join(path, fileOrFolder)).isDirectory());
let getFiles = path => readdirSync(path).filter(fileOrFolder => statSync(join(path, fileOrFolder)).isFile());

class FileSystemInjector /* implements IDatabaseInjector.interface */ {
    constructor(dataFolderName) {
        this.dataFolder = dataFolderName;
        let dataFolderPath = __dirname + "/" + dataFolderName;
        ensureCreated(dataFolderPath);
        ensureCreated(this.blockPath());
        ensureCreated(this.transactionPath());
    }

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
        fs.unlink(this.transactionPath(transactionName));
    }

    removeBlock(generation, blockName) {
        fs.unlink(this.blockPath(generation, blockName));
    }

    writeBlock(storageName, storageObject, generation) {
        ensureCreated(this.blockPath(generation));
        let path = this.blockPath(generation, storageName);
        fs.writeFile(path, storageObject);
        return true;
    }

    writeTransaction(storageName, storageObject) {
        let path = this.transactionPath(storageName);
        fs.writeFile(path, storageObject);
        return true;
    }

    readBlock(generation, storageName, callback) {
        fs.readFile(this.blockPath(generation, storageName), callback);
    }

    readBlockSync(generation, storageName) {
        return fs.readFileSync(this.blockPath(generation, storageName));
    }

    readBlockchain(generation) {
        let blocks = [];
        let files = getFiles(this.blockPath(generation));
        for(let i = 0; i < files.length; i++) {
            let blockHash = files[i].split(".")[0];
            blocks.push(this.readBlockSync(generation, blockHash));
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
        fs.readFile(this.transactionPath(storageName), callback);
    }

    readTransactionSync(storageName) {
        return fs.readFileSync(this.transactionPath(storageName));
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