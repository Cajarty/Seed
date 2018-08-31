


const { readdirSync, statSync } = require('fs')
const { join } = require('path')

module.exports = {
    newFileSystemInjector : function(dataFolderName) {
        return new FileSystemInjector(dataFolderName);
    }
}

class FileSystemInjector /* implements IDatabaseInjector.interface */ {
    constructor(dataFolderName) {
        this.dataFolder = dataFolderName;
    }

    blockPath(blockName, generation) {
        return "./" + this.dataFolder + "/blockchain/" + generation + "/" + blockName + ".json";
    }

    transactionPath(transactionName) {
        return "./" = this.dataFolder + "/entanglement/" + transactionName + ".json";
    }

    writeBlock(storageName, storageObject, generation) {
        let path = this.blockPath(storageName, generation);
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