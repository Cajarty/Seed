/*##############################################################
Blockchain:
##############################################################*/

const squasherExporter = require("./squasher.js");


module.exports = {
    addTestamentBlock: function(block) {
        ensureCreated(block.generation);
        blockchain[block.generation].push(block);

        if (squasherExporter.doesTriggerSquashing(block.blockHash)) {
            let nextGenerationBlock = squasherExporter.blocksToGenerationBlock(blockchain[block.generation]);

            deleteGenerationOfBlocks(block.generation);

            ensureCreated(nextGenerationBlock.generation);
            blockchain[nextGenerationBlock.generation].push(nextGenerationBlock);
        }
        
        debugBlockchain();
    }
 }

 let deleteGenerationOfBlocks = function(generation) {
    blockchain[generation] = [];
    delete blockchain[generation];
 }

 let ensureCreated = function(generation) {
    if (!blockchain[generation]) {
        blockchain[generation] = [];
    }
 }

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

let blockchain = {}