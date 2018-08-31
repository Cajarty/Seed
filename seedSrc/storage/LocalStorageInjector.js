

module.exports = {
    newLocalStorageInjector : function() {
        return new LocalStorageInjector();
    }
}

class LocalStorageInjector /* implements IDatabaseInjector.interface */ {
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