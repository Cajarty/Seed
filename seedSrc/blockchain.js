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

const squasherExporter = require("./squasher.js");


module.exports = {
    /**
     * Adds a block to the blockchain, potentially triggering the squashing of blocks as well
     * 
     * @param {*} block - The block to add to the blockchains
     */
    addTestamentBlock: function(block) {
        ensureCreated(block.generation);
        blockchain[block.generation].push(block);

        if (squasherExporter.doesTriggerSquashing(block.blockHash)) {
            let nextGenerationBlock = squasherExporter.blocksToGenerationBlock(blockchain[block.generation]);

            deleteGenerationOfBlocks(block.generation);

            this.addTestamentBlock(nextGenerationBlock);
        }

        debugBlockchain();
    }
 }

 // The mapping of blocks in the blockchain 
 let blockchain = {}

 /**
  * Helper function for deleting a certain generation of blocks from the blockchain*
  * 
  * @param {*} generation - The generation to delete
  */
 let deleteGenerationOfBlocks = function(generation) {
    blockchain[generation] = [];
    delete blockchain[generation];
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