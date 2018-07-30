/****************
 * messaging.js *
 ****************
 * 
 * Handles callback messaging
 * 
 * Exported Functions:
 *      subscribeToFunctionCallback(moduleName, functionName, callback)
 *      subscribeToDataChange(moduleName, key, user?, callback)
 *      unsubscribe()
 *      invoke(moduleName, functionName, transactionHash, changeSet)
 */

 // The message passed to callbacks
 class Message {
    constructor(moduleName, functionName, transactionHash, changeSet) {
        this.moduleName = moduleName;
        this.functionName = functionName;
        this.transactionHash = transactionHash;
        this.changeSet = changeSet;
    }
 }

 let functionCallbacks = {};
 let moduleDataCallbacks = {};
 let userDataCallbacks = {};

module.exports = {
    /**
     * 
     * 
     * @param a - 
     * 
     * @return - 
     */
    subscribeToFunctionCallback : function(moduleName, functionName, callback) {
        let key = moduleName + functionName;
        let receipt = Math.random();
        if (functionCallbacks[key] == undefined) {
            functionCallbacks[key] = {};
        }
        functionCallbacks[key][receipt] = callback;
        return "F" + receipt;
    },
    /**
     * 
     * 
     * @param a - 
     * 
     * @return - 
     */
    subscribeToDataChange : function(moduleName, dataKey, user) {
        let key = moduleName + dataKey;
        let receipt = Math.random();
        if (user == undefined) {
            // Module data callback
            if (moduleDataCallbacks[key] == undefined) {
                moduleDataCallbacks[key] = {};
            }
            moduleDataCallbacks[key][receipt] = callback;
            return "M" + receipt;
        } else {
            // user data callback
            key += user;
            if (userDataCallbacks[key] == undefined) {
                userDataCallbacks[key] = {};
            }
            userDataCallbacks[key][receipt] = callback;
            return "U" + receipt;
        }
    },
    /**
     * 
     * 
     * @param a - 
     * 
     * @return - 
     */
    unsubscribe : function(receipt) {

    },
    /**
     * 
     * 
     * @param a - 
     * 
     * @return - 
     */
    invoke : function(moduleName, functionName, transactionHash, changeSet) {
        let message = new Message(moduleName, functionName, transactionHash, changeSet);

        // We have function callbacks to invoke on this module+function change
        let fcKey = moduleName + functionName;
        if (functionCallbacks[fcKey] != undefined) {
            let funcKeys = Object.keys(functionCallbacks[fcKey]);
            for(let i = 0; i < funcKeys.length; i++) {
                functionCallbacks[fcKey][funcKeys[i]](message);
            }
        }

        // We have module data callbacks to invoke on this module+function change
        /*for(let i = 0; i < keys.length; i++) {
            if (moduleDataCallbacks[key] != undefined) {
                let moduleDataKeys = Object.keys(moduleDataCallbacks[key]);
            }
    
        }*/
        
        // We have user data callbacks to invoke on each user data change in changeSet

    }
}