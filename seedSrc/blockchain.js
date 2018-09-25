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
        if (blockExporter.isValid(block)) {
            if (saveToStorage == undefined) {
                saveToStorage = true;
            }
            ensureCreated(block.generation);
            blockchain[block.generation].push(block);
    
            let replacedBlocks = trySquash(block, saveToStorage);
            
            if (saveToStorage) {
                storageExporter.getStorage().saveBlock(block, replacedBlocks);
            }
            //debugBlockchain();
            return true;
        } else {
            return false;
        }
    },
    /**
     * Fetches the mapping of blockchains
     * 
     * @return - Gets the blockchain mapping
     */
    getBlockchains : function() {
        return blockchain;
    },
    /**
     * Fetches a transaction if it exists in a generation of blocks.
     * If no generation is requested, defaults to checking generaion 1 blocks
     * 
     * @return - The lean transaction data from the blockchain, if any
     */
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
    /**
     * Determines if a transaction exists within a block for a specific blockchain generation.
     * If no generation is requested, defaults to checking generaion 1 blocks
     * 
     * @return - Whether or not it exists
     */
    doesContainTransactions : function(transactionHash, generation) {
        return this.getTransaction(transactionHash, generation) != undefined;
    },
    /**
     * Determines whether a blockchain generation contains a certain block
     * 
     * @return - Whether or not the block exists
     */
    doesContainBlock : function(blockHash, generation) {
        let chain = blockchain[generation];
        if (chain) {
            for(let i = 0; i < chain.length; i++) {
                let block = chain[i];
                if (block.blockHash == blockHash) {
                    return true;
                }
            }
        }
        return false;
    },
    /**
     * Fetches a transaction sender, if the transaction exists in a generation of blocks.
     * If no generation is requested, defaults to checking generaion 1 blocks
     * 
     * @return - The sender of the transaction (undefined if no transaction found)
     */
    getTransactionSender : function(transactionHash, generation) {
        let leanTransactionData = this.getTransaction(transactionHash, generation);
        if (leanTransactionData && leanTransactionData.length > 0) {
            return leanTransactionData[0];
        }
        return undefined;
    },
    /**
     * Returns the mapping of unit tests for testing
     * 
     * @return - The mapping of unit tests
     */
    getUnitTests : function() {
        return blockchainUnitTests;
    },
    /**
     * Clears the stored mapping of blockchains
     */
    clearAll : function() {
        blockchain = {};
    },
    /**
     * Turns the blockchain mapping into a mapping of block headers
     * 
     * @return - A mapping of block headers
     */
    getBlockchainHeaders : function() {
        let headers = {};
        let generations = Object.keys(blockchain);
        for(let i = 0; i < generations.length; i++) {
            let generation = generations[i];
            headers[generation] = [];
            for(let j = 0; j < blockchain[generation].length; j++) {
                let block = blockchain[generation][j];
                headers[generation].push(block.blockHash);
            }
        }
        return headers;
    },
    /**
     * Takes a mapping of block headers and fetched a mapping of blocks for each block header found
     * 
     * @return - A mapping of blocks
     */
    getBlocks: function(blockHeaders) {
        let blocks = [];
        let generations = Object.keys(blockHeaders);
        console.info(generations);
        for(let i = 0; i < generations.length; i++) {
            let generation = generations[i];
            if (blockchain[generation]) {
                for(let j = 0; j < blockchain[generation].length; j++) {
                    let blockToCheck = blockchain[generation][j];
                    if (blockHeaders[generation].includes(blockToCheck.blockHash)) {
                        blocks.push(blockToCheck);
                    } else {
                        console.info("WRONG BLOCK: ", blockToCheck.blockHash);
                    }
                }
            } else {
                console.info("WTF", blockchain);
            }
        }
        return blocks;
    }
 }
 
 const blockExporter = require("./block.js");
 const squasherExporter = require("./squasher.js");
 const storageExporter = require("./storage/storage.js");
 const unitTestingExporter = require("./tests/unitTesting.js");
 const conformHelper = require("./helpers/conformHelper.js");

 // The mapping of blocks in the blockchain 
 let blockchain = {}

 /**
  * Helper method which tries to squash a blockchain

  * @param {*} trasnaction - The block checking for squashing on
  */
 let trySquash = function(block, saveToStorage) {
    if (squasherExporter.doesTriggerSquashing(block.blockHash)) {
        let nextGenerationBlock = squasherExporter.blocksToGenerationBlock(blockchain[block.generation]);
        let replacedBlocks = deleteGenerationOfBlocks(block.generation);
        module.exports.addTestamentBlock(nextGenerationBlock, saveToStorage);
        return replacedBlocks;
    }
    return undefined;
 }

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
        let validBlock = unitTestingExporter.getTestBlocks()[0];
        module.exports.addTestamentBlock(validBlock, false);
        test.assert(blockchain[1]!= undefined && blockchain[1][0].blockHash == validBlock.blockHash, "Failed to add block");
    },
    /**
     * Confirms adding blocks fails if the block is invalid
     */
    blockchain_doesNotAddInvalidBlockToBlockchain : function(test, log) {
        let invalidBlock = conformHelper.deepCopy(unitTestingExporter.getTestBlocks()[1]);
        invalidBlock.generation = 0; // Make the block invalid by modifying it
        test.assertFail(() =>  {
            module.exports.addTestamentBlock(invalidBlock, false);
        }, "The block validation check should have thrown on error on malformed block");
        test.assertAreEqual(blockchain[0], undefined, "Generation zero should still not (and never) exist");
    },
    /**
     * Confirm blocks can invoke the block squashing mechanism if they have the right hash.
     */
    blockchain_blocksCanInvokeSquashingMechanism : function(test, log) {
        let invalidBlock = conformHelper.deepCopy(unitTestingExporter.getTestBlocks()[1]);
        invalidBlock.blockHash = '0' + invalidBlock.blockHash.substr(1);
        trySquash(invalidBlock, false);
        test.assertAreEqual(blockchain[1], undefined, "There should be no blocks remaining in generation 1, as they were squashed");
    }
}