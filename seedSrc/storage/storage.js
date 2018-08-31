
let storage = undefined;

module.exports = {
    newStorage(iDatabaseInjector, useCompression) {
        if (iDatabaseInjector) {
            storage = new Storage(iDatabaseInjector, useCompression);
        }
    },
    loadInitialState : function() {
        if (storage) {
            storage.loadInitialState();
        }
    },
    saveBlock : function(newBlock) {
        if (storage) {
            storage.saveBlock(newBlock);
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
        let blocks = this.databaseInjector.readBlockchains();
        for(let i = 0; i < blocks.length; i++) {
            let block = this.tryDecompress(blocks[i]);
            console.info("TODO", "Add to blockchains", block);
        }
        let transactions = this.databaseInjector.readEntanglement();
        for(let i = 0; i < transactions.length; i++) {
            let transaction = this.tryDecompress(transactions[i]);
            console.info("TODO", "Add to entanglement", transaction);
        }
    }

    saveBlock(newBlock) {
        this.databaseInjector.writeBlock(newBlock.blockHash, this.tryCompress(newBlock));
        let transactions = newBlock.transactions;
        for(let i = 0; i < transactions.length; i++) {
            let transaction = this.tryDecompress(transaction[i]);
            console.info("TODO", "Remove", transaction.transactionHash);
        }
    }

    saveTransaction(newTransaction) {
        
        // Saves the new transaction to storage
    }

    tryCompress(toCompress) {
        let result = JSON.strinify(toCompress);
        if (this.useCompression) {
            // compress and return compressed version
        }
        return result;
    }

    tryDecompress(compressed) {
        if (this.useCompression) {
            // decompress and return decompressed version
        }
        let result = JSON.parse(compressed);
        return result;
    }
}