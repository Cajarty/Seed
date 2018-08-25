const virtualMachineExporter = require("./virtualMachine/virtualMachine.js");
const scenarioTestExporter = require("./scenarioTest.js");

module.exports = {
    getSVMExporter : function() {
        return virtualMachineExporter;
    },
    getScenarioTestExporter : function() {
        return scenarioTestExporter;
    } 
 }
