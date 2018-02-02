
module.exports = {
    createBlock: function(generation, merkleRoot, updateData, validationWork) {
       return new Block(generation, merkleRoot, updateData, validationWork);
    }
 }

class Block {
    constructor(generation, merkleRoot, updateData, validationWork) {
        this.merkelRoot = merkleRoot;
        this.updateData = updateData;
        this.work = validationWork;
        this.generation = generation;
    }
}