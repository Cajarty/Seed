/*****************
 * blockchain.js *
 *****************
 * 
 * Exports access to the blockchain.
 * 
 * Adding a block adds it to the blockchain as a first generation block. If this block meets the requirements, it may trigger squashing,
 * squashing first generation blocks into subsequent generations
 * 
 * Exported Functions:
 *      addTestamentBlock(block)
 *          - Adds a block to the blockchain, potentially triggering the squashing of blocks as well
 */

module.exports = {
    /**
     * Adds a block to the blockchain, potentially triggering the squashing of blocks as well
     * 
     * @param {*} block - The block to add to the blockchains
     */
    addTestamentBlock: function(block, saveToStorage) {
        if (saveToStorage == undefined) {
            saveToStorage = true;
        }
        ensureCreated(block.generation);
        blockchain[block.generation].push(block);

        let replacedBlocks = undefined;

        if (squasherExporter.doesTriggerSquashing(block.blockHash)) {
            let nextGenerationBlock = squasherExporter.blocksToGenerationBlock(blockchain[block.generation]);

            replacedBlocks = deleteGenerationOfBlocks(block.generation);

            this.addTestamentBlock(nextGenerationBlock, saveToStorage);
        }
        if (saveToStorage) {
            storageExporter.getStorage().saveBlock(block, replacedBlocks);
        }
        debugBlockchain();
    },
    /**
     * @return - Gets the blockchain mapping
     */
    getBlockchains : function() {
        return blockchain;
    },
    getTransaction : function(transactionHash, generation) {
        if (!generation) {
            generation = 1;
        }
        let chain = blockchain[generation];
        if (chain) {
            for(let i = 0; i < chain.length; i++) {
                let block = chain[i];
                let transactions = JSON.parse(block.transactions);
                let transactionHashes = Object.keys(transactions);
                for(let j = 0; j < transactionHashes.length; j++) {
                    if (transactionHashes[j] == transactionHash) {
                        return transactions[transactionHash];
                    }
                }
            }
        }
        return undefined;
    },
    doesContainTransactions : function(transactionHash, generation) {
        return this.getTransaction(transactionHash, generation) != undefined;
    },
    getTransactionSender : function(transactionHash, generation) {
        let leanTransactionData = this.getTransaction(transactionHash, generation);
        if (leanTransactionData && leanTransactionData.length > 0) {
            return leanTransactionData[0];
        }
        return undefined;
    },
    getUnitTests : function() {
        return blockchainUnitTests;
    }
 }
 
 const squasherExporter = require("./squasher.js");
 const storageExporter = require("./storage/storage.js");

 // The mapping of blocks in the blockchain 
 let blockchain = {}

 /**
  * Helper function for deleting a certain generation of blocks from the blockchain*
  * 
  * @param {*} generation - The generation to delete
  */
 let deleteGenerationOfBlocks = function(generation) {
    let oldBlocks = blockchain[generation];
    blockchain[generation] = [];
    delete blockchain[generation];
    return oldBlocks;
 }

 /**
  * Helper function to ensure a certain generation's chain exists in the "blockchain" mapping 
  *
  * @param {*} generation - The generation to ensure exists
  */
 let ensureCreated = function(generation) {
    if (!blockchain[generation]) {
        blockchain[generation] = [];
    }
 }

 /**
  * Helper function for printing to terminal the current state of the blockchain
  */
 let debugBlockchain = function() {
     console.info("### Debug Blockchain ###")
     let keys = Object.keys(blockchain);
     keys.sort();

     for(let i = 0; i < keys.length; i++) {
         let generation = keys[i];
         let blocks = blockchain[generation];
         if (blocks.length > 0) {
            console.info("Generation " + generation);
            for(let j = 0; j < blocks.length; j++) {
                let block = blocks[j];

                console.info("Block " + block.blockHash, "Transactions Size (bytes): " + block.transactions.length, "ChangeSet Size (bytes): " + block.changeSet.length);
            }
         }
     }
 }

 const blockchainUnitTests = {
    /**
     * Confirms blocks can be added to the blockchains
     */
    blockchain_addsValidBlockToBlockchain : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirms adding blocks fails if the block is invalid
     */
    blockchain_doesNotAddInvalidBlockToBlockchain : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm blocks can invoke the block squashing mechanism if they have the right hash.
     */
    blockchain_blocksCanInvokeSquashingMechanism : function(test, log) {
        test.assert(false, "Test Not Implemented");
    }
}