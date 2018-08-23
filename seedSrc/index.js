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

module.exports = {
    getSVMExporter : function() {
        return virtualMachineExporter;
    },
    getScenarioTestExporter : function() {
        return scenarioTestExporter;
    },
    getSeedExporter : function() {
        return seedExporter;
    },
    getRelayExporter : function() {
        return relayExporter;
    },
    getAccountExporter : function() {
        return accountExporter;
    },
    getLedgerExporter : function() {
        return ledgerExporter;
    },
    getModuleExporter : function() {
        return moduleExporter;
    },
    getEntanglementExporter : function() {
        return entanglementExporter;
    },
    getTransactionExporter : function() {
        return transactionExporter;
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
    }
 }
