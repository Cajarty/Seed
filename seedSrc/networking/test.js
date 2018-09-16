
const ioServer = require('socket.io');
const ioClient = require('socket.io-client');
let httpServer;
let socketClient;
let socketServer;

module.exports = {
    startServer : function() {
        console.info("SERVER: StartServer");
        var server = require('http').createServer();
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
        
        socketServer = socket;
        httpServer = server;
    },
    startClient : function() {
        console.info("CLIENT: StartClient");
        let socket = ioClient('http://localhost:3000', {transports: ['websocket']});
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

        socketClient = socket;
    }
}