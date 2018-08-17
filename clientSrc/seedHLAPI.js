
/**
 * Seed High Level API
 * 
 * Needs:
 * - getAccount
 * - getTransaction
 * - createTransaction
 * - addTransaction
 * - read
 * - subscribe
 * - addModule
 * - createModule
 * - getModule
 * - unsubscribe
 * - executeJavaScript
 * - hideToolbar
 * 
 * How:
 * Will take in the constructor a "ipcRenderer" to know how to subscribe. This communicates via IPC with seed.js and/or the entanglement to execute the API
 */
const seed = require("../seedSrc/index.js");

module.exports = {
    getSeedHLAPI : function(ipcRenderer) {
        return new SeedHLAPI(ipcRenderer);
    }
 }


class SeedHLAPI {
    constructor(ipcRenderer) {
        this.ipcRenderer = ipcRenderer;
    }
    getAccount() {
        // Returns the account by asking main.js through IPC
    }
    getTransaction() {
        // Returns the transaction from the entanglement
    }
    createTransaction() {
        // Returns a newly created transaction
    }
    addTransaction() {
    }
    read() {
        // Returns a newly created transaction
    }
    subscribe() {
        // Returns a newly created transaction
    }
    addModule() {
        // Returns a newly created transaction
    }
    createModule() {
        // Returns a newly created transaction
    }
    getModule() {
        // Returns a newly created transaction
    }
    unsubscribe() {
        // Returns a newly created transaction
    }
    executeJavaScript() {
        // Returns a newly created transaction
    }

    hideToolbar() {
        // Returns a newly created transaction
    }
 }