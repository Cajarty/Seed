/*****************
 * seed/index.js *
 *****************
 * 
 * The JavaScript loaded into the Seed DApp.
 * 
 * Communicates with the SeedHLAPI to use the "Seed" module. This handles all backend logic for the HTML,
 * including how to reload the HTML when users change, handle subscribing/unsubscribing to events, and
 * creating transactions.
 */

const seed = require("../../../seedSrc/index.js");
const ipc = require('electron').ipcRenderer;
const { PromiseIpc } = require('electron-promise-ipc');
const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });
const seedHLAPI = require("../../seedHLAPI.js").getSeedHLAPI(promiseIpc);

let svm = seed.getSVMExporter().getVirtualMachine();
let lastUser = undefined;
let subscriptionReceipts = {};

// Input Form's data with default values
let inputData = {
    constructor : {
        value : 1000
    },
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

/**
 * On form selection dropdown changing states, this function is invoked.
 * It swaps between the differing forms available, depending on which
 * Seed function the user is intending on using.
 * 
 * @param {*} functionName - The Seed function a user has selected to use
 */
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
/**
 * Handler invoked when the Constructor forms "Value" input changes
 * 
 * @param {*} newValue - The amount of Seed the user wishes to create upon construction
 */
function constructorValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["constructor"].value = value;
}

/**
 * Handler invoked when the Transfer forms "Value" input changes
 * 
 * @param {*} newValue - The amount of Seed the user wishes to send upon transfer
 */
function transferValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["transfer"].value = value;
}

/**
 * Handler invoked when the Transfer forms "Address" input changes
 * 
 * @param {*} newAddress - Who the user wishes to send Seed too
 */
function transferAddressChange(newAddress) {
    inputData["transfer"].address = newAddress;
}

/**
 * Handler invoked when the TransferFrom forms "Value" input changes
 * 
 * @param {*} newValue - The amount of Seed the user wishes to transfer on another users behalf
 */
function transferFromValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["transferFrom"].value = value;
}

/**
 * Handler invoked when the TransferFrom forms "Address From" input changes
 * 
 * @param {*} newAddress - Who's funds the user wishes to transfer on the behalf of
 */
function transferFromAddressFromChange(newAddress) {
    inputData["transferFrom"].fromAddress = newAddress;
}

/**
 * Handler invoked when the TransferFrom forms "Address To" input changes
 * 
 * @param {*} newAddress - Who the user wants to send Seed to on another users behalf
 */
function transferFromAddressToChange(newAddress) {
    inputData["transferFrom"].toAddress = newAddress;
}

/**
 * Handler invoked when the Approve forms "Value" input changes
 * 
 * @param {*} newValue - The amount of Seed the user wishes to set as the allowance for another user
 */
function approveValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["approve"].value = value;
}

/**
 * Handler invoked when the Approve forms "Address" input changes
 * 
 * @param {*} newAddress - Who the user wishes to give an allowance too
 */
function approveAddressChange(newAddress) {
    inputData["approve"].address = newAddress;
}

/**
 * Handler invoked when the Burn forms "Value" input changes
 * 
 * @param {*} newValue - How much Seed the user wishes to burn and remove from circulation
 */
function burnValueChange(newValue) {
    let value = parseInt(newValue, 10);
    inputData["burn"].value = value;
}

// ####### Seed Function Implementations ###########
/**
 * Creates a transaction invoking the Seed constructor, passing in the Constructor forms' value
 * as the inital amount of Seed to create.
 */
function construct() {
    let value = inputData["constructor"].value;
    seedHLAPI.createAndPropagateTransaction("Seed", "constructor", { initialSeed : value })
        .then(() => {
            seedUpdate();
        }).catch((e) => {
            console.info("ERROR: ", e);
        });
}

/**
 * Creates a transaction invoking the Seed transfer function, passing in the Transfer forms' value
 * as the amount of Seed to send, and their address as who to send to.
 */
function transfer() {
    let value = inputData["transfer"].value;
    let address = inputData["transfer"].address;
    if (value != 0 && address != "") {
        seedHLAPI.createAndPropagateTransaction("Seed", "transfer", { to : address, value : value }).catch((e) => {
            console.info("ERROR: ", e);
        });
    }
}

/**
 * Creates a transaction invoking the Seed transferFrom function, passing in the TransferFrom forms' value
 * as the amount of Seed to send, and the fromAddress to denote who the user has an allowance with,
 * and the toAddress to denote who to send the Seed to.
 */
function transferFrom() {
    let value = inputData["transferFrom"].value;
    let fromAddress = inputData["transferFrom"].fromAddress;
    let toAddress = inputData["transferFrom"].toAddress;
    if (value != 0 && fromAddress != "" && toAddress != "") {
        seedHLAPI.createAndPropagateTransaction("Seed", "transferFrom", { from : fromAddress, to : toAddress, value : value }).catch((e) => {
            console.info("ERROR: ", e);
        });
    }
}

/**
 * Creates a transaction invoking the Seed approve function, passing in the Approve forms' value
 * as the amount of Seed to set the allowance at, and the address to denote who to give the allowance to.
 */
function approve() {
    let value = inputData["approve"].value;
    let address = inputData["approve"].address;
    if (value != 0 && address != undefined) {
        seedHLAPI.createAndPropagateTransaction("Seed", "approve", { spender : address, value : value }).catch((e) => {
            console.info("ERROR: ", e);
        });
    }
}

/**
 * Creates a transaction invoking the Seed burn function, passing in the Burn forms' value
 * as the amount of Seed to burn. This removes it from circulation.
 */
function burn() {
    let value = inputData["burn"].value;
    if (value != 0) {
        seedHLAPI.createAndPropagateTransaction("Seed", "burn", { value : value }).catch((e) => {
            console.info("ERROR: ", e);
        });
    }
}

// ####### Helper Functions ###########
/**
 * Reloads the data to display on the UI, fetching it from the Seed's ledger
 */
function seedUpdate() {
    seedHLAPI.getAccount()
        .then((account) => {
            if (lastUser != account.publicKey) {
                resubscribe(account.publicKey);
            }
            lastUser = account.publicKey;
            seedHLAPI.getter("Seed", "getBalanceOf", { owner : lastUser })
                .then((balance) => {
                    changeInnerHTML("seedBalance", balance);
                    changeInnerHTML("seedAddress", "\"" + lastUser + "\"");
                });
        });
}

/**
 * Modifies the innerHTML variable of any given element. This creates the JavaScript command
 * as a string, then sends the command over IPC to the Main process to execute.
 * 
 * @param {*} elementID - Which element to change the "innerHTML" of
 * @param {*} value  - What to change the "innerHTML" value to
 */
function changeInnerHTML(elementID, value) {
    let javascript = "document.getElementById(\"" + elementID + "\").innerHTML = " + value;
    ipc.send("executeJavaScript", "Seed", javascript);
}

/**
 * Modifies the style.display variable of any given element. This creates the JavaScript command
 * as a string, then sends the command over IPC to the Main process to execute.
 * 
 * @param {*} formID - Which form to change the display style of
 * @param {*} display  - What to change the display style to
 */
function changeFunctionFormDisplay(formID, display) {
    let javascript = "document.getElementById(\"" + formID + "\").style.display = \"" + display + "\"";
    ipc.send("executeJavaScript", "Seed", javascript);
}

/**
 * If there was a previous subscription, this unsubscribes to the old callbacks regarding the last account,
 * creates new subscription callbacks for the new user, and then updates the UI to fetch the new users' data.
 * 
 * @param {*} publicKey - The public key who's updates we are subscribing for
 */
function resubscribe(publicKey) {
    if (subscriptionReceipts["balance"]) {
        seedHLAPI.unsubscribe("Seed", "balance", subscriptionReceipts["balance"], lastUser);
        ipc.removeAllListeners("Seed" + "balance" + lastUser);
        delete subscriptionReceipts["balance"];
    }

    seedHLAPI.subscribeToDataChange("Seed", "balance", publicKey)
        .then((receipt) => {
            subscriptionReceipts["balance"] = receipt;
            ipc.on("Seed" + "balance" + publicKey, (main, message) => {
                seedUpdate(); // Balance changed so reload
            });
        })
        .catch((e) => {
            console.info("Failed to subscribe: ", e);
        });
}

// ####### IPC Receivers ###########
/**
 * on receiving an "accountChanged" message, this unsubscribes to the old callbacks regarding the last account,
 * creates new subscription callbacks for the new user, and then updates the UI to fetch the new users' data
 */
ipc.on("accountChanged", (main, publicKey) => {
    seedUpdate();

    lastUser = publicKey;
});

// ####### Seed DApp Initiation Code ###########
onFunctionSelected("constructor"); // Selects the "constructor" as the active form to display
seedUpdate(); // Fetches the active users' account information to display