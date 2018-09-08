
module.exports = {
    runAllUnitTests : function(verbose) {
        console.info("Running tests");

        let result = {
            fails : [],
            passes : 0
        }
        let toTest = [
            require("toTest")
        ];

        for(let i = 0; i < toTest.length; i++) {
            let test = toTest[i];
            let testResult = test.runUnitTests(verbose);
            result.fails = result.fails.concat(testResult.fails);
            result.passes += testResult.passes;
        }

        console.info("Tests Complere", result);
    }
}

class Test {
    
}