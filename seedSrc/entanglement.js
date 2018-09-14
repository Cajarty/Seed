/*******************
 * entanglement.js *
 *******************
 * 
 * This is the Directed Acyclic Graph (DAG) of Seed, known as the "Entanglement", which holds all temporary/short-term transactions in memory and aids in validation.
 * 
 * Exported Functions:
 *      getEntanglement()
 *          - Returns the current Entanglement, creating one if none exists
 *      tryAddTransaction(transaction)
 *          - Adds the incoming transaction to the entanglement
 *      doesTransactionCauseCycle(transaction)
 *          - Checks if adding this transaction would cause a cycle to occur, as DAG's are acyclic by nature
 *      getTipsToValidate(sender, numberOfTips)
 *          - Returns a list of transaction hashes for transactions that need to be validated. These are transactions with zero or few validations
 *      hasTransaction(transactionHash)
 *          - Returns whether or not the given transaction exists in the entanglement yet
 *      isValid(transactionHash)
 *          - Returns whether or not the given transaction is considered valid or not
 */

 // The current entanglement object
let entanglement = null;

module.exports = {
    /**
     * Returns the current Entanglement, creating one if none exists
     * 
     * @return - The current entanglement
     */
    getEntanglement : function() {
        if (entanglement == null) {
            entanglement = new Entanglement();
        }
        return entanglement;
    },
    /**
     * Adds the incoming transaction to the entanglement
     * 
     * @param transaction - The transaction to add
     */
    tryAddTransaction : function(transaction, saveToStorage) {
        if (saveToStorage == undefined) {
            saveToStorage = true;
        }
        if (!entanglement.contains(transaction.transactionHash)) {
            let children = [];
            for(let i = 0; i < transaction.validatedTransactions.length; i++) {
                let child = transaction.validatedTransactions[i].transactionHash;
                children.push(child);
                
                if (!entanglement.contains(child)) {
                    if (blockchainExporter.doesContainTransactions(child)) {
                        // It must exist in a previous block. If it does not exist in any 1st generaion block, consider it malformed
                    } else {
                        throw new Error("Trying to add transaction who's childs do not exist");
                    }
                }
            }
            entanglement.addTransaction(transaction);
            for(let i = 0; i < children.length; i++) {
                entanglement.addEdge(transaction.transactionHash, children[i]);
            }
            if (saveToStorage) {
                storageExporter.getStorage().saveTransaction(transaction);
            }
        }
    },
    /**
     * Checks if adding this transaction would cause a cycle to occur, as DAG's are acyclic by nature
     * 
     * @param transaction - The transaction to check whether it would cause a cycle if added
     */
    doesTransactionCauseCycle : function(transaction) {
        let children = [];
        if (entanglement.contains(transaction.transactionHash)) {
            throw new Error("Cannot check transaction that's already been added");
        }
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let child = transaction.validatedTransactions[i].transactionHash;
            children.push(child);
            if (!entanglement.contains(child)) {
                if (blockchainExporter.doesContainTransactions(child)) {
                    // It must exist in a previous block. If it does not exist in any 1st generaion block, consider it malformed
                } else {
                    console.info(transaction.transactionHash, "Failed To Find (1)", child);
                    throw new Error("Trying to check transaction who's childs do not exist");
                }
            }
        }
        let result = false;
        let from = entanglement.addNode(transaction.transactionHash)
        try {
            for(let i = 0; i < children.length; i++) {
                let hasNode = entanglement.vertices[children[i]] != undefined;
                let to = entanglement.addNode(children[i]);
                if (to.incoming.hasOwnProperty(transaction.transactionHash)) {
                    result = true;
                    break;
                }
                entanglement.checkForCycle(transaction.transactionHash, children[i]);
                if (!hasNode) {
                    entanglement.remove(children[i]);
                }
            }
        } catch (e) {
            console.log(e);
            result = true;
        }
        entanglement.remove(transaction.transactionHash);
        return result;
    },
    /**
     * Returns a list of transaction hashes for transactions that need to be validated. These are transactions with zero or few validations
     * The returned transactions will not belong to the sender
     * 
     * @param sender - The user making the request
     * @param numberOfTips - The amount of "tips" (unvalidated transactions) to fetch
     * 
     * @return - An array of hashes representing transactions in the DAG
     */
    getTipsToValidate : function(sender, numberOfTips) {
        let tips = Object.keys(entanglement.tips);
        let result = [];
        for(let i = 0; i < tips.length && result.length < numberOfTips; i++) {
            let transaction = entanglement.getTransaction(tips[i]);
            if (transaction == undefined) {
                console.info("Failed to find ", JSON.stringify(tips[i]), " in ", entanglement);
            }
            if (sender != transaction.sender && entanglement.tips[transaction.transactionHash] > 0) {
                result.push(transaction);
            }
        }

        return result;
    },
    /**
     * Returns whether or not the current state of the Entanglement has the given transaction in it
     * 
     * @param transactionHash - The transaction to check in the DAG if its there or not yet
     * 
     * @return - True or false for whether transactionHash already exists
     */
    hasTransaction : function(transactionHash) {
        if (entanglement.transactions[transactionHash]) {
            return true;
        } else {
            return false;
        }
    },
    /**
     * Returns whether the given transactionHash is in the entanglement and if it is, is it valid
     * 
     * @param transactionHash - The transaction to check in the DAG if its valid or not yet
     * 
     * @return - True or false for whether its valid
     */
    isValid : function(transactionHash) {
        // Has to be contained already, wellformed and the sum of its trust coefficient == 1
        //console.info("IsValid", entanglement.vertices[transactionHash]);
        if (entanglement.contains(transactionHash) && entanglement.transactions[transactionHash].trust == 1 && entanglement.transaction[transactionHash].validationLevel >= VALIDATION_LEVEL.VALID) {
            return true;
        }
        return false;
    },
    getUnitTests : function() {
        return entanglementUnitTests;
    },
    clearAll : function() {
        entanglement = new Entanglement();
    }
 }

 const svmExporter = require("./virtualMachine/virtualMachine.js");
 const transactionExporter = require("./transaction.js");
 const squasherExporter = require("./squasher.js");
 const blockchainExporter = require("./blockchain.js");
 const storageExporter = require("./storage/storage.js");
 const unitTestingExporter = require("./tests/unitTesting.js");

 /**
  *  Helper function used recursively by the Entanglement with regards to visiting nodes when traversing the DAG
  *
  * @param {*} vertex - The vertex structure relating to a transaction in the DAG
  * @param {*} func - The function to execute once visiting the node
  * @param {*} visited - The mapping of nodes regarding whether they're visited or not
  * @param {*} path - The current path iterated through when visiting
  */
let visit = function (vertex, func, visited, path) {
    let name = vertex.name;
    let vertices = vertex.incoming;
    let names = vertex.incomingNodes;
    if (!visited) {
        visited = {};
    }
    if (!path) {
        path = [];
    }
    if (visited.hasOwnProperty(name)) {
        return;
    }

    path.push(name);
    visited[name] = true;

    for (let i = 0; i < names.length; i++) {
        visit(vertices[names[i]], func, visited, path);
    }
    func(vertex, path);
    path.pop();
}

/**
 * Helper function used when checking whether the entanglement now trusts a transaction or not
 * 
 * @param {*} transactionHash - The hash of the transaction to check
 * @param {*} entanglement  - The entanglement we're asking the trust of
 */
let tryTrust = function(transactionHash, entanglement) {
    if (entanglement.vertices[transactionHash].trust == 1) {
        //console.info("ENTANGLEMENT now TRUSTS " + transactionHash);
        let toTransaction = entanglement.transactions[transactionHash];
        svmExporter.getVirtualMachine().invoke(
            { 
                module : toTransaction.execution.moduleName, 
                function : toTransaction.execution.functionName, 
                user : toTransaction.sender, 
                args : toTransaction.execution.args,
                txHashes : toTransaction.txHashes
            }, toTransaction.execution.changeSet);
            entanglement.tips[transactionHash] = undefined;
        if (squasherExporter.doesTriggerSquashing(transactionHash)) {
            let validatedParents = getAllValidatedParents(toTransaction, entanglement);
            let block = squasherExporter.transactionsToBlock(validatedParents);
            blockchainExporter.addTestamentBlock(block);
            removeAllTransactionsFromEntanglement(validatedParents, block.blockHash, entanglement);
        }
    } else {
        //console.info("ENTANGLEMENT failed to TRUST ", transactionHash, entanglement.vertices[transactionHash].trust);
    }
}

/**
 * Takes a transaction from the DAG and recursively finds all validated transactions it indirectly help validate.
 * 
 * e.g. if 
 *      A validates B/C
 *      B validates D/E
 *      D validates E/F
 *      F validates G/H
 * 
 * and "B" was the transaction being passed in initially, it would return [B,D,E,F,G,H]
 * 
 * @param {*} transaction - The transaction who's parents we are finding
 * @param {*} entanglement - The entanglement to find transactions from
 */
let getAllValidatedParents = function(transaction, entanglement) {
    let validated = [];
    if (transaction.validatedTransactions.length > 0) {
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let validatedTransaction = entanglement.getTransaction(transaction.validatedTransactions[i].transactionHash);
            if (validatedTransaction) {
                if (typeof validatedTransaction == "string") {
                    // Its a block hash, we've hit the end. No parents to add
                } else {
                    let validatedParents = getAllValidatedParents(validatedTransaction, entanglement);
                    validated = validatedParents;
                }
            } else {
                // Parent was removed from a previous block creation already
                console.info("Parent was removed from previous block creation");
            }
        }
    } else {
        // Genesis transaction case. No parents to add
    }
    validated.push(transaction);
    return validated;
}

/**
 * Removes each transaction from the array of transactions from the entanglement.
 * 
 * @param {*} transactions - Transactions to remove from entanglement
 * @param {*} blockHash - Blockhash to replace them with if searched for (unused for now. May remain unused, being debated)
 * @param {*} entanglement - Entanglement to remove the transactions from
 */
let removeAllTransactionsFromEntanglement = function(transactions, blockHash, entanglement) {
    for(let i = 0; i < transactions.length; i++) {
        entanglement.remove(transactions[i].transactionHash);
    }
}

/**
 * Validation levels a transaction can achieve
 */
const VALIDATION_LEVEL = {
    WELL_FORMED : 0,    // WELL_FORMED means the transaction follows rules #1, #2, #3, #4
    PROPER : 1,         // PROPER means it also follows rules #5, #6, #7, #8, #9, #11
    VALID : 2,          // VALID means it also follows rule #10
    TRUSTED : 3         // TRUSTED means it also has adequate trust from transactions validating it
}

/**
 * The Entanglement class, which is the DAG of the Seed system
 */
 class Entanglement {
     /**
      * The constructor used to initialize the variables of
      */
    constructor() {
        this.vertices = {}; // Current mapping of vertexes stored: mapping (transactionHash => transactionVertexStruct)
        this.nodes = []; // Array of nodes/transactionHashs stored
        this.transactions = {}; // Mapping of transations stored: mapping (transactionHash => transactionVertexStruct)
        this.tips = {}; // Mapping of tips: mapping (transactionHash => tips)
        this.tipThreshold = 2; // Minimum amount of tips we use when checking for transactions that need more tips
    }

    /**
     * @param {*} node - Whether or not the given node exists in the Entanglement
     */
    contains(node) {
        return (this.vertices[node] && this.transactions[node]);
    }

    /**
     * @param {*} node - Node to remove from the Entanglement
     */
    remove(node) {
        delete this.vertices[node]
        delete this.tips[node];
        delete this.transactions[node];
        for(let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] == node) {
                this.nodes.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Returns the given transaction from the entanglement
     * 
     * @param {*} transactionHash - The transaction hash mapped to the transaction in the entanglement
     */
    getTransaction(transactionHash) {
        return this.transactions[transactionHash];
    }

    /**
     * Adds the given transaction to the entanglement, and increases trust to transactions they depend on.
     * Internally turns transaction into a node and invokes addNode to add it to the DAG
     * 
     * @param {*} transaction  - The transaction to add to the entanglement
     */
    addTransaction(transaction) {
        if (transactionExporter.isTransactionProper(transaction)) {
            this.transactions[transaction.transactionHash] = transaction;
            let result = this.addNode(transaction.transactionHash);
            let transactionsToTrust = transaction.validatedTransactions;
            this.trustTransactions(transactionsToTrust);
        }
    }

    /**
     * Adds the given node to the entanglement's DAG
     * 
     * @param {*} node - The node/transactionHash to add to the DAG
     */
    addNode(node) {
        if (!node) {
            return;
        }

        // If we already have a vertex for the transaction, return it
        if (this.vertices[node]) {
            return this.vertices[node];
        }

        const vertex = {
            node: node, 
            incoming: {}, 
            incomingNodes: [], 
            hasOutgoing: false, 
            value: null,
            trust: 0,
            validationLevel : VALIDATION_LEVEL.PROPER
        };
        this.vertices[node] = vertex;
        this.nodes.push(node);
        this.tips[node] = this.tipThreshold;
        return vertex;
    }

    /**
     * Adds an edge between two nodes in the DAG
     * 
     * @param {*} fromName - The node the edge starts at
     * @param {*} toName - The node the edge ends at
     */
    addEdge(fromName, toName) {
        if (!fromName || !toName || fromName === toName) {
            return;
        }
        let from = this.addNode(fromName)
        let to = this.addNode(toName);
        if (to.incoming.hasOwnProperty(fromName)) {
            return;
        }
        this.checkForCycle(fromName, toName);
        from.hasOutgoing = true;
        to.incoming[fromName] = from;
        to.incomingNodes.push(fromName);
        tryTrust(toName, this);
    }

    /**
     * Checks if adding the "from" node will cause a cycle when traversing to "to" node
     * 
     * @param {*} fromName - The node to start the check from
     * @param {*} toName  - The node to finish the check from
     */
    checkForCycle(fromName, toName) {
        let from = this.addNode(fromName)
        let checkCycle = function(vertex, path) {
            if (vertex.node === toName) {
                throw new Error("Theres a cycle foo!!!!!");
            }
        }
        visit(from, checkCycle);
    }

    /**
     * Takes an array of transactions that are now trusted in the DAG, and increase the trust of them
     * 
     * @param {*} transactionsToTrust - Array of transactions to trust
     */
    trustTransactions(transactionsToTrust) {
        for(let i = 0; i < transactionsToTrust.length; i++) {
            let hashToTrust = transactionsToTrust[i].transactionHash;
            if (this.contains(hashToTrust) && this.vertices[hashToTrust].trust < 1) {
                this.increaseTrust(hashToTrust);
            }
        }
    }

    /**
     * Increases the trust of a given transaction, and then invokes trustTransactions on its validatedTransactions
     * 
     * @param {*} transactionHash - The hash of the transaction to increase in trust
     */
    increaseTrust(transactionHash) {
        if (this.vertices[transactionHash].trust < 1) {
            this.vertices[transactionHash].trust += 0.5;
            if (this.vertices[transactionHash].trust >= 1) {
                this.vertices[transactionHash].trust = 1;
                this.vertices[transactionHash].validationLevel = VALIDATION_LEVEL.TRUSTED;
            }
    
            let transactionsToTrust = this.transactions[transactionHash].validatedTransactions;
            this.trustTransactions(transactionsToTrust);
        }
    }
 }

 const entanglementUnitTests = {
    /**
     * Confirms transactions can be added to the entanglement
     */
    entanglement_addsValidTransactionsToEntanglement : function(test, log) {
        let testTransaction = unitTestingExporter.getSeedConstructorTransaction();
        let newTransaction = transactionExporter.createExistingTransaction(testTransaction.sender, testTransaction.execution, testTransaction.validatedTransactions, testTransaction.transactionHash, testTransaction.signature, testTransaction.timestamp )
        module.exports.tryAddTransaction(newTransaction, false);
        test.assert(entanglement.contains(newTransaction.transactionHash), "Entanglement should have stored the valid transaction");
    },
    /**
     * Confirms adding transactions fails if the transaction is invalid
     */
    entanglement_doesNotAddInvalidTransactions : function(test, log) {
        let testTransaction = unitTestingExporter.getTestTransactions()[0];
        let invalidTransaction = transactionExporter.createExistingTransaction(testTransaction.sender, testTransaction.execution, testTransaction.validatedTransactions, testTransaction.transactionHash, testTransaction.signature, testTransaction.timestamp )
        test.assertFail(() => {
            module.exports.tryAddTransaction(invalidTransaction, false);
        }, "Entanglement should have thrown an error on this transaction for referring to transactions which don't exist"); 
    },

    /**
     * Confirms adding transactions validates older ones
     */
    entanglement_addingTransactionsValidatesOthers : function(test, log) {
        let entanglement = module.exports.getEntanglement();
        // Must simulate a "ABC" validates "DEF" scenario
        entanglement.addNode("ABC");
        entanglement.addNode("DEF");
        entanglement.addEdge("ABC", "DEF");
        entanglement.transactions["ABC"] = { validatedTransactions : [ { transactionHash : "DEF" } ] };
        entanglement.transactions["DEF"] = { validatedTransactions : [] };

        // Values should start with no trust
        test.assertAreEqual(entanglement.vertices["ABC"].trust, 0, "Should start with zero trust");
        test.assertAreEqual(entanglement.vertices["DEF"].trust, 0, "Should start with zero trust");

        // Increase the trust of ABC
        entanglement.increaseTrust("ABC");

        // DEF's trust should have increased as well
        test.assert(entanglement.vertices["DEF"].trust > 0, "DEF's trust should have increased by trusting ABC");
    },
    /**
     * Confirms adding transactions fails if the transaction would cause a cycle in the directed acyclic graph
     */
    entanglement_doesNotAddTransactionsIfCausesCycle : function(test, log) {
        let entanglement = module.exports.getEntanglement();
        entanglement.addNode("ABC"); // Add ABC
        entanglement.addNode("DEF"); // Add DEF
        entanglement.addEdge("ABC", "DEF"); // ABC -> DEF
        entanglement.addNode("GHI"); // Add GHI
        entanglement.addEdge("DEF", "GHI"); // DEF -> GHI
        entanglement.addEdge("GHI", "ABC"); // DEF -> GHI
        test.assertFail(() => {
            let result = entanglement.checkForCycle("GHI", "GHI");
        }, "The added nodes should have cauled a cycle when checked");
        entanglement.remove("ABC");
        entanglement.remove("DEF");
        entanglement.remove("GHI");
    }
}