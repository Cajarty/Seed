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
        if (conformHelper.doesFullyConform(result, { moduleData : "object", userData : "object" })) {
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

        if (moduleFunctionArgs.length == 2) { //State-modifying function
            let changeContext = changeContextExporter.createChangeContext(info.user);
            return moduleFunction.invoke(container, changeContext); //Container is ledger, changeContext keeps track of changes
        } else if (moduleFunctionArgs.length == 1) { //Read-Only Getter
            return moduleFunction.invoke(container); //Container is ledger
        } else {
            throw "VirtualMachine::ERROR::simulate: Invalid number of parameters for a module function";
        }
    }

    applyChangeContext(info, changeContext) {
        //console.info("VM::applyChangeContext[changeContext]",changeContext);
        let moduleToUpdate = this.getModule(info);
        let moduleDataKeys = Object.keys(changeContext.moduleData);
        for(let i = 0; i < moduleDataKeys.length; i++) {
            let key = moduleDataKeys[i];
            moduleToUpdate.data[key] += changeContext.moduleData[key]; //Only works cause number. Should check if number
        }

        let users = Object.keys(changeContext.userData);
        for(let i = 0; i < users.length; i++) {
            let user = users[i];
            let userDataKeys = Object.keys(changeContext.userData[user]);

            for(let j = 0; j < userDataKeys.length; j++) {
                let key = userDataKeys[i];
                let value = changeContext.userData[user][key];
                switch(typeof value) {
                    case "number":
                        // Number changes are relative
                        moduleToUpdate.data["userData"][user][key] += changeContext.userData[user][key];
                        break;
                    case "string":
                        // Strings are absolute
                        moduleToUpdate.data["userData"][user][key] = changeContext.userData[user][key]; 
                        break;
                    case "object":
                        // Objets are absolute and Object.assigned over
                        moduleToUpdate.data["userData"][user][key] = Object.assign({}, changeContext.userData[user][key] );
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

