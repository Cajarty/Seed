const { readdirSync, statSync } = require('fs')
const { join } = require('path')
const seed = require("../seedSrc/index.js");

module.exports = {
    loadModules : function() {
        let svm = seed.getSVMExporter().getVirtualMachine();
        let dappsToLoad = {};
        let getDirectories = path => readdirSync(path).filter(fileOrFolder => statSync(join(path, fileOrFolder)).isDirectory());
        let directories = getDirectories("./modules");
        for(let i = 0; i < directories.length; i++) {
            let modulePath = "./modules/" + directories[i] + "/";
            let moduleJson = require(modulePath + "module.json");
            if (moduleJson) {
                let moduleFileName = directories[i] + ".js";
                let moduleExporter = require(modulePath + moduleFileName);
                let moduleToLoad = moduleExporter.getModule();
                if (moduleToLoad.moduleChecksum === moduleJson.moduleChecksum) {
                    svm.addModule(moduleToLoad);
                    // Add module to virtual machine
                    dappsToLoad[moduleJson.name] = moduleJson;
                } else {
                    throw new Error("Loaded module's checksum does not match expected checksum.");
                }
            } else {
                throw new Error("Failed to load module.json file. May be malformed.");
            }
        }
        return dappsToLoad;
    }
 }