/*************
 * ledger.js *
 *************
 * 
 * The active Ledger storing the current state of everything. All modules have their data stored here,
 * as well as the data of each user for each module. The ledger also knows what default data to apply for
 * each user upon the first time they use a module.
 * 
 * Currently lacks reading/writing state and starts fresh on every run.
 */

const conformHelper = require("./helpers/conformHelper.js");
const virtualMachineExporter = require("./virtualMachine/virtualMachine.js");
const squasherExporter = require("./squasher.js");
let ledger = null;

module.exports = {
    /**
     * Returns the active ledger, creating one if none exists
     */
    getLedger : function() {
        if (ledger == null) {
            ledger = new Ledger();
        }
        return ledger;
    }
 }

 /**
  * Class containing the logic for a ledger and how to use it
  */
 class Ledger {
     /**
      * Constructs the ledger, defaulting the moduleData and moduleInitialUserDatas variables to empty objects.
      */
    constructor() {
        this.moduleData = {};
        this.moduleInitialUserDatas = {};
    }

    /**
     * Adds a module to the ledger, so the ledger knows how the module wants its data to be formed
     * 
     * @param {*} moduleName - Name of the module being stored
     * @param {*} initialData - Initial default state of the modules data
     * @param {*} initialUserData - Initial default state of each user for the module
     */
    addModuleData(moduleName, initialData, initialUserData) {
        this.moduleData[moduleName] = conformHelper.deepCopy(initialData);
        this.moduleData[moduleName].userData = {};
        this.moduleInitialUserDatas[moduleName] = conformHelper.deepCopy(initialUserData);
    }

    /**
     * Adds a user to a module, creating a copy of the initialUserData for that user
     * 
     * @param {*} moduleName - Name of the module to store into
     * @param {*} user - Public address of the user to add to the module
     */
    addUserData(moduleName, user) {
        if (this.moduleData[moduleName].userData[user] == undefined) {
            this.moduleData[moduleName].userData[user] = conformHelper.deepCopy(this.moduleInitialUserDatas[moduleName]);
        }
    }

    /**
     * Fetches the module data for a given module, however returns a deep copy.
     * Using this method allows users to modify the returned data without modifying the state of the ledger
     * 
     * @param {*} moduleName - The name of the module who's data is being fetched
     */
    getCopyOfModuleData(moduleName) {
        return conformHelper.deepCopy(this.moduleData[moduleName]);
    }

    /**
     * Fetches the module data for a given module by reference.
     * 
     * WARNING: Using this method allows users to modify the returned data directly. This is dangerous
     * 
     * @param {*} moduleName - The name of the module who's data is being fetched
     */
    getModuleData(moduleName) {
        return this.moduleData[moduleName];
    }

    /**
     * Fetches a users data inside a given module by reference
     * 
     * @param {*} moduleName - The name of the module to fetch from
     * @param {*} user - Public address of the user who's data is being fetched
     */
    getUserData(moduleName, user) {
        return this.moduleData[moduleName].userData[userData];
    }
    
    /**
     * Applys the changes from a ChangeContext object onto the ledgers data.
     * This uses the Squasher's Squash export to handle the squashing of data
     * 
     * @param {*} moduleName - Name of the module who was modified
     * @param {*} changeContext - The ChangeContext of data to apply to the ledger
     */
    applyChanges(moduleName, changeContext) {
        let users = Object.keys(changeContext.userData);
        let moduleDataKeys = Object.keys(changeContext.moduleData);

        if (users.length == 0 && moduleDataKeys.length == 0) {
            console.info("Ledger::ERROR::applyChanges: Cannot apply no-changes");
            return;
        }

        // Add initial user data if a new one is being used
        let moduleDataToUpdate = this.getModuleData(moduleName);
        for(let i = 0; i < users.length; i++) {
            if (moduleDataToUpdate.userData[users[i]] == undefined) {
                this.addUserData(moduleName, users[i]);
            }
        }

        // Old module data we are overwriting
        let oldData = Object.assign(this.moduleData);

        // Store the incoming changeContext into an object which follows the same schema
        let newData = {}
        newData[moduleName] = changeContext.moduleData;
        newData[moduleName]["userData"] = changeContext.userData;

        //Squash and save
        this.moduleData = squasherExporter.squash(oldData, newData);
    }
 }