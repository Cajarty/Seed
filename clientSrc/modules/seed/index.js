console.log("seed.js");

const seed = require("../../../seedSrc/index.js");
const ipc = require('electron').ipcRenderer;
const { PromiseIpc } = require('electron-promise-ipc');
const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });
const seedHLAPI = require("../../seedHLAPI.js").getSeedHLAPI(promiseIpc);

let svm = seed.getSVMExporter().getVirtualMachine();
let lastUser = undefined;
let subscriptionReceipts = {};

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
    let constructorDisplay = 'none';
    let transferDisplay = 'none';
    let transferFromDisplay = 'none';
    let approveDisplay = 'none';
    let burnDisplay = 'none';
    switch(functionName) {
        case "constructor":
            constructorDisplay = '';
            break;
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
    changeFunctionFormDisplay("trConstructor", constructorDisplay);
    changeFunctionFormDisplay("trTransfer", transferDisplay);
    changeFunctionFormDisplay("trTransferFrom", transferFromDisplay);
    changeFunctionFormDisplay("trApprove", approveDisplay);
    changeFunctionFormDisplay("trBurn", burnDisplay);
}

// ####### Form Data OnChange Event Handlers ###########
function constructorValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["constructor"].value = value;
}

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
function construct() {
    let value = inputData["constructor"].value;
    let seedModule = seed.getSeedExporter().getSeed();
    console.info("constructor");
    seedHLAPI.addModule(seedModule)
        .then(() => {
            seedHLAPI.createTransaction("Seed", "constructor", { initialSeed : 1000 })
                .then(() => {
                    seedUpdate();
                });
        });
}

function transfer() {
    let value = inputData["transfer"].value;
    let address = inputData["transfer"].address;
    if (value != 0 && address != "") {
        seedHLAPI.createTransaction("Seed", "transfer", { to : address, value : value });
    }
}

function transferFrom() {
    let value = inputData["transferFrom"].value;
    let fromAddress = inputData["transferFrom"].fromAddress;
    let toAddress = inputData["transferFrom"].toAddress;
    if (value != 0 && fromAddress != "" && toAddress != "") {
        seedHLAPI.createTransaction("Seed", "transferFrom", { from : fromAddress, to : toAddress, value : value });
    }
}

function approve() {
    let value = inputData["approve"].value;
    let address = inputData["approve"].address;
    if (value != 0 && address != undefined) {
        seedHLAPI.createTransaction("Seed", "approve", { spender : address, value : value });
    }
}

function burn() {
    let value = inputData["burn"].value;
    if (value != 0) {
        seedHLAPI.createTransaction("Seed", "burn", { value : value });
    }
}

// ## Helper Functions
function seedUpdate() {
    seedHLAPI.getAccount()
        .then((account) => {
            lastUser = account.publicKey;
            seedHLAPI.getter("Seed", "getBalanceOf", { owner : lastUser })
                .then((balance) => {
                    changeInnerHTML("seedBalance", balance);
                    changeInnerHTML("seedAddress", "\"" + lastUser + "\"");
                });
        });
}

function changeInnerHTML(elementID, value) {
    let javascript = "document.getElementById(\"" + elementID + "\").innerHTML = " + value;
    ipc.send("executeJavaScript", "Seed", javascript);
}

function changeFunctionFormDisplay(formID, display) {
    let javascript = "document.getElementById(\"" + formID + "\").style.display = \"" + display + "\"";
    ipc.send("executeJavaScript", "Seed", javascript);
}

ipc.on("accountChanged", (main, publicKey) => {
    if (!lastUser) {
        if (subscriptionReceipts["balance"]) {
            seedHLAPI.unsubscribe("Seed", "balance", subscriptionReceipts["balance"], lastUser);
            ipc.removeAllListeners("Seed" + "balance" + lastUser);
        }
    }

    seedHLAPI.subscribeToDataChange("Seed", "balance", publicKey)
        .then((receipt) => {
            subscriptionReceipts["balance"] = receipt;
            ipc.on("Seed" + "balance" + publicKey, (main, a, b, c, d) => {
                console.info("CALLBACK YES!", a, b, c, d);
            });
        })
        .catch((e) => {
            console.info("Failed to subscribe: ", e);
        });
    
    seedUpdate();

    lastUser = publicKey;
});

onFunctionSelected("constructor");