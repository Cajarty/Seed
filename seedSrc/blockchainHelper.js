/*##############################################################
ClassDesign: /seedSrc/blockchain_classDesignsAndTests.txt

BlockchainHelper:
    generateMerkleTree(transactions)
        //Generates a merkle tree out of the transactions passed in
    isBlockProper(block)
        //Validates that a block's validation work adds up, the updateData is valid and all is good
    isValidationWorkProper(validationWork)
        //Validates that a block's validation work adds up
    isUpdateDataValid(updateData)
        //Validates that a block's update data is valid
    hashBlock(block)
        //SHA 256 hashes the block and its data
    squash(updateDatas)
        //Takes an array of updateData's to squash
    transactionsToUpdateDatas(transactions)
        //Takes an array of transactions and extracts the update data from each into one aggregated list
    generationBlocksToUpdateDatas
        //Takes an array of transactions and extracts the update data from each into one aggregated list
    extractValidationWorkFromTransactions(transactions)
        //Takes an array of transactions and extracts the validation work into one aggregated list
    extractValidationWorkFromBlocks(blocks)
        //Takes an array of blocks and extracts the validation work into one aggregated list
##############################################################*/

const transactionExporter = require("./transaction.js");
const cryptoHelperExporter = require("./cryptoHelper.js");
const blockExporter = require("./block.js");
const merkleExporter = require('merkle'); //https://www.npmjs.com/package/merkle

module.exports = {
    generateTestamentBlock: function(transactions) {
        let blockchainHelper = new BlockchainHelper();
        let updateDatas = blockchainHelper.transactionsToUpdateDatas(transactions)
        let updateData = blockchainHelper.squash(updateDatas);
        let generation = 1;
        let merkleTree = blockchainHelper.generateMerkleTree(transactions);
        let validationWork = blockchainHelper.extractValidationWorkFromTransactions(transactions);
        return blockExporter.createBlock(generation, merkleTree.root, updateData, validationWork);
    },
    generateGenerationBlock: function(generationBlocks) {
        let blockchainHelper = new BlockchainHelper();
        let generation = 0;
        for(let i = 0; i < generationBlocks.length; i++) {
            if (generation == 0) {
                generation == generationBlocks[0].generation;
            } else if (generation != generationBlocks[i].generation) {
                throw new Error("Generation blocks passed in were not from the same generation");
            }
        }
        generation++;
        let updateDatas = blockchainHelper.generationBlocksToUpdateDatas(generationBlocks)
        let updateData = blockchainHelper.squash(updateDatas);
        let merkleTree; //TODO: Merkle tree for blocks
        let validationWork = blockchainHelper.extractValidationWorkFromBlocks(generationBlocks);
        return blockExporter.createBlock(generation, merkleTree.root, updateData, validationWork);
    }, 
    exportBlockchainHelper: function() {
        return new BlockchainHelper();
    },
    runUnitTests : function() {
        console.log("UnitTests :: blockchainHelper.js :: Begin");
        let tester = new BlockchainHelperUnitTests();
        console.log("UnitTests :: blockchainHelper.js :: Complete");
    }
 }

class BlockchainHelper {
    //Generates a merkle tree out of the transactions passed in
    generateMerkleTree(transactions) {
        let merkle = merkleExporter("sha256");
        merkle.push()
    }
    
    //Validates that a block's validation work adds up, the updateData is valid and all is g
    isBlockProper(block) {
        let result = isValidationWorkProper(extractValidationWorkFromBlocks([block])) || isUpdateDataValid(block.updateData);
        //Any other chekcs
        return result;
    }
        
    //Validates that a block's validation work adds up
    isValidationWorkProper(validationWork) {
        //Make sure validationWork is an array
        //Foreach work in the array
            //Make sure the signature can be validated with the public key
            //Make sure the updateHash given afterwards is a valid structured hash
    }
        
    //Validates that a block's update data is valid
    isUpdateDataValid(updateData) {
        //Make sure the updateData is an array
        //Foreach change in data
    }
        
    //SHA 256 hashes the block and its data
    hashBlock(block) {
        return cryptoHelperExporter.newCryptoHelper().sha256(block.toString());
    }

    //Takes an array of updateDatas to squash
    squash(updateDatas) {

    }

    //Takes an array of transactions and extracts the update data from each into one aggregated list
    transactionsToUpdateDatas(transactions) {

    }

    //Takes an array of blocks and extracts the update data from each into one aggregated list
    generationBlocksToUpdateDatas(blocks) {
        
    }

    //Takes an array of transactions and extracts the validation work into one aggregated list
    extractValidationWorkFromTransactions(transactions) {

    }

    //Takes an array of blocks and extracts the validation work into one aggregated list
    extractValidationWorkFromBlocks(blocks) {
        
    }
}

/*#####################UNIT TESTS###########################
BlockchainHelperUnitTests:
    GenerateMerkleTree_generatesProperTree:
    GenerateMerkleTree_generatesProperTreeWithLotsOfTransactions:
    GenerateMerkleTree_generatesLeaflessTreeWithZeroTransactions:
    GenerateMerkleTree_throwsForNullParameters:
    GenerateMerkleTree_throwsForEmptyParameters:
    IsProperBlock_returnsTrueForValidBlock:
    IsProperBlock_returnsFalseForBlocksWithBadUpdateData:
    IsProperBlock_returnsFalseForBlocksWithBadValidationWork:
    IsProperBlock_returnsFalseForBlocksWithNegativeGenerationNumber:
    IsProperBlock_throwsForNullParameter:
    IsValidationWorkProper_returnsTrueForProperValidationWork:
    IsValidationWorkProper_returnsFalseForBadValidationWork:
    IsValidationWorkProper_returnsFalseForNullParameters:
    IsUpdateDataValid_returnsTrueForProperUpdateData:
    IsUpdateDataValid_returnsFalseForBadUpdateData:
    IsUpdateDataValid_ThrowsForNullParameter:
    HashBlock_returnsCorrectHash:
    HashBlock_throwsNullParameter:
    Squash_returnsCorrectSquashedDataForMultipleDifferentTransactions:
    Squash_returnsCorrectSquashedDataForMultipleStackingTransactions:
    Squash_returnsCorrectSquashedDataForOverwritingTransactionsAffectingSameUser:
    Squash_throwsForInvalidData:
    Squash_throwsForNullParameters:
    TransactionsToUpdateDatas_validTransactionsReturnsValidUpdateDatas:
    TransactionsToUpdateDatas_throwsOnInvalidTransactions:
    TransactionsToUpdateDatas_throwsOnEmptyParameters:
    GenerationBlocksToUpdateDatas_validGenerationBlocksReturnsValidUpdateDatas:
    GenerationBlocksToUpdateDatas_throwsOnInvalidGenerationBlocks:
    GenerationBlocksToUpdateDatas_throwsOnEmptyParameters:
    ExtractValidationWorkFromTransactions_extractsAndAggregatesTransactionWork:
    ExtractValidationWorkFromTransactions_throwsOnInvalidTransactionWork:
    ExtractValidationWorkFromTransactions_throwsOnEmptyParameters:
    ExtractValidationWorkFromBlocks_extractsAndAggregatesValidationWork:
    ExtractValidationWorkFromBlocks_throwsOnInvalidValidationWork:
    ExtractValidationWorkFromBlocks_throwsOnEmptyParameters:
##############################################################*/

class BlockchainHelperUnitTests {
    assert(expression, failMessage) {
        if (!expression) {
            throw new Error(failMessage);
        }
    }
    require(expression) {
        if (!expression) {
            throw new Error("Failed requirement");
        }
    }

    GenerateMerkleTree_generatesProperTree() {
        let blockchainHelper = new BlockchainHelper();

    }

    GenerateMerkleTree_generatesProperTreeWithLotsOfTransactions() {
        let blockchainHelper = new BlockchainHelper();
        
    }

    GenerateMerkleTree_generatesLeaflessTreeWithZeroTransactions() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    GenerateMerkleTree_throwsForNullParameters() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    GenerateMerkleTree_throwsForEmptyParameters() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    IsProperBlock_returnsTrueForValidBlock() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    IsProperBlock_returnsFalseForBlocksWithBadUpdateData() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    IsProperBlock_returnsFalseForBlocksWithBadValidationWork() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    IsProperBlock_returnsFalseForBlocksWithNegativeGenerationNumber() {
        let blockchainHelper = new BlockchainHelper();
        
    }
    
    IsProperBlock_throwsForNullParameter() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.isBlockProper(null);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for null parameter");
    }
    
    IsValidationWorkProper_returnsTrueForProperValidationWork() {
        
    }
    
    IsValidationWorkProper_returnsFalseForBadValidationWork() {
        
    }
    
    IsValidationWorkProper_returnsFalseForNullParameters() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.isValidationWorkProper(null);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for null parameter");
    }
    
    IsUpdateDataValid_returnsTrueForProperUpdateData() {
        
    }
    
    IsUpdateDataValid_returnsFalseForBadUpdateData() {
        
    }
    
    IsUpdateDataValid_ThrowsForNullParameter() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.isUpdateDataValid(null);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for null parameter");
    }
    
    HashBlock_returnsCorrectHash() {
        
    }
    
    HashBlock_throwsNullParameter() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.hashBlock(null);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for null parameter");
    }
    
    Squash_returnsCorrectSquashedDataForMultipleDifferentTransactions() {
        
    }
    
    Squash_returnsCorrectSquashedDataForMultipleStackingTransactions() {
        
    }
    
    Squash_returnsCorrectSquashedDataForOverwritingTransactionsAffectingSameUser() {
        
    }
    
    Squash_throwsForInvalidData() {
        
    }
    
    Squash_throwsForNullParameters() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.squash(null);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for null parameter");
    }

    TransactionsToUpdateDatas_validTransactionsReturnsValidUpdateDatas() {
        
    }


    TransactionsToUpdateDatas_throwsOnInvalidTransactions() {
        
    }

    TransactionsToUpdateDatas_throwsOnEmptyParameters() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.transactionsToUpdateDatas([]);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for empty parameter");
    }

    GenerationBlocksToUpdateDatas_validGenerationBlocksReturnsValidUpdateDatas() {
        
    }

    GenerationBlocksToUpdateDatas_throwsOnInvalidGenerationBlocks() {
        
    }

    GenerationBlocksToUpdateDatas_throwsOnEmptyParameters() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.generationBlocksToUpdateDatas([]);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for empty parameter");
    }

    ExtractValidationWorkFromTransactions_extractsAndAggregatesTransactionWork() {
        
    }

    ExtractValidationWorkFromTransactions_throwsOnInvalidTransactionWork() {
        
    }

    ExtractValidationWorkFromTransactions_throwsOnEmptyParameters() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.extractValidationWorkFromTransactions([]);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for empty parameter");
    }

    ExtractValidationWorkFromBlocks_extractsAndAggregatesValidationWork() {

    }

    ExtractValidationWorkFromBlocks_throwsOnInvalidValidationWork() {

    }

    ExtractValidationWorkFromBlocks_throwsOnEmptyParameters() {
        let blockchainHelper = new BlockchainHelper();
        let success = false;
        try {
            blockchainHelper.extractValidationWorkFromBlocks([]);
        } catch (e) {
            success = true;
        }
        assert(success, "Should throw for empty parameter");
    }
}