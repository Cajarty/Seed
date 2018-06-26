/****************
 * container.js *
 ****************
 * 
 * Exports a Container object which is accessed by the functions of modules to read data from the ledger. 
 * 
 * This is the "read only" object being used by the functions of modules.
 * 
 * This will access data from the ledger directly, however the blockchain side is not finished yet, so simulated data is being given temporarily.
 * 
 * Exported Functions:
 *      createContainer(moduleData, sender, args)
 *          - Creates a new Container on the senders behalf, taking in the module we are talking to and the arguments passed into the function
 */

 const ledgerExporter = require("../ledger.js");

module.exports = {
    /**
     * Creates a new Container on the senders behalf, taking in the module we are talking to and the arguments passed into the function
     * 
     * @arg {object} moduleName - The module name for which this belongs container primarily is created for
     * @arg {string} sender - The address of the sender of the function being ran/simulated
     * @arg {object} args - The arguments to be passed for the function being executed
     * 
     * @return {object} - A new Container object
     */
    createContainer: function(moduleName, sender, args) {
       return new Container(moduleName, sender, args);
    }
 }

class Container {
    constructor(moduleName, sender, args) {
        this.module = moduleName;
        this.args = args;
        this.sender = sender;
        this.cachedDatas = {};
    }

    /**
     * Loads and caches data from the ledger, making sure to get copies of the data so real ledger data
     * cannot be modified.
     * 
     * @param {*} moduleName - Name of module's data to copy & cache
     */
    loadData(moduleName) {
        if (this.cachedDatas[moduleName] == undefined) {
            this.cachedDatas[moduleName] = ledgerExporter.getLedger().getCopyOfModuleData(moduleName);
        }
    }

    /**
     * Gets the data for a given module. 
     * 
     * Will get the data from the ledger once the blockchain portion is complete. For now, just returns the one module data.
     * 
     * WARNING: Can give undefined values for undefined data in ledger. Unsafe.
     * 
     * @param {*} moduleName - The name of the module to get the data of.
     * 
     * @return - The data of the selected module
     */
    getModuleData(moduleName) {
        if (moduleName == undefined) {
            moduleName = this.moduleName;
        }
        this.loadData(moduleName);
        return this.cachedDatas[moduleName];
    }

    get(moduleName, keys) {
        let moduleData = this.getModuleData(moduleName);
        let value = 0;
        for(let i = 0; i < keys.length; i++) {

        }
    }

    /**
     * Gets the user data for a given user within a given module.
     * 
     * Will get the data from the ledger once the blockchain portion is complete. For now, just returns the one module data.
     * 
     * WARNING: Can give undefined values for undefined data in ledger. Unsafe.
     * 
     * @param {*} moduleName - The name of the module to get the data of.
     * @param {*} user - The users who's data we are grabbing
     * 
     * @return - The user data for a given module
     */
    getUserData(moduleName, user) {
        if (moduleName == undefined) {
            moduleName = this.moduleName;
        }
        this.loadData(moduleName);
        return this.cachedDatas[moduleName].userData[user];
    }
}