/****************
 * messaging.js *
 ****************
 * 
 * Handles callback messaging
 * 
 * Exported Functions:
 *      subscribeToFunctionCallback(moduleName, functionName, callback)
 *      subscribeToDataChange(moduleName, key, user?, callback)
 *      unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser?)
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
        let key = moduleName + functionName;
        let receipt = Math.random();
        if (functionCallbacks[key] == undefined) {
            functionCallbacks[key] = {};
        }
        functionCallbacks[key][receipt] = callback;
        return "F" + receipt;
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
     * Unsubscribes callbacks from the messaging system to cleanup
     * 
     * @param moduleName - The name of the module we were subscribed to
     * @param funcNameOrDataKey - Either the function name or data key subscribed to
     * @param receipt - The receipt returned during subscription
     * @param optionalUser - (Optional) The user who owns the data key when subscribed
     * 
     */
    unsubscribe : function(moduleName, funcNameOrDataKey, receipt, optionalUser) {
        let firstChar = receipt[0];
        receipt = receipt.substr(1);
        switch(firstChar) {
            case "F":
                functionCallbacks[moduleName + funcNameOrDataKey][receipt] = undefined;
            break;
            case "U":
                userDataCallbacks[moduleName + funcNameOrDataKey + optionalUser][receipt] = undefined;
            break;
                moduleDataCallbacks[moduleName + funcNameOrDataKey][receipt] = undefined;
            case "M":
            break;
        }
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
        // If we have a changeset and that changeset is an object
        if (changeSet && typeof changeSet == "object") {
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
            let mdKeys = Object.keys(changeSet.moduleData);
            for(let i = 0; i < mdKeys.length; i++) {
                let mdcKey = moduleName + mdKeys[i]; // SeedtotalSupply = "Seed" + "totalSupply"
                //If we have subscriptions for mdcKey, go through them and invoke
                if (moduleDataCallbacks[mdcKey] != undefined) {
                    let moduleDataKeys = Object.keys(moduleDataCallbacks[mdcKey]);
                    for(let j = 0; j < moduleDataKeys.length; j++) {
                        moduleDataCallbacks[mdcKey][moduleDataKeys[j]](message);
                    }
                }
            }
                    
            // We have user data callbacks to invoke on each user data change in changeSet
            let users = Object.keys(changeSet.userData);
            for(let i = 0; i < users.length; i++) {
                let user = users[i];
                let udKeys = Object.keys(changeSet.userData[user]);
                for(let j = 0; j < udKeys.length; j++) {
                    let udcKey = moduleName + udKeys[j] + user;
                    // If there are callbacks for this user data callback key
                    if (userDataCallbacks[udcKey] != undefined) {
                        let userDataKeys = Object.keys(userDataCallbacks[udcKey]);
                        for(let k = 0; k < userDataKeys.length; k++) {
                            userDataCallbacks[udcKey][userDataKeys[k]](message);
                        }
                    }
                }
            }
            
        }
    },
    getUnitTests : function() {
        return messagingUnitTests;
    }
}

const messagingUnitTests = {
    /**
     * Confirm the ability to subscribe for messages relating to module function callbacks being executed in the ledger machine.
     */
    messaging_subscribingForModuleFunctions : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm the ability to subscribe for messages relating to module data changes callbacks being executed in the ledger machine.
     */
    messaging_subscribingForModuleDataChanges : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm the ability to unsubscribe from messaging.
     */
    storage_unsubscribingFromMessaging : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Confirm, once unsubscribed, previously invokable callbacks stop being invoked.
     */
    storage_unsubscribingCleansUpCallbacksWithoutLeaks : function(test, log) {
        test.assert(false, "Test Not Implemented");
    }
}