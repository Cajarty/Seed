const vmExporter = require("./virtualMachine.js");

let vm = null;

module.exports = {
    beginTest : function(moduleName, startingUser) {
        vm = vmExporter.getVirtualMachine();
        return new Tester(moduleName, startingUser);
    } 
}

class Tester{
    constructor(moduleName, startingUser) {
        console.info("Begin Test For Module " + moduleName);
        this.moduleName = moduleName;
        this.currentUser = startingUser;
        this.passCounter = 1;
        this.totalCounter = 1;
        this.fails = [];
    }

    passTest() {
        this.passCounter++;
        this.totalCounter++;
    }

    failTest(failMessage) {
        let msg = "Failed Test# " + this.totalCounter + " \n-" + failMessage;
        this.fails.push(msg);
        this.totalCounter++;
    }

    switchUser(newUser) {
        this.currentUser = startingUser;
    }

    invoke(functionName, args) {
        return vm.invoke({ 
            module : this.moduleName, 
            function : functionName, 
            user : this.currentUser, 
            args : args
        });
    }

    assertEqual(functionName, args, valueToCheck, failMessage) {
        let result = this.invoke(functionName, args);
        if (result == valueToCheck) {
            this.passTest();
            return true;
        } else {
            this.failTest(failMessage);
            return false;
        }
    }

    assertTrue(functionName, args, failMessage) {
        let result = this.invoke(functionName, args);
        if (!result) {
            this.failTest(failMessage);
            return false;
        } else {
            this.passTest();
            return true;
        }
    }

    endTest() {
        console.log("Test Complete For Module " + moduleName);
        console.log("Result: " + this.passCounter + "/" + this.totalCounter);
        if (this.fails.length > 0) {
            console.log(this.fails);
        }
    }
}