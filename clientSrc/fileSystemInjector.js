


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

    writeBlock(storageName, storageObject) {
        // returns bool
    }

    writeBlockchain(generation, blocks) {
        // returns bool
    }
     
    writeBlockchains(generation, blockchains) {
        // returns bool
    }

    writeTransaction(storageName, storageObject) {
        // returns bool
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