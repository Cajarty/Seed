console.log("seed.js");

const seed = require("../seedSrc/index.js");
const scenarioExporter = seed.getScenarioTestExporter();
const ipc = require('electron').ipcRenderer;
const seedHLAPI = require("./seedHLAPI.js").getSeedHLAPI(ipc);

let svm = seed.getSVMExporter().getVirtualMachine();
let seedModule = seed.getSeedExporter().getSeed();

let balance = 0.0;
let address = "";

scenarioExporter.seedAndSVMTransactionTest();

function valueChange(newValue) {
    balance = parseInt(newValue, 10);
}


function addressChange(newAddress) {
    address = newAddress;
}

function seedSend() {
    if (balance != 0 && address != "") {
        let transaction = seedHLAPI.createTransaction("Seed", "transfer", { to : address, value : balance });
        seedHLAPI.addTransaction(transaction);
    }
}

function seedApprove() {
    if (balance != 0 && address == undefined) {
        let transaction = seedHLAPI.createTransaction("Seed", "approve", { spender : address, value : balance });
        seedHLAPI.addTransaction(transaction);
    }
}

function seedDestroy() {
    if (balance != 0) {
        let transaction = seedHLAPI.createTransaction("Seed", "burn", { value : balance });
        seedHLAPI.addTransaction(transaction);
    }
}

function seedUpdate() {
    let account = seedHLAPI.getAccount();
    balance = seedHLAPI.getter("Seed", "getBalanceOf", { owner : account.publicKey });
    let seedBalanceStr = "document.getElementById(\"seedBalance\").innerHTML = " + balance + ";";
    seedHLAPI.executeJavaScript("Seed", seedBalanceStr);
    let seedAddressStr = "document.getElementById(\"seedAddress\").innerHTML = \"" + account.publicKey + "\";";
    seedHLAPI.executeJavaScript("Seed", seedAddressStr);
}
