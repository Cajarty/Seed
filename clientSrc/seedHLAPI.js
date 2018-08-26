
/****************
 * seedHLAPI.js *
 ****************
 * 
 * Seed High Level API wrapper for Renderers. This wraps the communication with the Main process, using PromiseIPC objects
 * to communicate on their Renderer's behalf.
 * 
 * Each API call returns a promise that users can await or .then()/.throw(), allowing for async communication
 */

module.exports = {
    /**
     * Fetches a new SeedHLAPI object, constructing with the passed in promise renderer
     * 
     * @param ipcPromiseRenderer - A PromiseIPC object passed in by the associated Renderer
     */
    getSeedHLAPI : function(ipcPromiseRenderer) {
        return new SeedHLAPI(ipcPromiseRenderer);
    }
 }

 /**
  * Class which wraps communication with the Main process to access SeedHLAPI requests
  */
class SeedHLAPI {
    /**
     * Constructor for the object which stores the PromiseIPC
     * 
     * @param {*} ipcPromiseRenderer - A PromiseIPC object created by the Renderer
     */
    constructor(ipcPromiseRenderer) {
        this.ipcPromiseRenderer = ipcPromiseRenderer;
    }

    /**
     * Requests an account change based on new entropy
     * 
     * @param {*} accountEntropy - The entropy used to create the new account
     */
    switchAccount(accountEntropy) {
        return this.ipcPromiseRenderer.send("switchAccount", accountEntropy);
    }

    /**
     * Requests the active account account be fetched
     */
    getAccount() {
        return this.ipcPromiseRenderer.send("getAccount");
    }

    /**
     * Requests a transaction from storage based on its transaction hash
     * 
     * @param {*} transactionHash - The hash of the transaction to fetch
     */
    getTransaction(transactionHash) {
        return this.ipcPromiseRenderer.send("getTransaction", transactionHash);
    }
    
    /**
     * Requests the creation of a new transaction, which will instantly be invoked by the local virtual machine
     * 
     * @param {*} moduleName - The name of the module the function belongs to
     * @param {*} functionName - The function to invoke within the module
     * @param {*} args - The arguments to pass to the function while invoking it
     * @param {*} numOfValidations - The amount of transactions to validate
     */
    createTransaction(moduleName, functionName, args, numOfValidations) {
        if (!numOfValidations) {
            numOfValidations = 2;
        }
        return this.ipcPromiseRenderer.send("createTransaction", moduleName, functionName, args, numOfValidations);
    }

    /**
     * Requests that a given transaction be added to the virtual machine
     * 
     * NOTE: Only use this if it was externally created by the Low Level API. The above "createTransaction" function
     * in the High level API will already add it to the virtual machine upon creation
     * 
     * @param {*} transaction - The transaction to add
     */
    addTransaction(transaction) {
        return this.ipcPromiseRenderer.send("addTransaction", transaction);
    }

    /**
     * Requests a getter function be invoked in a module in order to fetch data
     * 
     * @param {*} moduleName - Name of the module which has the getter
     * @param {*} getterName - Name of the getter function to invoke
     * @param {*} args - Arguments to pass to the function while invoking it
     */
    getter(moduleName, getterName, args) {
        return this.ipcPromiseRenderer.send("getter", moduleName, getterName, args);
    }

    /**
     * Requests raw data be read from a module directly
     * 
     * NOTE: If there is no optional user passed in, module.dataKey is read. Otherwise, module.optionaluser.dataKey is read
     * 
     * @param {*} moduleName - Name of the module to read from
     * @param {*} dataKey - Name of the key in the data mapping to read
     * @param {*} optionalUser - The (optional) user who's data is being read
     */
    read(moduleName, dataKey, optionalUser) {
        return this.ipcPromiseRenderer.send("read", moduleName, dataKey, optionalUser);
    }

    /**
     * Requests to be notified when a given modules function is invoked by external transactions
     * 
     * @param {*} moduleName - Name of the module
     * @param {*} functionName - The function to listen for
     */
    subscribeToFunctionCallback(moduleName, functionName) {
        return this.ipcPromiseRenderer.send("subscribeToFunctionCallback", moduleName, functionName);
    }

    /**
     * Requests to be notified when a modules data changes
     * 
     * @param {*} moduleName - Name of the module
     * @param {*} dataKey - Data key to listen for (e.g. module.dataKey or module.user.dataKey)
     * @param {*} user - (Optional) user to listen for's changes
     */
    subscribeToDataChange(moduleName, dataKey, user) {
        return this.ipcPromiseRenderer.send("subscribeToDataChange", moduleName, dataKey, user);
    }

    /**
     * Requetsts to unsubscribe from listening for either function callbacks or data changes
     * 
     * @param {*} moduleName - Name of the module
     * @param {*} funcNameOrDataKey - EITHER the function OR dataKey being subscribed for
     * @param {*} receipt - Receipt received upon subscribing initially
     * @param {*} optionalUser - OPTIONAL user should it be a dataKey that was listening for a user
     */
    unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser) {
        return this.ipcPromiseRenderer.send("unsubscribe", moduleName, funcNameOrDataKey, receipt, optionalUser);
    }

    /**
     * Requests to add a module to the virtual machine
     * 
     * @param {*} newModule - Module to add to the virtual machine
     */
    addModule(newModule) {
        return this.ipcPromiseRenderer.send("addModule", newModule);
    }

    /**
     * Requests to create a new module
     * 
     * @param {*} moduleName - The name of the module
     * @param {*} initialStateData - The initial data state, e.g. { a : 10, b : 5 }
     * @param {*} initialUserStateData - Initial data state for each user, e.g. { balance : 0 }
     */
    createModule(moduleName, initialStateData, initialUserStateData) {
        return this.ipcPromiseRenderer.send("createModule", moduleName, initialStateData, initialUserStateData);
    }

    /**
     * Requests to get a module by name from the virtual machine
     * 
     * @param {*} moduleName - Name of the module to get
     */
    getModule(moduleName) {
        return this.ipcPromiseRenderer.send("getModule", moduleName);
    }
 }