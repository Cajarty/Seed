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
    }

    addFunction(func) {
        if (func.invoke != null && func.function != null && func.version != null) {
            let version = func.version == null ? info.version : func.version;
            let hash = cryptoHelper.SHA256(func.function + version);
            this.functions[hash] = func;
        }
    }

    getFunction(info) {
        let version = info.version == null ? this.version : info.version;
        let hash = cryptoHelper.SHA256(info.function + version);
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


class VirtualMachine {
    constructor() {
        this.modules = {};
    }

    addModule(module) {
        let hash = cryptoHelper.SHA256(module.module + module.version);
        this.modules[hash] = module;
    }

    getModule(info) {
        let hash = cryptoHelper.SHA256(info.module + info.version);
        return this.modules[hash];
    }

    getFunction(info) {
        let module = this.getModule(info);
        return module.getFunction(info);
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

