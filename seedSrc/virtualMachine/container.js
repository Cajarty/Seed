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
 const randomExporter = require("../helpers/random.js");

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
    constructor(moduleName, sender, args, txHashes) {
        this.moduleName = moduleName;
        this.args = args;
        this.sender = sender;
        this.cachedDatas = {};
        this.txHashes = txHashes;
    }

    /*  
        #############################
        ### Public User Functions ###
        ############################# 
    */

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
        this.ensureDataLoaded(moduleName);
        return this.cachedDatas[moduleName];
    }

    /**
     * Gets the user data for a given user within a given module.
     * 
     * Will get the data from the ledger once the blockchain portion is complete. For now, just returns the one module data.
     * 
     * WARNING: Can give undefined values for undefined data in ledger. Unsafe.
     * 
     * @param {*} user - The users who's data we are grabbing
     * @param {*} moduleName - The name of the module to get the data of.
     * 
     * @return - The user data for a given module
     */
    getUserData(user, moduleName) {
        if (moduleName == undefined) {
            moduleName = this.moduleName;
        }
        if (user == undefined) {
            user = this.sender;
        }
        this.ensureDataLoaded(moduleName);
        return this.cachedDatas[moduleName].userData[user];
    }

    /**
     * Wrapper for getUserData which forces it to be called for the senders data
     * 
     * WARNING: Can give undefined values for undefined data in ledger. Unsafe.
     * 
     * @return - The sender's user data for the current active module
     */
    getSenderData() {
        return this.getUserData(this.sender, this.moduleName);
    }

    /**
     * Returns a pseudo-random value between 1 and 2^32 - 2.
     * 
     * WARNING: Can be controlled by the user to an extent
     * 
     * @return - A pseudo-random integer value
     */
    getRandomInt(min, max) {
        this.ensureRandomLoaded();
        return this.random.nextInt();
    }

    /**
     * Returns a pseudo-random floating point number in range [0, 1).
     * 
     * WARNING: Can be controlled by the user to an extent
     * 
     * @return - A pseudo-random integer value
     */
    getRandomFloat() {
        this.ensureRandomLoaded();
        this.random.nextFloat();
    }

    /*  
        ###############################
        ### Private Local Functions ###
        ###############################
    */

    /**
     * Loads and caches a Random object, which passes a seed given by the virtual machine.
     * 
     * WARNING: Random is deterministic and may be controllable by the user to an extent. 
     */
    ensureRandomLoaded() {
        if (this.random == undefined) {
            this.random = randomExporter.createRandom(randomExporter.generateSeedFromHashes(this.txHashes));
        }
    }

    /**
     * Loads and caches data from the ledger, making sure to get copies of the data so real ledger data
     * cannot be modified.
     * 
     * @param {*} moduleName - Name of module's data to copy & cache
     */
    ensureDataLoaded(moduleName) {
        if (this.cachedDatas[moduleName] == undefined) {
            this.cachedDatas[moduleName] = ledgerExporter.getLedger().getCopyOfModuleData(moduleName);
        }
    }
}