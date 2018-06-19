let cryptoHelper = require("./cryptoHelper.js").newCryptoHelper();

module.exports = {
    createModule : function(info) {
        return new Module(info);
    } 
 }

 class Module {
    constructor(info) {
        this.functions = {}; // True function lookup
        this.functionHashes = {}; // Will overwrite previous name->hash mapping if functions share a name. Convenience lookup, not true lookup
        this.module = info.module;
        this.data = Object.assign({}, info.data);
        this.data["userData"] = {};
        this.initialUserData = Object.assign({}, info.initialUserData);

        //console.info("Module::Constructor[name,defaultData,defaultUserData]", this.module, this.data, this.initialUserData);
    }

    addFunction(func) {
        if (func.invoke != null && func.name != null) {
            let hash = cryptoHelper.sha256(func.name + JSON.stringify(func.invoke));
            this.functions[hash] = func;
            this.functionHashes[func.name] = hash;
        }
    }

    addUser(user) {
        this.data["userData"][user] = Object.assign({}, this.initialUserData);
        //console.info("Module::AddUser[name,defaultUserData,assignedUserData]", this.module, this.initialUserData, this.data["userData"][user]);
    }

    doesUserExist(user) {
        return this.data["userData"][user] != undefined;
    }

    getFunctionByName(name) {
        return this.getFunctionByHash(this.functionHashes[name]);
    }
    
    getFunctionByHash(hash) {
        return this.functions[hash];
    }

    isFunctionValid(info, invokeHash) {
        return this.hashFunction(info) == invokeHash;
    }

    leanHash(info) {
        return cryptoHelper.sha256(this.module);
    }

    fullHash() {
        return cryptoHelper.sha256(this.functions.toString() + this.module);
    }

    leanHashFunction(info) {
        let hash = cryptoHelper.sha256(info.function);
        return hash;
    }

    fullHashFunction(info) {
        let func = this.getFunction(info);
        let hash = cryptoHelper.sha256(func.invoke.toString() + info.function);
        return hash;
    }

    isFunctionLeanInfoCorrect(info, leanInfoHash) {
        return this.leanHashFunction(info) == leanInfoHash;
    }

    isFunctionCorrect(info, fullHash) {
        return this.fullHashFunction(info) == fullHash;
    }
}