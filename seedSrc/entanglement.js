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
            entanglement.addEdge(transaction.transactionHash, children[i]);
        }
    },
    doesTransactionCauseCycle : function(transaction) {
        let children = [];
        if (entanglement.contains(transaction.transactionHash)) {
            throw new Error("Cannot check transaction that's already been added");
        }
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let child = transaction.validatedTransactions[i].transactionHash;
            children.push(child);
            if (!entanglement.contains(child)) {
                throw new Error("Trying to check transaction who's childs do not exist");
            }
        }
        let result = false;
        let from = entanglement.addNode(transaction.transactionHash)
        try {
            for(let i = 0; i < children.length; i++) {
                let to = entanglement.addNode(children[i]);
                if (to.incoming.hasOwnProperty(transaction.transactionHash)) {
                    result = true;
                    break;
                }
                entanglement.checkForCycle(transaction.transactionHash, children[i]);
            }
        } catch (e) {
            console.log(e);
            result = true;
        }
        entanglement.remove(from);
        return result;
    },
    getTipsToValidate : function(sender, numberOfTips) {
        let tips = Object.keys(entanglement.tips);
        let result = [];
        console.info("getTips", sender, numberOfTips, entanglement.tips, tips);
        for(let i = 0; i < tips.length && result.length < numberOfTips; i++) {
            let transaction = entanglement.getTransaction(tips[i]);
            if (transaction == undefined) {
                console.info("Failed to find ", JSON.stringify(tips[i]), " in ", entanglement);
            }
            if (sender != transaction.sender) {
                result.push(transaction);
            }
        }
        return result;
    },
    hasTransaction : function(transactionHash) {
        if (entanglement.transactions[transactionHash]) {
            return true;
        } else {
            console.info("hasTransaction", entanglement.transactions, transactionHash);
            return false;
        }
    },
    isValid : function(transactionHash) {
        if (entanglement.contains(transactionHash)) {
            if (!entanglement.tips[transactionHash]) {
                return true;
            }
        }
        return false;
    }
 }

let visit = function (vertex, func, visited, path) {
    let name = vertex.name;
    let vertices = vertex.incoming;
    let names = vertex.incomingNodes;
    console.info("visit", vertex, names);
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
        this.tips = {};
        this.tipThreshold = 2;
    }

    contains(node) {
        return (this.vertices[node] && this.transactions[node]);
    }

    remove(node) {
        delete this.vertices[node]
        delete this.tips[node];
        for(let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] == node) {
                this.nodes.splice(i, 1);
                break;
            }
        }
    }

    getTransaction(transactionHash) {
        return this.transactions[transactionHash];
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
        this.tips[node] = this.tipThreshold;
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
        to.incomingNodes.push(fromName);
        if (this.tips[toName] != undefined && this.tips[toName] > 0) {
            this.tips[toName]--;
            if (this.tips[toName] == 0) {
                console.info("ENTANGLEMENT now TRUSTS " + toName);
                this.tips[toName] = undefined;
            }
        }
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