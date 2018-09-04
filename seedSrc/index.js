/************
 * index.js *
 ************
 * 
 * The entry point into the npm Seed module OR the Seed Low Level API (LLAPI).
 * 
 * Exposes all exports and wraps some logic for use
 */

const virtualMachineExporter = require("./virtualMachine/virtualMachine.js");
const scenarioTestExporter = require("./scenarioTest.js");
const messagingExporter = require("./messaging.js");
const seedExporter = require("../clientSrc/modules/seed/seed.js");
const relayExporter = require("../clientSrc/modules/relay/relay.js");
const accountExporter = require("./account.js");
const ledgerExporter = require("./ledger.js");
const moduleExporter = require("./module.js");
const entanglementExporter = require("./entanglement.js");
const transactionExporter = require("./transaction.js");
const storageExporter = require("./storage/storage.js");
const blockchainExporter = require("./blockchain.js");
const fileSystemInjectorExporter = require("./storage/fileSystemInjector.js");
const localStorageInjectorExporter = require("./storage/localStorageInjector.js");

module.exports = {
    /**
     * @return - The Seed Virtual Machine exporter to request the SVM
     */
    getSVMExporter : function() {
        return virtualMachineExporter;
    },
    /**
     * @return - The Scenario Test Exporter exporter to request unit tests be executed
     */
    getScenarioTestExporter : function() {
        return scenarioTestExporter;
    },
    /**
     * @return - Returns the Seed modules source file
     */
    getSeedExporter : function() {
        return seedExporter;
    },
    /**
     * @return - Returns the Relay modules source file
     */
    getRelayExporter : function() {
        return relayExporter;
    },
    /**
     * @return - Returns the Account Exporter for creating and fetching accounts
     */
    getAccountExporter : function() {
        return accountExporter;
    },
    /**
     * @return - The Ledger Exporter for reading from the ledger
     */
    getLedgerExporter : function() {
        return ledgerExporter;
    },
    /**
     * @return - The Module Exporter for creating new modules
     */
    getModuleExporter : function() {
        return moduleExporter;
    },
    getBlockchainExporter : function() {
        return blockchainExporter;
    },
    /**
     * @return - The Entanglement Exporter for adding to the entanglement, checking for cycles,
     * and reading from the entanglement
     */
    getEntanglementExporter : function() {
        return entanglementExporter;
    },
    /**
     * @return - The transaction exporter for creating new transactions with various constructors
     */
    getTransactionExporter : function() {
        return transactionExporter;
    },
    /**
     * @return - The Storage exporter for writing/reading blocks/transactions from storage
     */
    getStorageExporter : function() {
        return storageExporter;
    },
    /**
     * Subscribes for callback to be invoked whenever the given module has the given function validated
     * by the system.
     * 
     * @param moduleName - The name of the module were subscribing to
     * @param functionName - The name of the function were subscribing to
     * @param callback - The callback function being invoked
     * 
     * @return - The receipt regarding where the subscription was stored
     */
    subscribeToFunctionCallback : function(moduleName, functionName, callback) {
        return messagingExporter.subscribeToFunctionCallback(moduleName, functionName, callback);
    },
    /**
     * Subscribes for callback to be invoked whenever a given module or user data within the module
     * has internal data changed by a function.
     * 
     * When a user is passed in, the dataKey refers to a users data. If no user is passed in, it refers
     * to the module itself.
     * 
     * @param moduleName - The name of the module were subscribing to
     * @param dataKey - The variable name of the data we're subscribing to
     * @param callback - The callback function being invoked
     * @param user - (optional) The user which owns the data key
     * 
     * @return - The receipt regarding where the subscription was stored
     */
    subscribeToDataChange : function(moduleName, dataKey, callback, user) {
        return messagingExporter.subscribeToDataChange(moduleName, dataKey, callback, user);
    },
    /**
     * Unsubscribes callbacks from the messaging system to cleanup
     * 
     * @param moduleName - The name of the module we were subscribed to
     * @param funcNameOrDataKey - Either the function name or data key subscribed to
     * @param receipt - The receipt returned during subscription
     * @param optionalUser - (Optional) The user who owns the data key when subscribed
     * 
     */
    unsubscribe : function(moduleName, funcNameOrDataKey, receipt, optionalUser) {
        messagingExporter.unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser);
    },
    /**
     * Invokes callbacks for all subscribed callbacks whenever a function is invoked
     * 
     * @param moduleName - The name of the module that was invoked
     * @param functionName - The name of the function that was invoked
     * @param transactionHash - The transaction hash of the function that was just invoked
     * @param changeSet - The changes altered to the ledger through the invoking
     */
    invoke : function(moduleName, functionName, transactionHash, changeSet) {
        messagingExporter.invoke(moduleName, functionName, transactionHash, changeSet);
    },
    newStorage : function(iDatabaseInjector, useCompression) {
        return storageExporter.newStorage(iDatabaseInjector, useCompression);
    },
    newFileSystemInjector : function(dataFolderName) {
        if (!dataFolderName && typeof dataFolderName == "string") {
            dataFolderName = "data";
        }
        return fileSystemInjectorExporter.newFileSystemInjector(dataFolderName)
    },
    newLocalStorageInjector : function(localStorage) {
        if (!localStorage) {
            throw "LocalStorage must be passed into newLocalStorageInjector";
        }
        return localStorageInjectorExporter.localStorage;
    }
 }
