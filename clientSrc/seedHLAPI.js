
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

module.exports = {
    getSeedHLAPI : function(ipcPromiseRenderer) {
        return new SeedHLAPI(ipcPromiseRenderer);
    }
 }

class SeedHLAPI {
    constructor(ipcPromiseRenderer) {
        this.account = undefined;
        this.seed = require("../seedSrc/index.js");
        this.ipcPromiseRenderer = ipcPromiseRenderer;
    }
    // Returns the account by asking main.js through IPC
    getAccount() {
        return this.ipcPromiseRenderer.send("getAccount");
    }
    getTransaction(transactionHash) {
        return this.ipcPromiseRenderer.send("getTransaction", transactionHash);
    }
    // Returns a newly created transaction
    createTransaction(moduleName, functionName, args) {
        return this.ipcPromiseRenderer.send("createTransaction", moduleName, functionName, args);
    }
    addTransaction(transaction) {
        return this.ipcPromiseRenderer.send("addTransaction", transaction);
    }
    getter(moduleName, getterName, args) {
        return this.ipcPromiseRenderer.send("getter", moduleName, getterName, args);
    }
    read(moduleName, dataKey, optionalUser) {
        return this.ipcPromiseRenderer.send("read", moduleName, dataKey, optionalUser);
    }
    subscribeToFunctionCallback(moduleName, functionName) {
        return this.ipcPromiseRenderer.send("subscribeToFunctionCallback", moduleName, functionName);
    }
    subscribeToDataChange(moduleName, dataKey, user) {
        return this.ipcPromiseRenderer.send("subscribeToDataChange", moduleName, dataKey, user);
    }
    unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser) {
        return this.ipcPromiseRenderer.send("unsubscribe", moduleName, funcNameOrDataKey, receipt, optionalUser);
    }
    addModule(newModule, creator) {
        return this.ipcPromiseRenderer.send("addModule", newModule, creator);
    }
    createModule(moduleName, initialStateData, initialUserStateData) {
        return this.ipcPromiseRenderer.send("createModule", moduleName, initialStateData, initialUserStateData);
    }
    getModule(moduleName) {
        return this.ipcPromiseRenderer.send("getModule", moduleName);
    }
 }