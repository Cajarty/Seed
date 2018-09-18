/**
 * ******************
 * ***relayNode.js***
 * ******************
 * 
 * A relay node which acts as a pseudo-"server" any user can host. Relay nodes can have multiple clients connect
 * to them, relaying transactions between clients and other relay nodes.
 * 
 * 
 * 
 */
module.exports = {
    createRelayNode : function(otherRelayNodeIPs) {
        if (!otherRelayNodeIPs) {
            otherRelayNodeIPs = [];
        }
        return new RelayNode(otherRelayNodeIPs);
    }
}

const ioServer = require('socket.io');
const http = require('http');
const clientExporter = require('./client.js');
const blockchainExporter = require("../blockchain.js");
const entanglementExporter = require("../entanglement.js");
const transactionExporter = require("../transaction.js");
const svmExporter = require("../virtualMachine/virtualMachine.js");

class RelayNode {
    constructor(relayNodeIPs) {
        this.httpServer = undefined;
        this.socketServer = undefined;
        this.relayClients = [];
        for(let i = 0; i < relayNodeIPs.length; i++) {
            // Create a client for communicating with that other relay node
            let client = clientExporter.newClient();
            client.connect(relayNodeIPs[i]);
            this.relayClients.push(client);
        }
    }

    /**
     * Ask the firstly created client for blockchain/entanglement data to get caught up to speed
     */
    loadState() {
        if (this.relayClients.length > 0) {
            let client = this.relayClients[0];
            clientExporter.loadInitialState(client);
        }
    }

    /**
      * Begins listening for events
     */
    listen() {
        console.info("SERVER: StartServer");
        var server = http.createServer();
        var socket = ioServer(server);
        socket.set('transports', ['websocket']);
        socket.on('connection', (client) => {
            console.info("SERVER: Received connection");

            let onDisconnect = () => {
                console.info("SERVER: Received disconnect");
                client.removeListener('disconnect', onDisconnect);
                client.removeListener('requestBlockchainHeaders', onRequestBlockchainHeaders);
                client.removeListener('requestEntanglementHeaders', onRequestEntanglementHeaders);
                client.removeListener('requestBlocks', onRequestBlocks);
                client.removeListener('requestTransactions', onRequestTransactions);
                client.removeListener('sendTransaction', onSendTransaction);
            };
            client.on('disconnect', onDisconnect);

            let onRequestBlockchainHeaders = () => {
                console.info("SERVER: Received requestBlockchainHeaders");
                let headers = blockchainExporter.getBlockchainHeaders();
                console.info("SERVER: Sending responseBlockchainHeaders | ", headers );
                client.emit('responseBlockchainHeaders', headers);
            }
            client.on('requestBlockchainHeaders', onRequestBlockchainHeaders);
            
            let onRequestEntanglementHeaders = () => {
                console.info("SERVER: Received requestEntanglementHeaders | ");
                let headers = entanglementExporter.getEntanglementHeaders();
                console.info("SERVER: Sending responseEntanglementHeaders | ", headers );
                client.emit('responseEntanglementHeaders', headers);
            }
            client.on('requestEntanglementHeaders', onRequestEntanglementHeaders);

            let onRequestBlocks = (blockHeaders) => {
                console.info("SERVER: Received requestBlocks | ");
                // Fetch blockchain headers
                
                let blocks = blockchainExporter.getBlocks(blockHeaders);
                console.info("SERVER: Sending responseBlocks | ", blocks );
                client.emit('responseBlocks', JSON.stringify(blocks));
            }
            client.on('requestBlocks', onRequestBlocks);

            let onRequestTransactions = (txHeaders) => {
                console.info("SERVER: Received requestTransactions | ", txHeaders);
                // Fetch blockchain headers
                let transactions = entanglementExporter.getTransactions(txHeaders);
                console.info("SERVER: Sending responseTransactions | ", transactions );
                client.emit('responseTransactions', JSON.stringify(transactions));
            }
            client.on('requestTransactions', onRequestTransactions);

            let onSendTransaction = (transactionJSON) => {
                console.info("SERVER: Received sendTransaction | ", transactionJSON);

                let transactionParsed = JSON.parse(transactionJSON);
                let transaction = transactionExporter.createExistingTransaction(transactionParsed.sender, transactionParsed.execution, transactionParsed.validatedTransactions, transactionParsed.transactionHash, transactionParsed.signature, transactionParsed.timestamp);
                if (svmExporter.getVirtualMachine().incomingTransaction(transaction)) {
                    console.info("ADDING TO SVM: ", transaction);
                    // Relay transaction to every other connected client
                    console.info("SERVER: Sending notifyTransaction");
                    this.socketServer.emit('notifyTransaction', transactionJSON);

                    // Fetch blockchain headers
                    console.info("SERVER: Sending responseSendTransaction");
                    client.emit('responseSendTransaction');
                }
            }
            client.on('sendTransaction', onSendTransaction);
        });
        server.listen(3000);
        
        this.socketServer = socket;
        this.httpServer = server;
    }
}