let cryptoHelper = require("./cryptography.js").newCryptographyHelper();

module.exports = {
    createVirtualMachine: function() {
       return new VirtualMachine();
    },
    createModule : function(info) {
        return new Module(info);
    } 
 }

 class Module {
    constructor(info) {
        this.functions = {};
        this.module = info.module;
        this.version = info.version;
        this.data = info.data;
        this.data["userData"] = {};
        this.initialUserData = info.initialUserData;
    }

    addFunction(func) {
        if (func.invoke != null && func.name != null && func.version != null) {
            let version = func.version == null ? info.version : func.version;
            let hash = cryptoHelper.SHA256(func.name + version);
            this.functions[hash] = func;
        }
    }

    addUser(user) {
        if (this.data["userData"][user] == undefined) {
            this.data["userData"][user] = this.initialUserData;
        }
    }

    getFunction(info) {
        let version = info.version == null ? this.version : info.version;
        let hash = cryptoHelper.SHA256(info.name + version);
        return this.functions[hash];
    }

    isFunctionValid(info, invokeHash) {
        return this.hashFunction(info) == invokeHash;
    }

    leanHash(info) {
        return cryptoHelper.SHA256(this.module + this.version);
    }

    fullHash() {
        return cryptoHelper.SHA256(this.functions.toString() + this.module + this.version);
    }

    leanHashFunction(info) {
        let hash = cryptoHelper.SHA256(info.function + info.version);
        return hash;
    }

    fullHashFunction(info) {
        let func = this.getFunction(info);
        let hash = cryptoHelper.SHA256(func.invoke.toString() + info.function + info.version);
        return hash;
    }

    isFunctionLeanInfoCorrect(info, leanInfoHash) {
        return this.leanHashFunction(info) == leanInfoHash;
    }

    isFunctionCorrect(info, fullHash) {
        return this.fullHashFunction(info) == fullHash;
    }
}

class ChangeContext {
    constructor(moduleData, userData) {
        this.moduleData = {};
        this.userData = {};
    }

    ensureModuleDataCreated(module, key) {
        this.moduleData[key] = 0;
    }

    ensureUserDataCreated(module, user, key) {
        this.userData[key] = 0;
    }

    subtract(module, key, amount) {
        ensureModuleDataCreated(module, key);
        this.moduleData[key] -= amount;
    }

    subtract(module, user, key, amount) {
        ensureUserDataCreated(module, user, key);
        this.userData[key] -= amount;
    }

    toString() {
        return JSON.stringify(this.moduleData) + " " + JSON.stringify(this.userData);
    }
}

class Container {
    constructor(module, user) {
        this.module = module;
        this.user = user;
    }

    getModuleData(moduleName) {
        return this.module.data;
    }

    getUserData(moduleName) {
        return this.module.data["userData"];
    }
}


class VirtualMachine {
    constructor() {
        this.modules = {};
    }

    addModule(module) {
        let hash = cryptoHelper.SHA256(module.module + module.version);
        this.modules[hash] = module;
    }

    addUser(moduleInfo, user) {
        let moduleHash = cryptoHelper.SHA256(moduleInfo.module + moduleInfo.version);
        let module = this.modules[moduleHash];
        module.addUser(user);
    }

    getModule(info) {
        let hash = cryptoHelper.SHA256(info.module + info.version);
        return this.modules[hash];
    }

    getFunction(info) {
        let module = this.getModule(info);
        return module.getFunction(info);
    }

    invoke(info) {
        let module = getModule(info);
        let moduleFunction = module.getFunction(info);
        let changeContext = new ChangeContext(module.data, module.data["userData"][info.user]);
        let container = new Container(module, info.user);
        //Container is ledger
        //changeContext keeps track of changes
        //let result = moduleFunction.invoke(container, changeContext, info.user);
        let result = moduleFunction.invoke(container, changeContext, info.user);
        //if its not a container, we have a view
        return result;
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

