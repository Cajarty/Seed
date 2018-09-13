/*******************
 * moduleLoader.js *
 *******************
 * 
 * Helper export that loads modules on the Main processes behalf
 */

const { readdirSync, statSync } = require('fs')
const { join } = require('path')
const seed = require("../seedSrc/index.js");

module.exports = {
    /**
     * Loads all possible DApps from the /modules/ folder, validates their module matches the expected checksum,
     * then adds it to the Seed Virtual machine and returns it in a mapping of modules loaded
     */
    loadModules : function() {
        let svm = seed.getSVMExporter().getVirtualMachine();
        let entanglement = seed.getEntanglementExporter().getEntanglement();
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