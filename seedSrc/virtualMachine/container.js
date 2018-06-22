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

module.exports = {
    /**
     * Creates a new Container on the senders behalf, taking in the module we are talking to and the arguments passed into the function
     * 
     * @arg {object} moduleData - JSON object of data for the module being read from
     * @arg {string} sender - The address of the sender of the function being ran/simulated
     * @arg {object} args - The arguments to be passed for the function being executed
     * 
     * @return {object} - A new Container object
     */
    createContainer: function(moduleData, sender, args) {
       return new Container(moduleData, sender, args);
    }
 }

class Container {
    constructor(moduleData, sender, args) {
        this.module = moduleData;
        this.args = args;
        this.sender = sender;
    }

    /**
     * Gets the data for a given module. 
     * 
     * Will get the data from the ledger once the blockchain portion is complete. For now, just returns the one module data
     * 
     * @param {*} moduleName - The name of the module to get the data of.
     * 
     * @return - The data of the selected module
     */
    getModuleData(moduleName) {
        return this.module.data;
    }

    /**
     * Gets the user data for a given user within a given module.
     * 
     * Will get the data from the ledger once the blockchain portion is complete. For now, just returns the one module data.
     * 
     * @param {*} moduleName - The name of the module to get the data of.
     * @param {*} user - The users who's data we are grabbing
     * 
     * @return - The user data for a given module
     */
    getUserData(moduleName, user) {
        return this.module.data["userData"][user];
    }
}