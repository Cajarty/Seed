
module.exports = {
    createTransaction: function() {
       return new Block();
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