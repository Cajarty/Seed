


const fs = require('fs')
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

    writeBlock(storageName, storageObject, generation) {
        ensureCreated(this.blockPath(generation));
        let path = this.blockPath(generation, storageName);
        fs.writeFile(path, storageObject);
        return true;
    }

    writeBlockchain(generation, storageNames, storageObjects) {
        if (storageNames.length == storageObjects.length) {
            for(let i = 0; i < storageNames.length; i++) {
                this.writeBlock(storageNames[i], storageObjects[i], generation);
            }
        }
        return true;
    }
     
    writeBlockchains(generation, blockchains) {
        // returns bool
    }

    writeTransaction(storageName, storageObject) {
        let path = this.transactionPath(storageName);
        fs.writeFile(path, storageObject);
        return true;
    }

    writeEntanglement(entanglement) {
        // returns bool
    }

    readBlock(storageName) {

    }

    readBlockchain(generation) {

    }

    readBlockchains() {

    }

    readTransaction(storageName) {

    }

    readEntanglement() {

    }
}