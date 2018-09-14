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
const unitTestingExporter = require("./tests/unitTesting.js");

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
     * @return - The Unit Testing exporter for making unit tests
     */
    getUnitTestingExporter : function() {
        return unitTestingExporter;
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
    /**
     * Creates and assigns a new storage object, passing in an instantiated iDatabaseInjector compliant object, and a flag
     * regarding whether the data is to be compressed or not when saving/loading
     * 
     * @param {*} iDatabaseInjector - An object which has the same functions as the iDatabaseInjector pattern
     * @param {*} useCompression - A flag regarding compressing data or not
     */
    newStorage : function(iDatabaseInjector, useCompression) {
        return storageExporter.newStorage(iDatabaseInjector, useCompression);
    },
    /**
     * @return - Returns the instantiated storage object
     */
    getStorage : function() {
        return storageExporter.getStorage();
    },
    /**
     * Creates an implementation of the Database Injector (iDatabaseInjector) interface which reads/writes
     * transactions and blocks through the local file system.
     * 
     * NOTE: Not all environments have file system access. This is intended for "Electron" DApps, however
     * other NodeJS environments with file storage access should work.
     * 
     * @param dataFolderName - The name of the folder to store data in. Defaults to "data"
     * 
     * @return - A new FileSystemInjector object
     */
    newFileSystemInjector : function(baseDirectory, dataFolderName) {
        if (!baseDirectory) {
            throw "baseDirectory must be passed into newFileSystemInjector";
        }
        if (!dataFolderName || typeof dataFolderName != "string") {
            dataFolderName = "data";
        }
        return fileSystemInjectorExporter.newFileSystemInjector(baseDirectory, dataFolderName)
    },
    /**
     * Creates an implementation of the Database Injector (iDatabaseInjector) interface which reads/writes
     * transactions and blocks through the LocalStorage used in web browsers
     * 
     * NOTE: Not all environments have LocalStorage access. This is intended for "Webapp" DApps, however
     * other JavaScript environments with LocalStorage access can access this
     * 
     * @param localStorage - The LocalStorage object belonging to your environment
     * 
     * @return - A new LocalStorageInjector object
     */
    newLocalStorageInjector : function(localStorage) {
        if (!localStorage) {
            throw "LocalStorage must be passed into newLocalStorageInjector";
        }
        return localStorageInjectorExporter.newLocalStorageInjector(localStorage);
    }
 }
