console.log("seed.js");

const seed = require("../../../seedSrc/index.js");
const scenarioExporter = seed.getScenarioTestExporter();
const ipc = require('electron').ipcRenderer;
const seedHLAPI = require("../../seedHLAPI.js").getSeedHLAPI(ipc);

let svm = seed.getSVMExporter().getVirtualMachine();
let seedModule = seed.getSeedExporter().getSeed();

scenarioExporter.seedAndSVMTransactionTest();

// ## Input Form Default Data
let inputData = {
    transfer : {
        value : 0,
        address : ""
    },
    transferFrom : {
        fromAddress : "",
        toAddress : "",
        value : 0
    },
    approve : {
        address : "",
        value : 0
    },
    burn : {
        value : 0
    }
};

// ## On Form Selection Dropdown Change
function onFunctionSelected(functionName) {
    let transferDisplay = 'none';
    let transferFromDisplay = 'none';
    let approveDisplay = 'none';
    let burnDisplay = 'none';
    switch(functionName) {
        case "transfer": 
            transferDisplay = '';
            break;
        case "transferFrom":
            transferFromDisplay = '';
            break;
        case "approve":
            approveDisplay = '';
            break;
        case "burn":
            burnDisplay = '';
            break;
    }
    changeFunctionFormDisplay("trTransfer", transferDisplay);
    changeFunctionFormDisplay("trTransferFrom", transferFromDisplay);
    changeFunctionFormDisplay("trApprove", approveDisplay);
    changeFunctionFormDisplay("trBurn", burnDisplay);
}

// ####### Form Data OnChange Event Handlers ###########
function transferValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["transfer"].value = value;
}

function transferAddressChange(newAddress) {
    inputData["transfer"].address = newAddress;
}

function transferFromValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["transferFrom"].value = value;
}

function transferFromAddressFromChange(newAddress) {
    inputData["transferFrom"].fromAddress = newAddress;
}

function transferFromAddressToChange(newAddress) {
    inputData["transferFrom"].toAddress = newAddress;
}

function approveValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["approve"].value = value;
}

function approveAddressChange(newAddress) {
    inputData["approve"].address = newAddress;
}

function burnValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["burn"].value = value;
}

// ## Seed Functions
function transfer() {
    let value = inputData["transfer"].value;
    let address = inputData["transfer"].address;
    if (value != 0 && address != "") {
        let transaction = seedHLAPI.createTransaction("Seed", "transfer", { to : address, value : value });
        seedHLAPI.addTransaction(transaction);
    }
}

function transferFrom() {
    let value = inputData["transferFrom"].value;
    let fromAddress = inputData["transferFrom"].fromAddress;
    let toAddress = inputData["transferFrom"].toAddress;
    if (value != 0 && fromAddress != "" && toAddress != "") {
        let transaction = seedHLAPI.createTransaction("Seed", "transferFrom", { from : fromAddress, to : toAddress, value : value });
        seedHLAPI.addTransaction(transaction);
    }
}

function approve() {
    let value = inputData["approve"].value;
    let address = inputData["approve"].address;
    if (value != 0 && address != undefined) {
        let transaction = seedHLAPI.createTransaction("Seed", "approve", { spender : address, value : value });
        seedHLAPI.addTransaction(transaction);
    }
}

function burn() {
    let value = inputData["burn"].value;
    if (value != 0) {
        let transaction = seedHLAPI.createTransaction("Seed", "burn", { value : value });
        seedHLAPI.addTransaction(transaction);
    }
}

// ## Helper Functions
function seedUpdate() {
    let accountPublicKey = seedHLAPI.getAccount().publicKey;
    let balance = seedHLAPI.getter("Seed", "getBalanceOf", { owner : accountPublicKey });
    changeInnerHTML("seedBalance", balance);
    changeInnerHTML("seedAddress", "\"" + accountPublicKey + "\"");
}

function changeInnerHTML(elementID, value) {
    let javascript = "document.getElementById(\"" + elementID + "\").innerHTML = " + value;
    seedHLAPI.executeJavaScript("Seed", javascript);
}

function changeFunctionFormDisplay(formID, display) {
    let javascript = "document.getElementById(\"" + formID + "\").style.display = \"" + display + "\"";
    seedHLAPI.executeJavaScript("Seed", javascript);
}

onFunctionSelected("transfer");
seedUpdate();