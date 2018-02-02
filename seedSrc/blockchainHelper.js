/*##############################################################
ClassDesign: /seedSrc/blockchain_classDesignsAndTests.txt

BlockchainHelper:
    [Final design from text put here]
##############################################################*/

const transactionHelperExporter = require("./transaction.js");
const cryptoHelperExporter = require("./cryptoHelper.js");

module.exports = {
    generateTestamentBlock: function() {
       let blockchainHelper = new BlockchainHelper();
        

    },
    generateGenerationBlock: function() {
        //Returns new generation block
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

//Eliptic PublicKey Encryption, SHA256 Hashing and Base58 Encoding wrapper
class BlockchainHelper {
    //Generates a merkle tree out of the transactions passed in
    generateMerkleTree(transactions) {

    }
    
    //Validates that a block's validation work adds up, the updateData is valid and all is g
    isBlockProper(block) {

    }
        

    //Validates that a block's validation work adds up
    isValidationWorkProper(validationWork) {

    }
        
    //Validates that a block's uipdate data is valid
    isUpdateDataValid(updateData) {

    }
        
    //SHA 256 hashes the block and its data
    hashBlock(block) {

    }
    //Takes an array of updateDatas to squash
    squash(updateDatas) {

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

    }

    GenerateMerkleTree_generatesProperTreeWithLotsOfTransactions() {
        
    }

    GenerateMerkleTree_generatesLeaflessTreeWithZeroTransactions() {
        
    }
    
    GenerateMerkleTree_throwsForNullParameters() {
        
    }
    
    GenerateMerkleTree_throwsForEmptyParameters() {
        
    }
    
    IsProperBlock_returnsTrueForValidBlock() {
        
    }
    
    IsProperBlock_returnsFalseForBlocksWithBadUpdateData() {
        
    }
    
    IsProperBlock_returnsFalseForBlocksWithBadValidationWork() {
        
    }
    
    IsProperBlock_returnsFalseForBlocksWithNegativeGenerationNumber() {
        
    }
    
    IsProperBlock_throwsForNullParameter() {
        
    }
    
    IsValidationWorkProper_returnsTrueForProperValidationWork() {
        
    }
    
    IsValidationWorkProper_returnsFalseForBadValidationWork() {
        
    }
    
    IsValidationWorkProper_returnsFalseForNullParameters() {
        
    }
    
    IsUpdateDataValid_returnsTrueForProperUpdateData() {
        
    }
    
    IsUpdateDataValid_returnsFalseForBadUpdateData() {
        
    }
    
    IsUpdateDataValid_ThrowsForNullParameter() {
        
    }
    
    HashBlock_returnsCorrectHash() {
        
    }
    
    HashBlock_throwsNullParameter() {
        
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
        
    }
}