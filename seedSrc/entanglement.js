// Will be where the DAG itself is.

//New transactions get added to this DAG

let entanglement = null;

module.exports = {
    getEntanglement : function() {
        if (entanglement == null) {
            entanglement = new Entanglement();
        }
        return entanglement;
    },
    tryAddGenesisTransaction : function(transaction) {

    },
    tryAddTransaction : function(transaction) {
        let children = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let child = transaction.validatedTransactions[i].transactionHash;
            children.push(child);
            if (!entanglement.contains(child)) {
                throw new Error("Trying to add transaction who's childs do not exist");
            }
        }
        entanglement.addTransaction(transaction);
        for(let i = 0; i < children.length; i++) {
            entanglement.addEdge(transaction.transactionHash, chidren[i]);
        }
    },
    doesTransactionCauseCycle : function(transaction) {
        let children = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let child = transaction.validatedTransactions[i].transactionHash;
            children.push();
            if (!entanglement.contains(child)) {
                throw new Error("Trying to check transaction who's childs do not exist");
            }
        }

        let from = this.addNode(fromName)
        try {
            for(let i = 0; i < children.length; i++) {
                let to = this.addNode(toName);
                if (to.incoming.hasOwnProperty(fromName)) {
                    return true;
                }
                this.checkForCycle(fromName, toName);
            }
        } catch (e) {
            console.log(e);
            return true;
        }
        return false;
    },
    getTipsToValidate : function(numberOfTips) {

    }
 }

let visit = function (vertex, func, visited, path) {
    let name = vertex.name;
    let vertices = vertex.incoming;
    let names = vertex.incomingNames;

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

 class Entanglement {
    constructor() {
        this.vertices = {};
        this.nodes = [];
        this.transactions = {};
    }

    contains(node) {
        return (this.vertices[node] && this.transactions[node]);
    }

    addTransaction(transaction) {
        this.transactions[transaction.transactionHash] = transaction;
        return this.addNode(transaction.transactionHash);
    }

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
            value: null
        };
        this.vertices[node] = vertex;
        this.nodes.push(node);
        return vertex;
    }

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
        to.incomingNames.push(fromName);
    }

    checkForCycle(fromName, toName) {
        let from = this.addNode(fromName)
        let checkCycle = function(vertex, path) {
            if (vertex.name === toName) {
                throw new Error("Theres a cycle foo!!!!!");
            }
        }
        visit(from, checkCycle);
    }
 }