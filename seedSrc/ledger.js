
const conformHelper = require("./helpers/conformHelper.js");
const virtualMachineExporter = require("./virtualMachine.js");
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
            console.info("VirtualMachine::ERROR::applyingChangeContext: Cannot apply no-changes");
            return;
        }

        let moduleDataToUpdate = this.getModuleData(moduleName);
        for(let i = 0; i < moduleDataKeys.length; i++) {
            let key = moduleDataKeys[i];
            moduleDataToUpdate[key] += changeContext.moduleData[key]; //Only works cause number. Should check if number
        }

        for(let i = 0; i < users.length; i++) {
            let user = users[i];
            let userDataKeys = Object.keys(changeContext.userData[user]);

            if (moduleDataToUpdate.userData[user] == undefined) {
                this.addUserData(moduleName, user);
            }

            for(let j = 0; j < userDataKeys.length; j++) {
                let key = userDataKeys[j];
                let value = changeContext.userData[user][key];
                switch(typeof value) {
                    case "number":
                        // Number changes are relative
                        moduleDataToUpdate["userData"][user][key] += changeContext.userData[user][key];
                        break;
                    case "string":
                        // Strings are absolute
                        moduleDataToUpdate["userData"][user][key] = changeContext.userData[user][key]; 
                        break;
                    case "object":
                        // Objets are absolute and Object.assigned over
                        let innerKeys = Object.keys(changeContext.userData[user][key]);
                        for(let k = 0; k < innerKeys.length; k++) {
                            let userDataAtKey = moduleDataToUpdate["userData"][user][key];
                            if (userDataAtKey[innerKeys[k]] == undefined || typeof userDataAtKey[innerKeys[k]] != "number") {
                                userDataAtKey[innerKeys[k]] = changeContext.userData[user][key][innerKeys[k]];
                            } else {
                                userDataAtKey[innerKeys[k]] += changeContext.userData[user][key][innerKeys[k]];
                            }
                        }
                        //moduleToUpdate.data["userData"][user][key] = Object.assign({}, changeContext.userData[user][key] );
                        break;
                }
            }
        }
    }

    revertChanges(changeSet) {

    }
 }