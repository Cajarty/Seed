console.log("Wallet.js");

const seed = require("../seedSrc/index.js");
const scenarioExporter = seed.getScenarioTestExporter();
const ipc = require('electron').ipcRenderer;

let svm = seed.getSVMExporter().getVirtualMachine();
let seedModule = seed.getSeedExporter().getSeed();

let balance = 0.0;
let account = undefined;
let inputValue = 0.0;
let inputAddress = undefined;

scenarioExporter.seedAndSVMTransactionTest();

function seedSend(value, toAddress) {
    if (value == undefined && toAddress == undefined) {
        //Fetch data
        ipc.send('inputFieldsRequest', "seedSend");
    } else {
        //Send
        let transaction = svm.createTransaction(account, "Seed", "transfer", { to : toAddress, value : value }, 2);
        let txHashes = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            txHashes.push(transaction.validatedTransactions[i].transactionHash);
        }
        svm.invoke({ 
            module : transaction.execution.moduleName, 
            function : transaction.execution.functionName, 
            user : account.publicKey, 
            args : transaction.execution.args,
            txHashes : txHashes
        }, transaction.execution.changeSet);
    }
}

function seedApprove(value, spender) {
    if (value == undefined && spender == undefined) {
        //Fetch data
        ipc.send('inputFieldsRequest', "seedApprove");
    } else {
        //Send
        let transaction = svm.createTransaction(account, "Seed", "approve", { spender : spender, value : value }, 2);
        let txHashes = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            txHashes.push(transaction.validatedTransactions[i].transactionHash);
        }
        svm.invoke({ 
            module : transaction.execution.moduleName, 
            function : transaction.execution.functionName, 
            user : account.publicKey, 
            args : transaction.execution.args,
            txHashes : txHashes
        }, transaction.execution.changeSet);
    }
}

function seedDestroy(value) {
    if (value == undefined) {
        //Fetch data
        ipc.send('inputFieldsRequest', "seedDestroy");
    } else {
        //Send
        let transaction = svm.createTransaction(account, "Seed", "burn", { value : value }, 2);
        let txHashes = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            txHashes.push(transaction.validatedTransactions[i].transactionHash);
        }
        svm.invoke({ 
            module : transaction.execution.moduleName, 
            function : transaction.execution.functionName, 
            user : account.publicKey, 
            args : transaction.execution.args,
            txHashes : txHashes
        }, transaction.execution.changeSet);
    }
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

ipc.on('inputFieldsResponse', function(event, value, address, funcToCall) {
    inputValue = value;
    inputAddress = address;
    if (funcToCall) {
        switch(funcToCall) {
            case "seedSend":
            seedSend(value, address);
            break;
            case "seedApprove":
            seedApprove(value, address);
            break;
            case "seedDestroy":
            seedDestroy(value);
            break;
        }
    }
});


/*ipc.on('invokeAction', function(arg) {
    arg.innerHTML = balance;
});*/