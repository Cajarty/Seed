
module.exports = {
    runAllUnitTests : function(verbose) {
        console.info("Running tests");

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

        console.info("Tests Complete", result);
    },
    newTest : function() {
        return new Test();
    }
}

class Test {
    constructor() {
        this.passes = 0;
        this.fails = [];
    }

    assertIsTrue(expression, failMessage) {
        if (expression) {
            this.passes++;
        } else {
            this.fails.push(failMessage);
        }
    }

    assertAreEqual(obj1, obj2, failMessage) {
        this.assertIsTrue(obj1 == obj2, failMessage);
    }

    assertAreEqualStrict(obj1, obj2, failMessage) {
        this.assertIsTrue(obj1 === obj2, failMessage);
    }

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