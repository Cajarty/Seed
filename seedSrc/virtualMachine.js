const changeContextExporter = require("./virtualMachine/changeContext.js");
const containerExporter = require("./virtualMachine/container.js");
const conformHelper = require("./helpers/conformHelper.js");
let cryptoHelper = require("./cryptoHelper.js").newCryptoHelper();

module.exports = {
    createVirtualMachine: function() {
       return new VirtualMachine();
    }
 }

class VirtualMachine {
    constructor() {
        this.modules = {};
    }

    addModule(newModule, creator) {
        let hash = cryptoHelper.sha256(newModule.module);
        this.modules[hash] = newModule;
    }

    addUser(moduleInfo, user) {
        let moduleHash = cryptoHelper.sha256(moduleInfo.module);
        let moduleToAddTo = this.modules[moduleHash];
        moduleToAddTo.addUser(user);
    }

    getModule(info) {
        let hash = cryptoHelper.sha256(info.module);
        return this.modules[hash];
    }

    getFunction(info) {
        let moduleToGet = this.getModule(info);
        return moduleToGet.getFunction(info);
    }

    invoke(info) {
        let result = this.simulate(info);
        if (result != undefined && conformHelper.doesFullyConform(result, { moduleData : "object", userData : "object" })) {
            this.applyChangeContext(info, result);
        }
        return result;
    }

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

    isFunctionLeanInfoCorrect(info, invokeHash) {
        let module = this.getModule(info);
        if (module != null) {
            return module.isFunctionLeanInfoCorrect(info, invokeHash);
        } else {
            return false;
        }
    }

    isFunctionCorrect(info, invokeHash) {
        console.log(info);
        let module = this.getModule(info);
        if (module != null) {
            return module.isFunctionCorrect(info, invokeHash);
        } else {
            console.log("Failed to load module");
            return false;
        }
    }

    leanHashModule(info) {
        let module = this.getModule(info);
        return module.leanHash(info);
    }

    fullhashModule() {
        let module = this.getModule(info);
        return module.fullHash(info);
    }

    leanHashFunction(info) {
        let module = this.getModule(info);
        return module.leanHashFunction(info);
    }

    fullHashFunction(info) {
        let module = this.getModule(info);
        return module.fullHashFunction(info);
    }
}

