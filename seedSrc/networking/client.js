/**
 * ***************
 * ***client.js***
 * ***************
 * 
 * Client NodeJS code which allows for the creation of clients who connect to relay nodes.
 * Clients use the socket.io module to communicate over websockets with the relay nodes.
 * 
 * Export functions exist for loading the Seed ecosystem state, which will begin an
 * ongoing communication with a relay node requesting all missing blocks & transactions.
 * 
 */

module.exports = {
    /**
     * Fetches the global Client connection, creating one if one does not exist.
     */
    getClient : function() {
        if (!client) {
            client = new Client();
        }
        return client;
    },
    /**
     * Returns a freshly created Client without caching.
     */
    newClient : function() {
        return new Client();
    },
    /**
     * Connects a client to a Relay Node's IP address, and then loads
     * the Client with a list of tasks which defined how the Client
     * will request the initial blocks and transactions required for rebuilding
     * state.
     * 
     * @param {*} client - The instantiated Client to connect and load state with.
     * @param {*} relayIP - The IP address (with port) of the Relay Node to connect to. (e.g. "127.0.0.1:3000")
     */
    connectAndLoadState : function(client, relayIP) {
        if (client) {
            loadInitialStateTasks(client);
            client.connect(relayIP);
        }
    },
    /**
     * Loads the Client with a list of tasks which defined how the Client
     * will request the initial blocks and transactions required for rebuilding
     * state.
     * 
     * @param {*} client - The instantiated Client to connect and load state with.
     */
    loadInitialState : function(client) {
        if (client) {
            loadInitialStateTasks(client);
            client.tryRunNextTask();
        }
    }
}

/**
 * Loads the Client with a list of tasks which defined how the Client
 * will request the initial blocks and transactions required for rebuilding
 * state.
 * 
 * @param {*} client - The instantiated Client to connect and load state with.
 */
let loadInitialStateTasks = function(client) {
    // Request "Blochchain Headers"
    client.addTask(() => {
        client.requestBlockchainHeaders();
    });
    // Handle determining which blocks to request
    client.addTask(() => {
        let blockHeaders = client.taskData["blockHeaders"];
        if (blockHeaders) {
            let unknownHeaders = [];
            for(let i = 0; i < blockHeaders.length; i++) {
                let blockHeader = blockHeaders[i];
                // Check if we know of this block header
                if (blockHeader.length >= 2 && !blockchainExporter.doesContainBlock(blockHeader[0], blockHeader[1])) {
                    unknownHeaders.push(blockHeader);
                }
            }
            client.taskData["blockHeaders"] = unknownHeaders;
        }
        // for each block header, determine if we have it stored
        client.tryRunNextTask();
    });
    // Request Blocks
    client.addTask(() => {
        client.requestBlocks();
    });
    // Request "Entanglement Headers"
    client.addTask(() => {
        client.requestEntanglementHeaders();
    });
    // Handle determining which transactions to request
    client.addTask(() => {
        let transactionHeaders = client.taskData["transactionHeaders"];
        if (transactionHeaders) {
            let unknownHeaders = [];
            for(let i = 0; i < transactionHeaders.length; i++) {
                let transactionHeader = transactionHeaders[i];
                // Check if we know of this block header
                if (!entanglementExporter.hasTransaction(transactionHeader) && !blockchainExporter.doesContainTransactions(transactionHeader)) {
                    unknownHeaders.push(transactionHeader);
                }
            }
            client.taskData["transactionHeaders"] = unknownHeaders;
        }
        // for each block header, determine if we have it stored
        client.tryRunNextTask();
    });
    // Request transactions
    client.addTask(() => {
        client.requestTransactions();
    });
    // Load transactions and blocks into entanglement
    client.addTask(() => {
        let blocks = JSON.parse(client.taskData["blocks"]);
        let transactions = JSON.parse(client.taskData["transactions"]);
        let storage = storageExporter.getStorage();
        if (!storage) {
            storage = storageExporter.newStorage({});
        }
        storageExporter.loadInitialState(blocks, transactions);
        client.tryRunNextTask();
        delete client.taskData["blocks"];
        delete client.taskData["blockHeaders"];
        delete client.taskData["transactions"];
        delete client.taskData["transactionHeaders"];
    });
}

const ioClient = require('socket.io-client');
const storageExporter = require("../storage/storage.js");
const blockchainExporter = require("../blockchain.js");
const entanglementExporter = require("../entanglement.js");
const transactionExporter = require("../transaction.js");
const svmExporter = require("../virtualMachine/virtualMachine.js");

let client = undefined;

/**
 * The Client class which outlines the available functionality of a client.
 * 
 * Can connect/disconnect from relay nodes, request data from relay nodes,
 * send transactions to other users through relay nodes, and handle responses
 * from the connect relay node.
 */
class Client {
    /**
     * Constructs the client, defaulting data for the taskChain (which acts as a to-do list)
     * and the taskData (which acts as storage for tasks)
     */
    constructor() {
        this.socketClient = undefined;
        this.taskChain = [];
        this.taskData = {};
    }

    /**
     * Adds a task to the task-chain, allowing arguments to be pasesd in to callbacks for each task.
     * 
     * @param {*} functionToExecute - The callback to invoke for this task
     * @param {*} argumentToPassIn - The parameters, if any, to pass in
     */
    addTask(functionToExecute, argumentToPassIn) {
        let client = this;
        this.taskChain.push( () => {
            functionToExecute(argumentToPassIn);
        });
    }

    /**
     * If any task is in the taskChain, remove it from the list and execute it.
     */
    tryRunNextTask() {
        if (this.taskChain.length > 0) {
            // Grab the task, removing new task from list
            let currentTask = this.taskChain.splice(0, 1);
            // Make Socket Call
            if (currentTask.length > 0) {
                currentTask[0]();
            }
        }
    }

    /**
     * Disconnects the socket connection, cleaning up all listeners,
     * and resets the taskChain and taskData values
     */
    disconnect() {
        if (this.socketClient) { 
            this.socketClient.off('forceClose');
            this.socketClient.off('connect');
            this.socketClient.off('disconnect');
            this.socketClient.off('connect_error');
            this.socketClient.off('reconnect_error');
            this.socketClient.off('responseBlockchainHeaders');
            this.socketClient.off('responseEntanglementHeaders');
            this.socketClient.off('responseBlocks');
            this.socketClient.off('responseTransactions');
            this.socketClient.off('responseSendTransaction');
            this.socketClient.off('notifyTransaction');
            delete this.socketClient;
        }
        this.taskChain = [];
        this.taskData = {};
    }

    /**
     * Creates a socket.io client connection via websockets to the passed in Relay Node IP address.
     * After creating the socket, begin listening for various events such as connect, notifying of a new transaction,
     * and other events.
     * 
     * @param {*} relayIP - The IP address (with port) of the Relay Node to connect to. (e.g. "127.0.0.1:3000")
     */
    connect(relayIP) {
        console.info("CLIENT: StartClient");
        let socket = ioClient(relayIP, {transports: ['websocket']});
        // If the connection was established and the client created
        if (socket) {
            socket.on('forceClose', () => {
                socket.close();
            });
            socket.on('connect', (evt) => {
                console.info("CLIENT: Received connect");
                this.tryRunNextTask();
            });
            socket.on('disconnect', (evt) => {
                console.info("CLIENT: Received disconnect | ", evt);
                this.disconnect();
            });
            let onError = (message) => {
                console.info("CLIENT: Received error | ", message);
            }
            socket.on('connect_error', onError );
            socket.on('reconnect_error', onError );
    
            socket.on('responseBlockchainHeaders', (blockHeaders) => {
                console.info("CLIENT: Received responseBlockchainHeaders | ", blockHeaders);
                this.taskData["blockHeaders"] = blockHeaders;
                this.tryRunNextTask();
            });
            socket.on('responseEntanglementHeaders', (transactionHeaders) => {
                console.info("CLIENT: Received responseEntanglementHeaders | ", transactionHeaders);
                this.taskData["transactionHeaders"] = transactionHeaders;
                this.tryRunNextTask();
            });
            socket.on('responseBlocks', (blocks) => {
                console.info("CLIENT: Received responseBlocks");
                this.taskData["blocks"] = blocks;
                this.tryRunNextTask();
            });
            socket.on('responseTransactions', (transactions) => {
                console.info("CLIENT: Received responseTransactions");
                this.taskData["transactions"] = transactions;
                this.tryRunNextTask();
            });
            socket.on('responseSendTransaction', () => {
                console.info("CLIENT: Received responseSendTransaction");
                this.tryRunNextTask();
            });
            socket.on('notifyTransaction', (transactionJSON) => {
                let transactionParsed = JSON.parse(transactionJSON);
                console.info("CLIENT: Received notifyTransaction |", transactionParsed.transactionHash);
                let transaction = transactionExporter.createExistingTransaction(transactionParsed.sender, transactionParsed.execution, transactionParsed.validatedTransactions, transactionParsed.transactionHash, transactionParsed.signature, transactionParsed.timestamp);
                console.info("ADDING TO SVM: ", transaction.transactionHash);
                svmExporter.getVirtualMachine().incomingTransaction(transaction);
                this.tryRunNextTask();
            });
    
            this.socketClient = socket;
        } else {
            console.info("ERROR: Failed to create a socket connection to Relay Node ", relayIP);
        }
        
    }

    /**
     * Requests block header data from the connected relay node.
     */
    requestBlockchainHeaders() {
        if (this.socketClient) {
            console.info("CLIENT: Sending requestBlockchainHeaders");
            this.socketClient.emit("requestBlockchainHeaders");
        }
    }

    /**
     * Requests entanglement header data from the connected relay node.
     */
    requestEntanglementHeaders() {
        if (this.socketClient) {
            console.info("CLIENT: Sending requestEntanglementHeaders");
            this.socketClient.emit("requestEntanglementHeaders");
        }
    }

    /**
     * Requests specified block data from the connect relay node.
     * 
     * @param {*} blockInfos - An array of block information for the block to load. e.g. [[BlockHash, Generation],[BlockHash, Generation]]...
     */
    requestBlocks(blockInfos) {
        if (!blockInfos) {
            blockInfos = this.taskData["blockHeaders"];
        }
        if (this.socketClient) {
            console.info("CLIENT: Sending requestBlocks");
            this.socketClient.emit("requestBlocks", blockInfos);
        }
    }

    /**
     * Requests the spcified transactions data from the connected relay node.
     * 
     * @param {*} transactionInfos - An array of transaction hashes regarding which transactions to request
     */
    requestTransactions(transactionInfos) {
        if (!transactionInfos) {
            transactionInfos = this.taskData["transactionHeaders"];
        }
        if (this.socketClient) {
            console.info("CLIENT: Sending requestTransactions");
            this.socketClient.emit("requestTransactions", transactionInfos);
        }
    }

    /**
     * Propagates a transaction to the connected Relay node.
     * 
     * @param {*} transaction - The transaction to send
     */
    sendTransaction(transaction) {
        if (!transaction) {
            transaction = this.taskData["transaction"];
        }
        if (this.socketClient) {
            console.info("CLIENT: Sending sendTransaction");
            this.socketClient.emit("sendTransaction", transaction);
        }
    }
}