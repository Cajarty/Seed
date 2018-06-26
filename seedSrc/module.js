/*************
 * module.js *
 *************
 * 
 * Exports a Module object used to represent a module in Seed. These modules contain their name, functions, hashes of their functions, and validation information.
 * 
 * Currently, the ledger is not complete, so the data is locally stored in the module itself. Later, this will be moved into the ledger.
 * 
 * Exported Functions:
 *      createModule()
 *          - Creates a new Module object
 */

let cryptoHelper = require("./cryptoHelper.js").newCryptoHelper();
let conformHelper = require("./helpers/conformHelper.js");
const ledgerExporter = require("./ledger.js");

module.exports = {
    /**
     * Creates a new module object
     * 
     * @param info - An option object containing the module name, initial state data, and initial user data
     *      {string} info.module - The name of the module being created
     *      {object} info.data - The initial state data of the module
     *      {object} info.initialUserData - The initial user data each user is given when added to the module
     * 
     * @return - Returns a new module object
     */
    createModule : function(info) {
        return new Module(info);
    } 
 }

 class Module {
    constructor(info) {
        this.functions = {}; // True function lookup
        this.functionHashes = {}; // Will overwrite previous name->hash mapping if functions share a name. Convenience lookup, not true lookup
        this.module = info.module;
        this.initialData = conformHelper.deepCopy(info.data);
        this.initialUserData = conformHelper.deepCopy(info.initialUserData);
        if (info.functions != undefined && typeof info.functions == "object") {
            this.addFunctions(info.functions);
        }
    }

    /**
     * Adds a new function to the given module
     * 
     * @param {object} info - An options object which has the function name and function data
     *      {string} info.name - The function name to be added
     *      {function} info.invoke - The invokable function
     */
    addFunction(info) {
        if (info.invoke != null && info.name != null) {
            let hash = cryptoHelper.sha256(info.name + JSON.stringify(info.invoke));
            if (this.functions[hash] == undefined) {
                this.functions[hash] = info;
                this.functionHashes[info.name] = hash;
            }
        }
    }

    /**
     * Takes an object of functions and adds them to the module, where each key is the function name and value is the invokable function
     * 
     * @param {object} funcs - Object of functions to add to the module
     */
    addFunctions(funcs) {
        let funcNames = Object.keys(funcs);
        for(let i = 0; i < funcNames.length; i++) {
            this.addFunction( { name : funcNames[i], invoke : funcs[funcNames[i]] } );
        }
    }

    /**
     * Adds a new user to this module, giving them a copy of the initial user data as their starting data
     * 
     * @param {string} user - The public addres of the user to add
     */
    addUser(user) {
        if (!this.doesUserExist(user)) {
            ledgerExporter.getLedger().addUserData(this.module, user);
        }
    }

    /**
     * Checks if the given user already exists in this module or not
     * 
     * @param {string} user - User to check if they already exist in the module
     * 
     * @return - Returns true of false for whether the user already exists in this modules data
     */
    doesUserExist(user) {
        return ledgerExporter.getLedger().getModuleData(this.module).userData[user] != undefined;
    }

    /**
     * Getter returning a function based on the function name
     * 
     * @param {string} name - Name of the function to get
     * 
     * @return - Returns an invokable function
     */
    getFunctionByName(name) {
        return this.getFunctionByHash(this.functionHashes[name]);
    }
    
    /**
     * Getter returning a function based on the function hash
     * 
     * @param {string} hash - Hash of the function to get
     * 
     * @return - Returns an invokable function
     */
    getFunctionByHash(hash) {
        return this.functions[hash];
    }

    /**
     * Checks if the claimed function invoke hash matches the real function hash
     * 
     * @param {*} info - Options object containing the function name
     * @param {*} invokeHash - The claimed function hash
     */
    isFunctionValid(info, invokeHash) {
        return this.hashFunction(info) == invokeHash;
    }

    /**
     * Gets a hash of this module's name
     * 
     * @return - Returns a SHA256 hash of the modules name
     */
    leanHash(info) {
        return cryptoHelper.sha256(this.module);
    }

    /**
     * Gets a full hash of this module's data including functions
     * 
     * @return - A full SHA256 hash of the module
     */
    fullHash() {
        return cryptoHelper.sha256(this.functions.toString() + this.module);
    }

    /**
     * Gets a lean hash of the functions name being checked
     * 
     * @param {*} info - Option object containing the function name to check
     * 
     * @return - A SHA256 hash of the functions name
     */
    leanHashFunction(info) {
        let hash = cryptoHelper.sha256(info.function);
        return hash;
    }

    /**
     * Gets a full hash of the functions being checked
     * 
     * @param {*} info - Option object containing the function name and invokable code to check
     * 
     * @return - A SHA256 hash of the function
     */
    fullHashFunction(info) {
        let func = this.getFunction(info);
        let hash = cryptoHelper.sha256(func.invoke.toString() + info.function);
        return hash;
    }

    /**
     * Checks if the claimed lean hash for a function matches the real info
     * 
     * @param {*} info - Option object with the function data
     * @param {*} leanInfoHash - The claimed hash to check
     * 
     * @return - True or false for whether the claim was valid
     */
    isFunctionLeanInfoCorrect(info, leanInfoHash) {
        return this.leanHashFunction(info) == leanInfoHash;
    }

    /**
     * Checks if the claimed lean hash for a module matches the real info
     * 
     * @param {*} info - Option object with the module data
     * @param {*} leanInfoHash - The claimed hash to check
     * 
     * @return - True or false for whether the claim was valid
     */
    isFunctionCorrect(info, fullHash) {
        return this.fullHashFunction(info) == fullHash;
    }
}