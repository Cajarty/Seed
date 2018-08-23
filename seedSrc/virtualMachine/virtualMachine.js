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
 *      getVirtualMachine()
 *          - Creates a new VirtualMachine object
 */



let virtualMachine = null;

module.exports = {
    /**
     * Creates a new VirtualMachine object
     */
    getVirtualMachine: function() {
        if (virtualMachine == null) {
            console.info("New VM");
            virtualMachine = new VirtualMachine();
        }
        return virtualMachine;
    }
}

const changeContextExporter = require("./changeContext.js");
const containerExporter = require("./container.js");
const conformHelper = require("../helpers/conformHelper.js");
const ledgerExporter = require("../ledger.js");
const entanglement = require("../entanglement.js");
const transactionExporter = require("../transaction.js");
const messagingExporter = require("../messaging.js");

class VirtualMachine {
    
    constructor() {
        this.modules = {};
        this.ERROR = {
            FailedToChangeState : "ERROR::FAILED TO CHANGE STATE"
        }
    }

    /**
     * Adds an externally created module to the virtual machine. 
     * The name of the module is used as the module lookup.
     * Creates the module data in the ledger
     * 
     * @param {Module} newModule - An externally created Module object
     */
    addModule(newModule) {
        this.modules[newModule.module] = newModule;
        ledgerExporter.getLedger().addModuleData(newModule.module, newModule.initialData, newModule.initialUserData);
    }

    /**
     * Adds a Seed user to be a part of the module's userbase in the ledger
     * 
     * @param {object} moduleInfo - An options object that contains the module name as a variable
     * @param {string} user - The public address of the user to add to the module
     */
    addUser(moduleInfo, user) {
        ledgerExporter.getLedger().addUserData(moduleInfo.module, user);
    }

    /**
     * Gets A module stored in the virtual machine by module name.
     * Uses module name as look-up in the key-value storage
     * 
     * @param {object} info - An options object that contains the module name as a variable
     *      {string} info.module - The module name
     * 
     * @return - The module found in the mapping
     */
    getModule(info) {
        return this.modules[info.module];
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
        return this.getModule(info).getFunctionByName(info.function);
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
     *      {array} info.txHashes - The hashes of the transaction hashes validated
     * 
     * @return - ChangeContext if state-modifying function. Fetched data if getter function.
     */
    simulate(info) {
        let moduleToInvoke = this.getModule(info);
        let moduleDataToInvoke = ledgerExporter.getLedger().getModuleData(info.module);
        //If the user simulating this does not exist, add them to our ledger
        console.info("SIMULATE", moduleToInvoke, this);
        if (!moduleToInvoke.doesUserExist(info.user)) {
            this.addUser(info, info.user);
        }
        let moduleFunction = moduleToInvoke.getFunctionByName(info.function);
        let moduleFunctionArgs = conformHelper.getFunctionArgs(moduleFunction.invoke);
        let container = containerExporter.createContainer(moduleToInvoke.module, info.user, info.args, info.txHashes);
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
                console.info("VirtualMachine::ERROR:: Failed to run read-only getter", err);
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
        ledgerExporter.getLedger().applyChanges(info.module, changeContext);
    }

    /**
     * Simulates a function invocation in the virtual machine, and, if the state was modified, applies the changes to the virtual machine.
     * 
     * @param {object} info - An options object that has the module, function and arguments stored for function execution
     *      {string} info.module - The module name
     *      {string} info.function - The functions name
     *      {object} info.args - The arguments to pass into the function
     *      {string} info.user - The address of the user who is the sender of the function
     *      {array} info.txHashes - The hashes of the transaction hashes validated
     * 
     * @return - ChangeContext if state-modifying function. Fetched data if getter function.
     */
    invoke(info, resultIfSimulate) {
        let result = resultIfSimulate == undefined ? this.simulate(info) : JSON.parse(resultIfSimulate);
        // TODO: change doesFullyConform to somehow compare it to a module.functionSchema[info.function] to constraint to data types, so functions can ask for certain types
        if (result != undefined && conformHelper.doesFullyConform(result, { moduleData : "object", userData : "object" })) {
            let users = Object.keys(result.userData);
            let moduleDataKeys = Object.keys(result.moduleData);
            if (users.length != 0 || moduleDataKeys.length != 0) {
                this.applyChangeContext(info, result);
            } else {
                return this.ERROR.FailedToChangeState;
            }
        }
        messagingExporter.invoke(info.module, info.function, "txHash", result);
        return result;
    }

    /**
     * Creates a transaction
     * 
     * First it determines transactions that need to be validated, validates them, simulates our code execution, wraps it into a transaction,
     * signs it, "receives" our new transaction for interpreting, and then return is.
     * 
     * @param {*} account - The account used to create the transactiona nd sign it
     * @param {*} mod  - The name of the module who's code we are executing
     * @param {*} func - The name of the function on the module who's code we are executing
     * @param {*} args - The arguments passed into the function during execution
     * @param {*} transactionsToValidate - The amount fo transactions we will validate as work
     * 
     * @return - A newly created transaction, or null if transaction creation failed
     */
    createTransaction(account, mod, func, args, transactionsToValidate) {
        let tips = entanglement.getTipsToValidate(account.publicKey, transactionsToValidate);
        console.info("createTransaction", account.publicKey, mod, func, args, transactionsToValidate);
        let localSimulation = this.simulate({ module : mod, function : func, args : args, user : account.publicKey, txHashes : tips });
        if (localSimulation.didChange()) {
            let work = this.doWork(account, tips);
            let transaction = transactionExporter.createNewTransaction(account.publicKey, { moduleName : mod, functionName : func, args : args, changeSet : JSON.stringify(localSimulation) }, work);
            transaction.signature = account.sign(transaction.transactionHash);
            this.incomingTransaction(transaction);
            return transaction;
        } else {
            console.info("FAILED", localSimulation);
            return null;
        }
    }

    /**
     * Receives an incoming transaction and, if it is Proper and well formed, it tries to add it to the entanglement
     * 
     * @param {*} transaction - The transaction to attempt to receive
     */
    incomingTransaction(transaction) {
        // If its a proper, formed transaction
        if (transactionExporter.isTransactionProper(transaction)) {
            // We add it to the entanglement
            entanglement.tryAddTransaction(transaction);
        } else {
            console.info("IncomingTransaction::Malformed", transaction);
        }
    }

    /**
     * Takes an account and an array of tips to validate. It then validates them by doing work.
     * 
     * @param {*} account - The account used to sign our work
     * @param {*} tips - The transactions that we want to validate
     * 
     * @return - An array of validation work
     */
    doWork(account, tips) {
        let result = [];
        for(let i = 0; i < tips.length; i++) {
            let transaction = tips[i];
            let localSimulation = this.simulate({ module : transaction.execution.moduleName, function : transaction.execution.functionName, args : transaction.execution.args, user : transaction.sender, txHashes : transaction.getValidatedTXHashes() });
            let localSimAsString = JSON.stringify(localSimulation);
            if (localSimAsString == transaction.execution.changeSet) {
                let moduleUsed = this.getModule({ module : transaction.execution.moduleName });
                
                if (moduleUsed != undefined) {
                    let functionChecksum = moduleUsed.functionChecksums[transaction.execution.functionName];
                    let moduleChecksum = moduleUsed.moduleChecksum;
                    result.push( { transactionHash : transaction.transactionHash, moduleChecksum : moduleChecksum, functionChecksum : functionChecksum, changeSet : localSimAsString });
                } else {
                    throw new Error("Failed to get module");
                }
            } else {
                console.info("Simulated", localSimAsString, "Actual", transaction.execution.changeSet);
                throw new Error("Failed to simulate tip");
            }
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

