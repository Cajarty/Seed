/* --v for verbose, --clean for cleaning files after */

const moduleLoader = require("./moduleLoader.js");
const seed = require("../seedSrc/index.js");

let hasCommand = (command) => {
    if (process.argv.length >= 2) {
        for(let i = 2; i < process.argv.length; i++) {
            if (process.argv[i] == command) {
                return true;
            }
        }
    }
    return false;
}

let commands = { 
    verbose : hasCommand('--v'),
    clean : hasCommand('--clean'),
    logFile : hasCommand('--log-file')
}

moduleLoader.loadModules();

// Confirm all subsystems work

seed.getUnitTestingExporter().runAllUnitTests(commands.verbose);

// Clear all subsystems  

// Confirm SVM works and prove through simulations

if (commands.clean) {
    // Clear all files made from tests
}
