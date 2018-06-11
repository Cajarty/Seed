
module.exports = {
    createBlock: function(generation, merkleRoot, updateData, validationWork) {
       return new Block(generation, merkleRoot, updateData, validationWork);
    }
 }

class Block {
    constructor(generation, merkleRoot, updateData, validationWork) {
        this.merkelRoot = merkleRoot;
        this.updateData = updateData;//{functionHash:result:caller:signature}
        this.work = validationWork; //{transactionABC:updateHash:signature,transactionDEF:signature}
        this.generation = generation;
    }
}


/*
Block:
    {
        "merkelRoot": "hash",
        "updateData": {
                "functionHash","hash",
                "result", ["update1", "update2"],
                "caller", "publicAddress",
                "signature", "sig"
        },
        "work" : {
            "transactionHash1" : "hash of updateData we agree with",
            "transactionHash2" : "hash of updateData we agree with"
        },
        "generation" : 0
    }
*/