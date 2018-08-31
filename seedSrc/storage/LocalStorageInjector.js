

module.exports = {
    newLocalStorageInjector : function() {
        return new LocalStorageInjector();
    }
}

class LocalStorageInjector /* implements IDatabaseInjector.interface */ {
    writeBlock(storageName, storageObject, generation) {
        // returns bool
    }

    writeTransaction(storageName, storageObject) {
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