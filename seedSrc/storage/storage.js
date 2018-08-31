
let storage = undefined;

module.exports = {
    newStorage(iDatabaseInjector, useCompression) {
        if (iDatabaseInjector) {
            storage = new Storage(iDatabaseInjector, useCompression);
        }
        return storage;
    },
    getStorage() {
        return storage;
    },
    loadInitialState : function() {
        if (storage) {
            storage.loadInitialState();
        }
    },
    saveBlock : function(newBlock, replacedBlocks) {
        if (storage) {
            storage.saveBlock(newBlock, replacedBlocks);
        }
    },
    saveTransaction : function(newTransaction) {
        if (storage) {
            storage.saveTransaction(newTransaction);
        }
    }
}

class Storage {
    constructor(iDatabaseInjector, useCompression) {
        this.databaseInjector = iDatabaseInjector;
        this.useCompression = useCompression;
    }

    loadInitialState() {
        let sortByTimestamp = function(a, b){return a.timestamp - b.timestamp};
        console.info("LoadInitialState");
        let blocks = this.databaseInjector.readBlockchains();
        blocks.sort(sortByTimestamp);
        for(let i = 0; i < blocks.length; i++) {
            let block = this.tryDecompress(blocks[i]);
            console.info("TODO", "Add to blockchains", block);
        }
        let transactions = this.databaseInjector.readEntanglement();
        transactions.sort(sortByTimestamp);
        for(let i = 0; i < transactions.length; i++) {
            let transaction = this.tryDecompress(transactions[i]);
            console.info("TODO", "Add to entanglement", transaction);
        }
    }

    saveBlock(newBlock, replacedBlocks) {
        if (this.databaseInjector.writeBlock(newBlock.blockHash, this.tryCompress(newBlock), newBlock.generation)) {
            let transactions = JSON.parse(newBlock.transactions);
            let transactionHashes = Object.keys(transactions);
            for(let i = 0; i < transactionHashes.length; i++) {
                this.databaseInjector.removeTransaction(transactionHashes[i]);
            }
            if (replacedBlocks) {
                for(let i = 0; i < replacedBlocks.length; i++) {
                    this.databaseInjector.removeBlock(replacedBlocks[i].generation, replacedBlocks[i].blockHash);
                }
            }
        } else {
            throw new Error("Failed to save block " + newBlock.blockHash);
        }
    }

    saveTransaction(newTransaction) {
        if (this.databaseInjector.writeTransaction(newTransaction.transactionHash, this.tryCompress(newTransaction))) {
            // Success
        } else {
            throw new Error("Failed to save transaction " + newTransaction.transactionHash);
        }
    }

    tryCompress(toCompress) {
        let result = JSON.stringify(toCompress);
        if (this.useCompression) {
            console.info("TODO", "Compress result");
        }
        return result;
    }

    tryDecompress(compressed) {
        if (this.useCompression) {
            console.info("TODO", "Decompress compressed");
        }
        let result = JSON.parse(compressed);
        return result;
    }
}