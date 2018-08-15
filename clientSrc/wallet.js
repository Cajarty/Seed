console.log("Wallet.js");

const seed = require("../seedSrc/index.js");
const scenarioExporter = seed.getScenarioTestExporter();
const ipc = require('electron').ipcRenderer;

let svm = seed.getSVMExporter().getVirtualMachine();
let seedModule = seed.getSeedExporter().getSeed();

let balance = 0.0;
let account = undefined;

scenarioExporter.seedAndSVMTransactionTest();

function seedSend() {
    console.log("SEND");
    //reloadBalance(10);
}

function seedApprove() {
    console.log("APPROVE");
}

function seedDestroy() {
    console.log("DESTROY");
}

function seedUpdate() {
    // Request which user is the active user
    ipc.send('activeUserRequest');
}

// On receiving "this is the active user", reload data
ipc.on('activeUserResponse', function(event, activeUserEntropy) {
    account = seed.getAccountExporter().newAccount( { entropy : activeUserEntropy, network : "00" });
    balance = svm.invoke({ 
        module : "Seed",
        function : "getBalanceOf",
        args : { owner : account.publicKey },
        user : account.publicKey,
        txHashes : []
    });
    ipc.send('reloadBalance', balance);
    ipc.send('reloadAddress', account.publicKey);
});



/*ipc.on('invokeAction', function(arg) {
    arg.innerHTML = balance;
});*/