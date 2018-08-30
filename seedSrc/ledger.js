
const conformHelper = require("./helpers/conformHelper.js");
const virtualMachineExporter = require("./virtualMachine/virtualMachine.js");
const squasherExporter = require("./squasher.js");
let ledger = null;

module.exports = {
    getLedger : function() {
        if (ledger == null) {
            ledger = new Ledger();
        }
        return ledger;
    }
 }

 class Ledger {
    constructor() {
        this.moduleData = {};
        this.moduleInitialUserDatas = {};
    }

    addModuleData(moduleName, initialData, initialUserData) {
        this.moduleData[moduleName] = conformHelper.deepCopy(initialData);
        this.moduleData[moduleName].userData = {};
        this.moduleInitialUserDatas[moduleName] = conformHelper.deepCopy(initialUserData);
    }

    addUserData(moduleName, user) {
        if (this.moduleData[moduleName].userData[user] == undefined) {
            this.moduleData[moduleName].userData[user] = conformHelper.deepCopy(this.moduleInitialUserDatas[moduleName]);
        }
    }

    getCopyOfModuleData(moduleName) {
        return conformHelper.deepCopy(this.moduleData[moduleName]);
    }

    getModuleData(moduleName) {
        return this.moduleData[moduleName];
    }

    getUserData(moduleName, user) {
        return this.moduleData[moduleName].userData[userData];
    }
    
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

    revertChanges(changeSet) {

    }
 }