/******************
 * unitTesting.js *
 ******************
 * 
 * Exports functions related to running unit tests or creating unit tests.
 * 
 */

module.exports = {
    /**
     * Runs all modules for unit tests which are hard-coded into this function for loading.
     * Modules to test are expected to have a "runUnitTests(verbose)" function available, which
     * returns a test result object of type { fails : array, passes : number }
     * 
     * @param verbose - Whether to write extra debug lines or not
     */
    runAllUnitTests : function(verbose) {
        console.info("#### Running All Unit Tests");

        let subsystemUnitTests = {
            Cryptography : require("../helpers/cryptoHelper.js").getUnitTests(),
            Account : require("../account.js").getUnitTests(),
            Random : require("../helpers/random.js").getUnitTests(),
            Block : require("../block.js").getUnitTests(),
            Transaction : require("../transaction.js").getUnitTests(),
            Squasher : require("../squasher.js").getUnitTests(),
            Entanglement : require("../entanglement.js").getUnitTests(),
            Blockchain : require("../blockchain.js").getUnitTests(),
            Ledger : require("../ledger.js").getUnitTests(),
            SVM : require("../virtualMachine/virtualMachine.js").getUnitTests(),
            FileStorage : require("../storage/fileSystemInjector.js").getUnitTests(),
            LocalStorage : require("../storage/localStorageInjector.js").getUnitTests(),
            Storage : require("../storage/storage.js").getUnitTests(),
            Messaging : require("../messaging.js").getUnitTests()
        };

        let log = function(param1, param2, param3) {
            if (verbose) {
                if (!param3) {
                    if (!param2) {
                        if (param1) {
                            console.log(param1);
                        }
                    } else {
                        console.info(param1, param2);
                    }
                } else {
                    console.info(param1, param2, param3);
                }
            }
        }

        let test = new Test(verbose);

        for(let i = 0; i < Object.keys(subsystemUnitTests).length; i++) {
            let unitTestsName = Object.keys(subsystemUnitTests)[i];
            let unitTests = subsystemUnitTests[unitTestsName];
            log("### Running " + unitTestsName + " Tests");
            runBundledTests(test, unitTests, verbose, log);
        }


        setTimeout(() => {
            console.info("#### Tests Complete");
            test.logState();
        }, 1000);
    }
}



let runBundledTests = function(test, unitTests, verbose, log) {
    let keys = Object.keys(unitTests);
    for(let i = 0; i < keys.length; i++) {
        let unitTestName = keys[i];
        log("## Running Unit Test " + unitTestName);
        test.newSegment(unitTestName);
        unitTests[unitTestName](test, log);
    }
}

/**
 * A class which helps determine whether a Test fails or passes the tests, preparing which
 * ones failed in a list of error messages.
 */
class Test {
    /**
     * Creates the Test to be of type { passes : number, fails : array }
     * @param verbose - A flag to be set for whether to debug all lines
     */
    constructor(verbose) {
        this.passes = {};
        this.fails = {};
        this.segments = [];
        this.verbose = verbose;
        this.segmentName = "N/A";
    }

    /**
     * If the expression is true, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assert(expression, failMessage) {
        if (expression) {
            if (!this.passes[this.segmentName]) {
                this.passes[this.segmentName] = 0;
            }
            this.passes[this.segmentName]++;
        } else {
            if (!this.fails[this.segmentName]) {
                this.fails[this.segmentName] = [];
            }
            this.fails[this.segmentName].push(this.segmentName + ":: " + failMessage);
        }
    }

    /**
     * If the first two parameters are equivalent by the double-equals tandard, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assertAreEqual(obj1, obj2, failMessage) {
        this.assert(obj1 == obj2, failMessage);
    }

    /**
     * If the first two parameters are strictly equivalent, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assertAreEqualStrict(obj1, obj2, failMessage) {
        this.assert(obj1 === obj2, failMessage);
    }

    /**
     * If the function throws an error, the test passed as it was expected. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assertFail(failFunction, failMessage) {
        try {
            failFunction();
        } catch(e) {
            if (!this.passes[this.segmentName]) {
                this.passes[this.segmentName] = 0;
            }
            this.passes[this.segmentName]++;
            return;
        }
        if (!this.fails[this.segmentName]) {
            this.fails[this.segmentName] = [];
        }
        this.fails[this.segmentName].push(this.segmentName + ":: " + failMessage);
    }
    
    /**
     * Switches segments as a new grouping of tests is being run
     */
    newSegment(segmentName) {
        this.segments.push(segmentName);
        this.segmentName = segmentName;
    }

    /**
     * Switches segments to go back to an existing group
     */
    switchSegment(segmentName) {
        let oldSegment = this.segmentName;
        this.segmentName = segmentName;
        return oldSegment;
    }

    /**
     * Lets the execution of asserts occur after a function leaves, when an asynchronous
     * callback tries to pass/fail a test after the fact.
     */
    runAssertsFromAsync(functionToInvoke, segmentName) {
        let oldSegment = this.switchSegment(segmentName);
        functionToInvoke();
        this.switchSegment(oldSegment);
    }

    /**
     * Logs the unit tests based on the current state
     */
    logState() {
        let failedSegments = Object.keys(this.fails);
        let passedSegments = Object.keys(this.passes);

        let failed = failedSegments.length > 0;
        let passed = failedSegments.length == 0 && passedSegments.length > 1;
        let totalUnitTests = failedSegments.length + passedSegments.length;

        if (passed) {
            console.log("## Passed All " + totalUnitTests + " Unit Tests");
        } else if (failed) {
            console.log("## Unit Tests failed");
            console.log("## Passed " + passedSegments.length + " / " + totalUnitTests + " Unit Tests");
            console.log("## Failed Tests...");
            for(let i = 0; i < failedSegments.length; i++) {
                console.info("# " + (i+1) + ":", this.fails[failedSegments[i]][0]);
            }

        } else {
            console.info("## No Tests Were Ran");
        }
    }
}