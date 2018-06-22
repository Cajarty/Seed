/*********************
 * virtualMachine.js *
 *********************
 * 
 * Exports the virtual machine class which handles managing various modules, their functions, state data and validation.
 * 
 * This is not reliant on the Seed blockchain, but is instead fed info validated by the Seed blockchain. If its fed improper data, the functions will
 * return improper values, giving differing hashes and therefore be rejected by other users. For this reason, this virtual machine was built before
 * the blockchain portion is completed.
 * 
 * Users can use the virtual machine to simulate functions being run, and selectively apply the changes to simualtions they choose.
 * 
 * Exported Functions:
 *      createVirtualMachine()
 *          - Creates a new VirtualMachine object
 */

const changeContextExporter = require("./virtualMachine/changeContext.js");
const containerExporter = require("./virtualMachine/container.js");
const conformHelper = require("./helpers/conformHelper.js");
let cryptoHelper = require("./cryptoHelper.js").newCryptoHelper();

module.exports = {
    /**
     * Creates a new VirtualMachine object
     */
    createVirtualMachine: function() {
       return new VirtualMachine();
    }
 }

class VirtualMachine {
    constructor() {
        this.modules = {};
    }

    /**
     * Adds an externally created module to the virtual machine. 
     * The name of the module is hashed, used as the key lookup of the module.
     * 
     * @param {Module} newModule - An externally created Module object
     * @param {string} creator - The public address of the creator of the module
     */
    addModule(newModule, creator) {
        let hash = cryptoHelper.sha256(newModule.module);
        this.modules[hash] = newModule;
    }

    /**
     * Adds a Seed user to be a part of the module's userbase
     * 
     * @param {object} moduleInfo - An options object that contains the module name as a variable
     * @param {string} user - The public address of the user to add to the module
     */
    addUser(moduleInfo, user) {
        let moduleHash = cryptoHelper.sha256(moduleInfo.module);
        let moduleToAddTo = this.modules[moduleHash];
        moduleToAddTo.addUser(user);
    }

    /**
     * Gets A module stored in the virtual machine by module name.
     * Turns the name into a hash to find it in the key-value storage
     * 
     * @param {object} info - An options object that contains the module name as a variable
     *      {string} info.module - The module name
     * 
     * @return - The module found in the mapping
     */
    getModule(info) {
        let hash = cryptoHelper.sha256(info.module);
        return this.modules[hash];
    }

    /**
     * Gets a function stored in a module on the virtual machine.
     * 
     * @param {object} info - An option object that has the module and function to get stored as variables
     *      {string} info.module - The module name
     *      {string} info.function - The functions name
     * 
     * @return - The function found in the given module
     */
    getFunction(info) {
        let moduleToGet = this.getModule(info);
        return moduleToGet.getFunction(info);
    }

    /**
     * Simulates a function being executed with the current state of the virtual machine.
     * If the function is a state-modifying function, it returns a ChangeContext object regarding what
     * changes occured to the ledger. If the function was a getter, it returns the data fetched by the getter.
     * 
     * @param {object} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     *      {string} info.function - The functions name
     *      {object} info.args - The arguments to pass into the function
     *      {string} info.user - The address of the user who is the sender of the function
     * 
     * @return - ChangeContext if state-modifying function. Fetched data if getter function.
     */
    simulate(info) {
        let moduleToInvoke = this.getModule(info);
        if (info.function == "constructor" && Object.keys(moduleToInvoke.data.userData).length != 0) {
            throw "VirtualMachine::ERROR::simulate: Constructor can only be called if the module has not yet been used";
        }
        if (!moduleToInvoke.doesUserExist(info.user)) {
            this.addUser(info, info.user);
        }
        let moduleFunction = moduleToInvoke.getFunctionByName(info.function);
        let moduleFunctionArgs = conformHelper.getFunctionArgs(moduleFunction.invoke);
        let container = containerExporter.createContainer(moduleToInvoke, info.user, info.args);
        let result = undefined;

        if (moduleFunctionArgs.length == 2) { //State-modifying function
            let changeContext = changeContextExporter.createChangeContext(info.user);
            try {
                result = moduleFunction.invoke(container, changeContext); //Container is ledger, changeContext keeps track of changes
            } catch (err) {
                console.info("VirtualMachine::ERROR:: Failed to run state-modifying function", err);
            }
        } else if (moduleFunctionArgs.length == 1) { //Read-Only Getter
            try {
                result = moduleFunction.invoke(container); //Container is ledger
            } catch (err) {
                console.info("VirtualMachine::ERROR:: Failed to run read-nly getter", err);
            }
        } else {
            throw "VirtualMachine::ERROR::simulate: Invalid number of parameters for a module function";
        }
        return result;
    }

    /**
     * Modifies the state of the virtual machine by the changes found in the chaneContext object
     * 
     * @param {object} info - An options object that has the module
     *      {string} info.module - The name of the module being modified
     * @param {ChangeContext} changeContext - A ChangeContext of changes to apply to the state of the virtual machine
     */
    applyChangeContext(info, changeContext) {
        let users = Object.keys(changeContext.userData);
        let moduleDataKeys = Object.keys(changeContext.moduleData);

        if (users.length == 0 && moduleDataKeys.length == 0) {
            console.info("VirtualMachine::ERROR::applyingChangeContext: Cannot apply no-changes");
            return;
        }

        let moduleToUpdate = this.getModule(info);
        for(let i = 0; i < moduleDataKeys.length; i++) {
            let key = moduleDataKeys[i];
            moduleToUpdate.data[key] += changeContext.moduleData[key]; //Only works cause number. Should check if number
        }

        for(let i = 0; i < users.length; i++) {
            let user = users[i];
            let userDataKeys = Object.keys(changeContext.userData[user]);

            if (moduleToUpdate.data.userData[user] == undefined) {
                this.addUser(info, user);
            }

            for(let j = 0; j < userDataKeys.length; j++) {
                let key = userDataKeys[j];
                let value = changeContext.userData[user][key];
                switch(typeof value) {
                    case "number":
                        // Number changes are relative
                        console.info("Change", user, key, changeContext.userData[user][key]);
                        moduleToUpdate.data["userData"][user][key] += changeContext.userData[user][key];
                        break;
                    case "string":
                        // Strings are absolute
                        moduleToUpdate.data["userData"][user][key] = changeContext.userData[user][key]; 
                        break;
                    case "object":
                        // Objets are absolute and Object.assigned over
                        let innerKeys = Object.keys(changeContext.userData[user][key]);
                        for(let k = 0; k < innerKeys.length; k++) {
                            if (moduleToUpdate.data["userData"][user][key][innerKeys[k]] == undefined || typeof moduleToUpdate.data["userData"][user][key][innerKeys[k]] != "number") {
                                moduleToUpdate.data["userData"][user][key][innerKeys[k]] = changeContext.userData[user][key][innerKeys[k]];
                            } else {
                                moduleToUpdate.data["userData"][user][key][innerKeys[k]] += changeContext.userData[user][key][innerKeys[k]];
                            }
                        }
                        //moduleToUpdate.data["userData"][user][key] = Object.assign({}, changeContext.userData[user][key] );
                        break;
                }
            }
        }
    }

    /**
     * Simulates a function invocation in the virtual machine, and, if the state was modified, applies the changes to the virtual machine.
     * 
     * @param {object} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     *      {string} info.function - The functions name
     *      {object} info.args - The arguments to pass into the function
     *      {string} info.user - The address of the user who is the sender of the function
     * 
     * @return - ChangeContext if state-modifying function. Fetched data if getter function.
     */
    invoke(info) {
        let result = this.simulate(info);
        if (result != undefined && conformHelper.doesFullyConform(result, { moduleData : "object", userData : "object" })) {
            this.applyChangeContext(info, result);
        }
        return result;
    }

    /**
     * Validation function wrapper confirming that a users claimed function that was executed was valid
     * 
     * @param {*} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     *      {string} info.function - The function name
     * @param {*} invokeHash - The claimed hash to compare againsts
     */
    isFunctionLeanInfoCorrect(info, invokeHash) {
        let module = this.getModule(info);
        if (module != undefined) {
            return module.isFunctionLeanInfoCorrect(info, invokeHash);
        } else {
            return false;
        }
    }

    /**
     * Validation function wrapper confirming that a users claimed function that was executed was valid
     * 
     * @param {*} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     *      {string} info.function - The function name being validated
     *      {function} info.invoke - The function being validated
     * @param {*} invokeHash - The claimed hash to compare againsts
     */
    isFunctionCorrect(info, invokeHash) {
        let module = this.getModule(info);
        if (module != undefined) {
            return module.isFunctionCorrect(info, invokeHash);
        } else {
            console.log("Failed to load module");
            return false;
        }
    }

    /**
     * Wrapper function getting the lean hash of a module's name
     * 
     * @param {*} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     */
    leanHashModule(info) {
        let module = this.getModule(info);
        return module.leanHash(info);
    }

    /**
     * Wrapper function getting the full hash of an entire module, including the hashes of all functions
     * 
     * @param {*} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     */
    fullHashModule() {
        let module = this.getModule(info);
        return module.fullHash(info);
    }

    /**
     * Wrapper function getting the lean hash of a module's name
     * 
     * @param {*} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     */
    leanHashFunction(info) {
        let module = this.getModule(info);
        return module.leanHashFunction(info);
    }

    /**
     * Wrapper function getting the full hash of a function
     * 
     * @param {*} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     *      {string} info.function - The name of the function
     */
    fullHashFunction(info) {
        let module = this.getModule(info);
        return module.fullHashFunction(info);
    }
}

