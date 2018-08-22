const seed = require("../../../seedSrc/index.js");
const ipc = require('electron').ipcRenderer;
const seedHLAPI = require("../../seedHLAPI.js").getSeedHLAPI(ipc);

let accounts = {};
let currentUser = undefined;

function relay() {
    let name = "Z" + (Math.random() * 100) % 100;
    switchUser(name);
    let transaction = seed.getSVMExporter().getVirtualMachine().createTransaction(currentUser, "Relay", "relay", {}, 4);
    return transaction;
}

function ensureCreated(user) {
    if (!accounts[user]) {
        accounts[user] = seed.getAccountExporter().newAccount( { entropy : user + "_123456789012345678901234567890", network : "00" });
    }
}

function switchUser(user) {
    ensureCreated(user);
    currentUser = accounts[user];
}

function getAccount(user) {
    ensureCreated(user);
    return accounts[user].publicKey;
}