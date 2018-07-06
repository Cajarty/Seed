console.log("Wallet.js");

const scenarioExporter = require("../seedSrc/scenarioTest.js");

//scenarioExporter.cryptographyTest();
scenarioExporter.transactionTest();

scenarioExporter.seedModuleTest();
scenarioExporter.vmModuleTest();