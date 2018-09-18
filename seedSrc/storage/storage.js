/**************
 * storage.js *
 **************
 * 
 * Exports the storage class which handles saving/loading to storage Blockchain and Transaction data.
 * 
 * This class wraps all logic regarding saving/loading, however handled with an abstracted away implementation of
 * how how to save/load. Whether using LocalStorage, MongoDB or files for storage, an iDatabaseInjector object is
 * created to handle the implementation.
 * 
 * The expected functions can be found in the IDatabaseInjector.interface file.
 */

let storage = undefined;

module.exports = {
    /**
     * Creates and assigns a new storage object, passing in an instantiated iDatabaseInjector compliant object, and a flag
     * regarding whether the data is to be compressed or not when saving/loading
     * 
     * @param {*} iDatabaseInjector - An object which has the same functions as the iDatabaseInjector pattern
     * @param {*} useCompression - A flag regarding compressing data or not
     */
    newStorage : function(iDatabaseInjector, useCompression) {
        if (iDatabaseInjector) {
            storage = new Storage(iDatabaseInjector, useCompression);
        }
        return storage;
    },
    /**
     * @return - Returns the instantiated storage object
     */
    getStorage : function() {
        return storage;
    },
    /**
     * Invokes the storage's loadInitialState function, which tries to load all transactions/blocks from storage
     */
    loadInitialState : function() {
        if (storage) {
            storage.loadInitialState();
        }
    },
    /**
     * Saves the passed in block into storage, listing which blocks must be deleted from storage when squashed
     * to create the passed in block
     * 
     * @param newBlock - The newly created block to store
     * @param replacedBlocks - An array of blocks that need to be deleted
     */
    saveBlock : function(newBlock, replacedBlocks) {
        if (storage) {
            storage.saveBlock(newBlock, replacedBlocks);
        }
    },
    /**
     * Saves the passed in transaction into storage.
     * 
     * @param newTransaction - The transaction to store in storage
     */
    saveTransaction : function(newTransaction) {
        if (storage) {
            storage.saveTransaction(newTransaction);
        }
    },
    getUnitTests : function() {
        return storageUnitTests;
    }
}

const ledgerExporter = require("../ledger.js");
const blockchainExporter = require("../blockchain.js");
const svmExporter = require("../virtualMachine/virtualMachine.js");
const transactionExporter = require("../transaction.js");
const zlib = require('zlib');
const blockExporter = require("../block.js");
const unitTestingExporter = require("../tests/unitTesting.js");
const fileSystemInjector = require("./fileSystemInjector.js");
const localStorageInjector = require("./localStorageInjector.js");

/**
 * The implementation of the Storage object which wraps the logic regarding saving/loading transactions and blocks
 */
class Storage {
    /**
     * The constructor for storage which simply saves the passed in parameters
     * 
     * @param {*} iDatabaseInjector - An instantiated object which complies with the iDatabaseInjector pattern
     * @param {*} useCompression - A flag regarding whether or not to use compression with the data
     */
    constructor(iDatabaseInjector, useCompression) {
        this.databaseInjector = iDatabaseInjector;
        this.useCompression = useCompression;
    }

    readInitialState() {
        let blocksJSON = this.databaseInjector.readBlockchainsSync();
        let blocks = [];
        for(let i = 0; i < blocksJSON.length; i++) {
            blocks.push(this.tryDecompress(blocksJSON[i]));
        }
        let transactionsJSON = this.databaseInjector.readEntanglementSync();
        let transactions = [];
        for(let i = 0; i < transactionsJSON.length; i++) {
            transactions.push(this.tryDecompress(transactionsJSON[i]));
        }
        return { blocks : blocks, transactions : transactions };
    }

    /**
     * Invokes the storage's loadInitialState function, which tries to load all transactions/blocks from storage
     */
    loadInitialState(blocks, transactions) {
        let sortByTimestamp = function(a, b){
            return a.timestamp - b.timestamp
        };
        
        blocks.sort(sortByTimestamp);
        for(let i = 0; i < blocks.length; i++) {
            if (blockExporter.isValid(blocks[i])) {
                blockchainExporter.addTestamentBlock(blocks[i], false);
                ledgerExporter.getLedger().applyBlock(blocks[i]);
            } else {
                throw "FAILED TO CHECK VALIDITY OF BLOCK";
            }
        }
        transactions.sort(sortByTimestamp);
        for(let i = 0; i < transactions.length; i++) {
            let txData = transactions[i];
            let transaction = transactionExporter.createExistingTransaction(txData.sender, txData.execution, txData.validatedTransactions, txData.transactionHash, txData.signature, txData.timestamp);
            svmExporter.getVirtualMachine().incomingTransaction(transaction, false);
        }
    }

    /**
     * Saves the passed in block into storage, listing which blocks must be deleted from storage when squashed
     * to create the passed in block
     * 
     * @param newBlock - The newly created block to store
     * @param replacedBlocks - An array of blocks that need to be deleted
     */
    saveBlock(newBlock, replacedBlocks) {
        this.databaseInjector.writeBlockSync(newBlock.blockHash, this.tryCompress(newBlock), newBlock.generation);
        let transactions = JSON.parse(newBlock.transactions);
        let transactionHashes = Object.keys(transactions);
        for(let i = 0; i < transactionHashes.length; i++) {
            this.databaseInjector.removeTransactionAsync(transactionHashes[i]);
        }
        if (replacedBlocks) {
            for(let i = 0; i < replacedBlocks.length; i++) {
                this.databaseInjector.removeBlockAsync(replacedBlocks[i].generation, replacedBlocks[i].blockHash);
            }
        }
    }

    /**
     * Saves the passed in transaction into storage.
     * 
     * @param newTransaction - The transaction to store in storage
     */
    saveTransaction(newTransaction) {
        this.databaseInjector.writeTransactionSync(newTransaction.transactionHash, this.tryCompress(newTransaction));
    }

    /**
     * Takes in an object and turns it into a (possibly compressed) JSON string
     * 
     * @param {*} toCompress - JavaScript object to compress
     */
    tryCompress(toCompress) {
        let result = JSON.stringify(toCompress);
        if (this.useCompression) {
            result = zlib.deflateSync(result).toString('base64');
        }
        return result;
    }

    /**
     * Takes in a (possibly compressed) JSON string and turns it into a JavaScript object
     * 
     * @param {*} compressed 
     */
    tryDecompress(compressed) {
        if (this.useCompression) {
            compressed = zlib.inflateSync(new Buffer(compressed, 'base64')).toString('utf8');
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

const testLocalStorage = {};

const storageUnitTests = {
    /**
     * Confirm that Storage can save a transaction to the file system using FileStorageInjector.
     */
    storage_canSaveTransactionToFileSystem : function(test, log) {
        let toSave = unitTestingExporter.getTestTransactions()[0];
        let fsInjector = fileSystemInjector.newFileSystemInjector(__dirname, "storageTests");
        let testStorage = new Storage(fsInjector, false);
        try {
            testStorage.saveTransaction(toSave);
            test.assertAreEqual(fsInjector.readTransactionSync(toSave.transactionHash), JSON.stringify(toSave), "Should have saved the saved transaction stored");
        } catch (e) {
            test.assert(false, "Failed to save Transaction: " + e);
        }
    },
    /**
     * Confirm that Storage can save a block to the file system using FileStorageInjector.
     */
    storage_canSaveBlockToFileSystem : function(test, log) {
        blockchainExporter.clearAll();
        let toSave = unitTestingExporter.getTestBlocks()[0];
        let fsInjector = fileSystemInjector.newFileSystemInjector(__dirname, "storageTests");
        let testStorage = new Storage(fsInjector, false);
        try {
            testStorage.saveBlock(toSave);
            test.assertAreEqual(fsInjector.readBlockSync(toSave.generation, toSave.blockHash), JSON.stringify(toSave), "Should have saved the saved block stored");
        } catch (e) {
            test.assert(false, "Failed to save Transaction: " + e);
        }
    },
    /**
     * Confirm that Storage, using FileStorageInjector, can load all the initial ledger state, reading all blockchains/entanglement and 
     * applying all blocks/transactions to the virtual machine.
     */
    storage_canLoadInitialStateFromFileSystem : function(test, log) {
        let saved = unitTestingExporter.getTestBlocks()[0];
        let fsInjector = fileSystemInjector.newFileSystemInjector(__dirname, "storageTests");
        let testStorage = new Storage(fsInjector, false);
        testStorage.loadInitialState();
        test.assertAreEqual(blockchainExporter.getBlockchains()[1].length, 1, "Should only have one generation-one block loaded");
        test.assertAreEqual(JSON.stringify(blockchainExporter.getBlockchains()[1][0]), JSON.stringify(saved), "The discovered block should be the one saved from earlier.");
        blockchainExporter.clearAll();
    },
    /**
     * Confirm that Storage can save a transaction to local storage using LocalStorageInjector.
     */
    storage_canSaveTransactionToLocalStorage : function(test, log) {
        let toSave = unitTestingExporter.getTestTransactions()[0];
        let lsInjector = localStorageInjector.newLocalStorageInjector(testLocalStorage);
        let testStorage = new Storage(lsInjector, false);
        try {
            testStorage.saveTransaction(toSave);
            test.assertAreEqual(lsInjector.readTransactionSync(toSave.transactionHash), JSON.stringify(toSave), "Should have saved the transaction attempted to be stored");
        } catch (e) {
            test.assert(false, "Failed to save Transaction: " + e);
        }
    },
    /**
     * Confirm that Storage can save a block to local storage using LocalStorageInjector.
     */
    storage_canSaveBlockToLocalStorage : function(test, log) {
        blockchainExporter.clearAll();
        let toSave = unitTestingExporter.getTestBlocks()[0];
        let lsInjector = localStorageInjector.newLocalStorageInjector(testLocalStorage);
        let testStorage = new Storage(lsInjector, false);
        try {
            testStorage.saveBlock(toSave);
            test.assertAreEqual(lsInjector.readBlockSync(toSave.generation, toSave.blockHash), JSON.stringify(toSave), "Should have saved the block attempted to be stored");
        } catch (e) {
            test.assert(false, "Failed to save Transaction: " + e);
        }
    },
    /**
     * Confirm that Storage, using LocalStorageInjector, can load all the initial ledger state, reading all blockchains/entanglement and applying 
     * all blocks/transactions to the virtual machine.
     */
    storage_canLoadInitialStateFromLocalStorage : function(test, log) {
        let saved = unitTestingExporter.getTestBlocks()[0];
        let lsInjector = localStorageInjector.newLocalStorageInjector(testLocalStorage);
        let testStorage = new Storage(lsInjector, false);
        testStorage.loadInitialState();
        test.assertAreEqual(blockchainExporter.getBlockchains()[1].length, 1, "Should only have one generation-one block loaded");
        test.assertAreEqual(JSON.stringify(blockchainExporter.getBlockchains()[1][0]), JSON.stringify(saved), "The discovered block should be the one saved from earlier.");
        blockchainExporter.clearAll();
    }
}