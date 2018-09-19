/**
 * ******************
 * ***relayNode.js***
 * ******************
 * 
 * A relay node which acts as a pseudo-"server" any user can host. Relay nodes can have multiple clients connect
 * to them, relaying transactions between clients and other relay nodes.
 * 
 * Exports a function regarding create a relay node.
 */
module.exports = {
    /**
     * Fetches the RelayNode instance, creating one if none exists.
     * 
     * If the RelayNode should have its connections changed to new RelayNodes, or initiall set,
     * pass in the optional argument for relay nodes to connect to.
     * 
     * WARNING: Passing in new RelayNodes to connect to will disconnect all previous Clients. Only pass
     * in the argument on initial setup, or when we want to change connections.
     * 
     * @param {*} otherRelayNodeIPs - (Optional) Other RelayNodes our RelayNode should be connected to
     */
    getRelayNode : function(otherRelayNodeIPs) {
        if (!relayNode) {
            relayNode = new RelayNode();
        } 
        if (otherRelayNodeIPs) {
            relayNode.disconnectClients();
            relayNode.connectClients(otherRelayNodeIPs);
        }
        return relayNode;
    }
}

const ioServer = require('socket.io');
const http = require('http');
const clientExporter = require('./client.js');
const blockchainExporter = require("../blockchain.js");
const entanglementExporter = require("../entanglement.js");
const transactionExporter = require("../transaction.js");
const svmExporter = require("../virtualMachine/virtualMachine.js");

let relayNode = undefined;

/**
 * The RelayNode class which outlines the available functionality of a RelayNode.
 * 
 * Can listen for client connections, respond to client messages, connect to other
 * RelayNodes, and load initial entanglement & blockchain state by requesting it from
 * the other connected relay nodes.
 */
class RelayNode {
    /**
     * Constructs the RelayNode's data, defaulting to an empty array of RelayClients.
     */
    constructor() {
        this.httpServer = undefined;
        this.socketServer = undefined;
        this.relayClients = [];
    }

    /**
     * Creates and connects a client for each RelayNode IP passed in
     * 
     * @param {*} relayNodeIPs - The IPs, with ports, of each relay node to connect to
     */
    connectClients(relayNodeIPs) {
        for(let i = 0; i < relayNodeIPs.length; i++) {
            // Create a client for communicating with that other relay node
            let client = clientExporter.newClient();
            client.connect(relayNodeIPs[i]);
            this.relayClients.push(client);
        }
    }

    /**
     * Disconnects all connected clients and clears the relayClients list
     */
    disconnectClients() {
        for(let i = 0; i < this.relayClients.length; i++) {
            // Create a client for communicating with that other relay node
            let client = this.relayClients[i];
            client.disconnect();
            delete client;
        }
        this.relayClients = [];
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
    listen(port) {
        console.info("RELAY NODE: StartServer");
        var server = http.createServer();
        // If we can successfully create a http server
        if (server) {
            var socket = ioServer(server);
            // If we can successfully create a socket.io server via the http server
            if (socket) {
                // Set the transport method to "websockets" to avoid having clients rely on http polling (sorry <IE9)
                socket.set('transports', ['websocket']);
                // On receiving a connection, create listeners for the clients messages.
                socket.on('connection', (client) => {
                    console.info("RELAY NODE: Received connection");
        
                    // On receiving a 'disconnect' event, a client disconnected, so clean up all listeners
                    let onDisconnect = () => {
                        console.info("RELAY NODE: Received disconnect");
                        client.removeListener('disconnect', onDisconnect);
                        client.removeListener('requestBlockchainHeaders', onRequestBlockchainHeaders);
                        client.removeListener('requestEntanglementHeaders', onRequestEntanglementHeaders);
                        client.removeListener('requestBlocks', onRequestBlocks);
                        client.removeListener('requestTransactions', onRequestTransactions);
                        client.removeListener('sendTransaction', onSendTransaction);
                    };
                    client.on('disconnect', onDisconnect);
        
                    // On receiving a 'requestBlockchainHeaders' event, reply with all block headers
                    let onRequestBlockchainHeaders = () => {
                        console.info("RELAY NODE: Received requestBlockchainHeaders");
                        let headers = blockchainExporter.getBlockchainHeaders();
                        console.info("RELAY NODE: Sending responseBlockchainHeaders | ", headers );
                        client.emit('responseBlockchainHeaders', headers);
                    }
                    client.on('requestBlockchainHeaders', onRequestBlockchainHeaders);
                    
                    // On receiving a 'requestEntanglementHeaders' event, reply with all transaction headers
                    let onRequestEntanglementHeaders = () => {
                        console.info("RELAY NODE: Received requestEntanglementHeaders | ");
                        let headers = entanglementExporter.getEntanglementHeaders();
                        console.info("RELAY NODE: Sending responseEntanglementHeaders | ", headers );
                        client.emit('responseEntanglementHeaders', headers);
                    }
                    client.on('requestEntanglementHeaders', onRequestEntanglementHeaders);
        
                    // On receiving a 'requestBlocks' event, reply with all requested blocks
                    let onRequestBlocks = (blockHeaders) => {
                        console.info("RELAY NODE: Received requestBlocks");
                        let blocks = blockchainExporter.getBlocks(blockHeaders);
                        console.info("RELAY NODE: Sending responseBlocks | ", blocks );
                        client.emit('responseBlocks', JSON.stringify(blocks));
                    }
                    client.on('requestBlocks', onRequestBlocks);
        
                    // On receiving a 'requestTransactions' event, reply with all requested transactions
                    let onRequestTransactions = (txHeaders) => {
                        console.info("RELAY NODE: Received requestTransactions | ", txHeaders);
                        let transactions = entanglementExporter.getTransactions(txHeaders);
                        console.info("RELAY NODE: Sending responseTransactions | ", transactions );
                        client.emit('responseTransactions', JSON.stringify(transactions));
                    }
                    client.on('requestTransactions', onRequestTransactions);
        
                    /**
                     * On receiving a 'sendTransaction' event, reply to show it was received, and re-emit that event to
                     * all other connected Clients 
                     */
                    let onSendTransaction = (transactionJSON) => {
                        console.info("RELAY NODE: Received sendTransaction | ", transactionJSON);
        
                        let transactionParsed = JSON.parse(transactionJSON);
                        let transaction = transactionExporter.createExistingTransaction(transactionParsed.sender, transactionParsed.execution, transactionParsed.validatedTransactions, transactionParsed.transactionHash, transactionParsed.signature, transactionParsed.timestamp);
                        if (svmExporter.getVirtualMachine().incomingTransaction(transaction)) {
                            console.info("ADDING TO SVM: ", transaction.transactionHash);
                            // Relay transaction to every other connected client
                            console.info("RELAY NODE: Sending notifyTransaction: ", transaction.transactionHash);
                            this.socketServer.emit('notifyTransaction', transactionJSON);
        
                            // Fetch blockchain headers
                            console.info("RELAY NODE: Sending responseSendTransaction");
                            client.emit('responseSendTransaction');
                        }
                    }
                    client.on('sendTransaction', onSendTransaction);
                });

                // Begin listening on our port
                server.listen(port);
                
                this.socketServer = socket;
                this.httpServer = server;
            } else {
                console.info("ERROR: Failed to create a socket.io server");
            }
        } else {
            console.info("ERROR: Failed to create a http server");
        }
    }
}