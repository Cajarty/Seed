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
        socket.on('test', (data) => {
            console.info("CLIENT: Received message | ", data);
            setTimeout(() => {
                console.info("CLIENT: Sending test | ", "*thump*");
                socket.emit('test', "*thump*")
            }, 2000);
        });
        socket.on('forceClose', () => {
            socket.close();
        });
        socket.on('connect', (evt) => {
            console.info("CLIENT: Received connect");
            console.info("CLIENT: Sending test | ", "Howdy!");
            socket.emit('test', "Howdy!");
        });
        socket.on('disconnect', (evt) => {
            console.info("CLIENT: Received disconnect | ", evt);
        });
        let onError = (message) => {
            console.info("CLIENT: Received error | ", message);
        }
        socket.on('connect_error', onError );
        socket.on('reconnect_error', onError );

        this.socketClient = socket;
    }

    requestBlockchainHeaders() {

    }

    requestEntanglementHeaders() {

    }

    requestBlocks(blockInfos) {

    }

    requestTransactions(transactionInfos) {

    }

    sendTransaction(transaction) {

    }
}