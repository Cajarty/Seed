/**
 * ***************
 * ***client.js***
 * ***************
 * 
 * Client NodeJS code which allows for the creation of clients who connect to relay nodes
 * 
 */

 let client = undefined;

module.exports = {
    getClient : function() {
        if (!client) {
            client = new Client();
        }
        return client;
    },
    newClient : function() {
        return new Client();
    },
    connectAndLoadState : function(client, relayIP) {
        if (client) {
            loadInitialStateTasks(client);
            client.connect(relayIP);
        }
    },
    loadInitialState : function(client) {
        if (client) {
            loadInitialStateTasks(client);
            client.tryRunNextTask();
        }
    }
}

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
        console.info("For each block header, determiend we do not yet have stored: ", client.taskData["blockHeaders"]);
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
        console.info("For each transaction header, determiend we do not yet have stored: ", client.taskData["transactionHeaders"]);
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
        storage.getStorage().loadInitialState(blocks, transactions);
        client.tryRunNextTask();
        delete client.taskData["blocks"];
        delete client.taskData["blockHeaders"];
        delete client.taskData["transactions"];
        delete client.taskData["transactionHeaders"];
    });
}

const ioClient = require('socket.io-client');
const storage = require("../storage/storage.js");
const blockchainExporter = require("../blockchain.js");
const entanglementExporter = require("../entanglement.js");
const transactionExporter = require("../transaction.js");
const svmExporter = require("../virtualMachine/virtualMachine.js");

class Client {
    constructor() {
        this.socketClient = undefined;
        this.taskChain = [];
        this.taskData = {};
    }

    addTask(functionToExecute, argumentToPassIn) {
        let client = this;
        this.taskChain.push( () => {
            functionToExecute(argumentToPassIn);
        });
    }

    tryRunNextTask() {
        if (this.taskChain.length > 0) {
            // Grab the task, removing new task from list
            let currentTask = this.taskChain.splice(0, 1);
            // Make Socket Call
            console.info(currentTask);
            if (currentTask.length > 0) {
                currentTask[0]();
            }
        }
    }

    disconnect() {
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
        this.taskChain = [];
        this.taskData = {};
        delete this.socketClient;
    }

    connect(relayIP) {
        console.info("CLIENT: StartClient");
        let socket = ioClient(relayIP, {transports: ['websocket']});
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

        // Crypto stuff
        socket.on('responseBlockchainHeaders', (blockHeaders) => {
            console.info("CLIENT: Received responseBlockchainHeaders | ", blockHeaders);
            this.taskData["blockHeaders"] = blockHeaders;
            // Compare with stored blockchain headers
            // For all headers we do not recognize, request blocks
            this.tryRunNextTask();
        });
        socket.on('responseEntanglementHeaders', (transactionHeaders) => {
            console.info("CLIENT: Received responseEntanglementHeaders | ", transactionHeaders);
            this.taskData["transactionHeaders"] = transactionHeaders;
            // Compare with stored entanglement transaction headers
            // For all headers we do not recognize, request transactions
            this.tryRunNextTask();
        });
        socket.on('responseBlocks', (blocks) => {
            console.info("CLIENT: Received responseBlocks | ", blocks);
            this.taskData["blocks"] = blocks;
            // Try and add them to the blockchain, sorting by oldest to newest
            this.tryRunNextTask();
        });
        socket.on('responseTransactions', (transactions) => {
            console.info("CLIENT: Received responseTransactions | ", transactions);
            this.taskData["transactions"] = transactions;
            // Try and add them to the entanglement, sorting by newest to oldest
            this.tryRunNextTask();
        });
        socket.on('responseSendTransaction', (response) => {
            console.info("CLIENT: Received responseSendTransaction | ", response);
            // Confirm everything was fine, or resend to a different relay node if it failed(?)
            this.tryRunNextTask();
        });
        socket.on('notifyTransaction', (transactionJSON) => {
            console.info("CLIENT: Received notifyTransaction |", transactionJSON);
            let transactionParsed = JSON.parse(transactionJSON);
            let transaction = transactionExporter.createExistingTransaction(transactionParsed.sender, transactionParsed.execution, transactionParsed.validatedTransactions, transactionParsed.transactionHash, transactionParsed.signature, transactionParsed.timestamp);
            console.info("ADDING TO SVM: ", transaction.transactionHash);
            svmExporter.getVirtualMachine().incomingTransaction(transaction);
            // Add transaction to SVM
            this.tryRunNextTask();
        });

        this.socketClient = socket;
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