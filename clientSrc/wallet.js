console.log("Wallet.js");

const seed = require("../seedSrc/index.js");
const scenarioExporter = seed.getScenarioTestExporter();
const ipc = require('electron').ipcRenderer;

let balance = 0.0;
let svm = seed.getSVMExporter().getVirtualMachine();
let seedModule = seed.getSeedExporter().getSeed();

//scenarioExporter.cryptographyTest();

let account = seed.getAccountExporter().newAccount( { entropy : "ABC_123456789012345678901234567890", network : "00" });

scenarioExporter.seedAndSVMTransactionTest();
//scenarioExporter.seedModuleTest();
//scenarioExporter.vmModuleTest();


function reloadBalance() {
    console.info("reloadBalance", balance);
}

balance = svm.invoke({ 
    module : "Seed",
    function : "getBalanceOf",
    args : { owner : account.publicKey },
    user : account.publicKey,
    txHashes : []
});


// Load an account and store in "address"
//seed.subscribeToDataChange("Seed", "balance", reloadBalance, address);

function seedSend() {
    console.log("SEND");
    //reloadBalance(10);
}

function seedApprove() {
    console.log("APPROVE");
}

function seedDestroy() {
    ipc.send('reloadBalance', balance);
}

function seedUpdate() {
    ipc.send('reloadBalance', balance);
    ipc.send('reloadAddress', account.publicKey);
}


/*ipc.on('invokeAction', function(arg) {
    arg.innerHTML = balance;
});*/