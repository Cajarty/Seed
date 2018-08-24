const seed = require("../../../seedSrc/index.js");
const ipc = require('electron').ipcRenderer;
const { PromiseIpc } = require('electron-promise-ipc');
const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });
const seedHLAPI = require("../../seedHLAPI.js").getSeedHLAPI(promiseIpc);

let accounts = {};
let currentUser = undefined;

function relay() {
    let entropy = ("Z" + (Math.random() * 100) % 100) + "_123456789012345678901234567890";
    seedHLAPI.switchAccount(entropy)
        .then(() => {
            seedHLAPI.createTransaction("Relay", "relay", {}, 4);
        });
    //return transaction;
}