/**
 * ***************
 * ***client.js***
 * ***************
 * 
 * Client NodeJS code which allows for the creation of clients who connect to relay nodes
 * 
 */
module.exports = {
    createClient : function(relayIP) {
        return new Client(relayIP);
    }
}

const ioClient = require('socket.io-client');

class Client {
    constructor() {
        this.socketClient = undefined;
    }

    connect(relayIP) {
        console.info("CLIENT: StartClient");
        let socket = ioClient(relayIP, {transports: ['websocket']});
        socket.on('forceClose', () => {
            socket.close();
        });
        socket.on('connect', (evt) => {
            console.info("CLIENT: Received connect");
        });
        socket.on('disconnect', (evt) => {
            console.info("CLIENT: Received disconnect | ", evt);
        });
        let onError = (message) => {
            console.info("CLIENT: Received error | ", message);
        }
        socket.on('connect_error', onError );
        socket.on('reconnect_error', onError );

        // Crypto stuff
        socket.on('responseBlockchainHeaders', (blockchainHeaders) => {
            console.info("CLIENT: Received responseBlockchainHeaders | ", blockchainHeaders);
        });
        socket.on('responseEntanglementHeaders', (transactionHeaders) => {
            console.info("CLIENT: Received responseEntanglementHeaders | ", transactionHeaders);
        });
        socket.on('responseBlocks', (blocks) => {
            console.info("CLIENT: Received responseBlocks | ", blocks);
        });
        socket.on('responseTransactions', (transactions) => {
            console.info("CLIENT: Received responseTransactions | ", transactions);
        });
        socket.on('responseSendTransaction', (response) => {
            console.info("CLIENT: Received responseSendTransaction | ", response);
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
        if (this.socketClient) {
            console.info("CLIENT: Sending sendTransaction");
            this.socketClient.emit("sendTransaction", transaction);
        }
    }
}