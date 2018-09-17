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

class RelayNode {
    constructor(relayNodeIPs) {
        this.httpServer = undefined;
        this.socketServer = undefined;
        this.relayClients = [];
        for(let i = 0; i < relayNodeIPs.length; i++) {
            // Create a client for communicating with that other relay node
            this.relayClients.push(clientExporter.createClient(relayNodeIPs[i]));
        }
    }

    loadState() {
        // Ask the firstly created client for blockchain/entanglement data to get caught up to speed
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

            let onRequestBlocks = (blockchainHeaders) => {
                console.info("SERVER: Received requestBlocks | ");
                // Fetch blockchain headers
                
                let blocks = blockchainExporter.getBlocks(blockchainHeaders);
                console.info("SERVER: Sending responseBlocks | ", blocks );
                client.emit('responseBlocks', blocks);
            }
            client.on('requestBlocks', onRequestBlocks);

            let onRequestTransactions = () => {
                console.info("SERVER: Received requestTransactions | ");
                // Fetch blockchain headers
                let transactions = [ "TRANSACTION1" ];
                console.info("SERVER: Sending responseTransactions | ", transactions );
                client.emit('responseTransactions', transactions);
            }
            client.on('requestTransactions', onRequestTransactions);

            let onSendTransaction = (transaction) => {
                console.info("SERVER: Received sendTransaction | ", transaction);
                // Fetch blockchain headers
                console.info("SERVER: Sending responseSendTransaction");
                client.emit('responseSendTransaction');
            }
            client.on('sendTransaction', onSendTransaction);
        });
        server.listen(3000);
        
        this.socketServer = socket;
        this.httpServer = server;
    }
}