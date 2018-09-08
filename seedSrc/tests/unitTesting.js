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

        let result = {
            fails : [],
            passes : 0
        }
        let toTest = [
            require("../helpers/cryptoHelper.js")
        ];

        for(let i = 0; i < toTest.length; i++) {
            let test = toTest[i];
            let testResult = test.runUnitTests(verbose);
            result.fails = result.fails.concat(testResult.fails);
            result.passes += testResult.passes;
        }

        console.info("#### Tests Complete", result);
    },
    /**
     * Creates and returns a new Test object used for handling testing implementation logic.
     * 
     * @return - A new Test object
     */
    newTest : function(verbose) {
        return new Test(verbose);
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
        this.passes = 0;
        this.fails = [];
        this.verbose = verbose;
    }

    /**
     * If the expression is true, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assert(expression, failMessage) {
        if (expression) {
            this.passes++;
        } else {
            this.fails.push(failMessage);
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
            this.passes++;
            return;
        }
        this.fails.push(failMessage);
    }
}