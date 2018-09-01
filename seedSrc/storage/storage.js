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

const ledgerExporter = require("../ledger.js");
const blockchainExporter = require("../blockchain.js");
const svmExporter = require("../virtualMachine/virtualMachine.js");
const transactionExporter = require("../transaction.js");

class Storage {
    constructor(iDatabaseInjector, useCompression) {
        this.databaseInjector = iDatabaseInjector;
        this.useCompression = useCompression;
    }

    loadInitialState() {
        let sortByTimestamp = function(a, b){
            return a.timestamp - b.timestamp
        };
        let blocksJSON = this.databaseInjector.readBlockchains();
        let blocks = [];
        for(let i = 0; i < blocksJSON.length; i++) {
            blocks.push(this.tryDecompress(blocksJSON[i]));
        }
        blocks.sort(sortByTimestamp);
        for(let i = 0; i < blocks.length; i++) {
            blockchainExporter.addTestamentBlock(blocks[i], false);
            ledgerExporter.getLedger().applyBlock(blocks[i]);
        }
        let transactionsJSON = this.databaseInjector.readEntanglement();
        let transactions = [];
        for(let i = 0; i < transactionsJSON.length; i++) {
            transactions.push(this.tryDecompress(transactionsJSON[i]));
        }
        transactions.sort(sortByTimestamp);
        for(let i = 0; i < transactions.length; i++) {
            let txData = transactions[i];
            let transaction = transactionExporter.createExistingTransaction(txData.sender, txData.execution, txData.validatedTransactions, txData.transactionHash, txData.signature, txData.timestamp);
            svmExporter.getVirtualMachine().incomingTransaction(transaction, false);
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
        let result = undefined;
        try {
            result = JSON.parse(compressed);
        } catch (e) {
            console.info("ERROR: Failed to parse", compressed, e);
        }
        return result;
    }
}