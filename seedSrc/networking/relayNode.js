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

            let onTest = (data) =>{
                console.info("SERVER: Received test | ", data);
                console.info("SERVER: Sending test | ", "Cheers, " + client.id);
                client.emit('test', "Cheers, " + client.id);
            };
            client.on('test', onTest);

            let onDisconnect = () => {
                console.info("SERVER: Received disconnect");
                client.removeListener('test', onTest);
                client.removeListener('disconnect', onDisconnect);
            };
            client.on('disconnect', onDisconnect);
        });
        server.listen(3000);
        
        this.socketServer = socket;
        this.httpServer = server;
    }
}