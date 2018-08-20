
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
    getSeedHLAPI : function(ipcRenderer) {
        return new SeedHLAPI(ipcRenderer);
    }
 }

class SeedHLAPI {
    constructor(ipcRenderer) {
        this.account = undefined;
        this.seed = require("../seedSrc/index.js");
        this.ipcRenderer = ipcRenderer;
    }
    // Returns the account by asking main.js through IPC
    getAccount() {
        let entropy = this.ipcRenderer.sendSync("getAccountEntropy");
        this.account = this.seed.getAccountExporter().newAccount( { entropy : entropy, network : "00" });
        return this.account;
    }
    getTransaction(transactionHash) {
        // Returns the transaction from the entanglement
        return this.seed.getEntanglementExporter().getEntanglement().transactions[transactionHash];
    }
    // Returns a newly created transaction
    createTransaction(moduleName, functionName, args) {
        let account = this.getAccount();
        return this.seed.getSVMExporter().getVirtualMachine().createTransaction(account, moduleName, functionName, args, 2);
    }
    addTransaction(transaction) {
        let account = this.getAccount();
        let txHashes = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            txHashes.push(transaction.validatedTransactions[i].transactionHash);
        }
        this.seed.getSVMExporter().getVirtualMachine().invoke({ 
            module : transaction.execution.moduleName, 
            function : transaction.execution.functionName, 
            user : account.publicKey, 
            args : transaction.execution.args,
            txHashes : txHashes
        }, transaction.execution.changeSet);
    }
    getter(moduleName, getterName, args) {
        let account = this.getAccount();
        let svm = this.seed.getSVMExporter().getVirtualMachine();
        return svm.invoke({ 
            module : moduleName,
            function : getterName,
            args : args,
            user : account.publicKey,
            txHashes : []
        });
    }
    read(moduleName, dataKey, optionalUser) {
        let moduleData = this.seed.getLedgerExporter().getLedger().getModuleData(moduleName);
        if (optionalUser) {
            return moduleData[optionalUser][dataKey];
        } else {
            return moduleData[dataKey];
        }
    }
    subscribeToFunctionCallback(moduleName, functionName, callback) {
        return this.seed.subscribeToFunctionCallback(moduleName, functionName, callback);
    }
    subscribeToDataChange(moduleName, dataKey, callback, user) {
        return this.seed.subscribeToDataChange(modulename, dataKey, callback, user);
    }
    unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser) {
        this.seed.unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser);
    }
    addModule(newModule, creator) {
        let svm = this.seed.getSVMExporter().getVirtualMachine();
        svm.addModule(newModule, creator);
    }
    createModule(moduleName, initialStateData, initialUserStateData) {
        return this.seed.getModuleExporter().createModule({ module : moduleName, data : initialStateData, initialUserData : initialUserStateData });
    }
    getModule(moduleName) {
        return this.seed.getSVMExporter().getModule({ module : moduleName });
    }
    executeJavaScript(windowName, javaScriptString, callback) {
        if (!callback) {
            callback = function() {};
        }
        this.ipcRenderer.send("executeJavaScript", windowName, javaScriptString, callback.toString());
    }
    hideToolbar() {

    }
 }