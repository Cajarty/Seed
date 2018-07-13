console.log("Wallet.js");

const scenarioExporter = require("../seedSrc/index.js").getScenarioTestExporter();

//scenarioExporter.cryptographyTest();
scenarioExporter.seedAndSVMTransactionTest();

//scenarioExporter.seedModuleTest();
//scenarioExporter.vmModuleTest();