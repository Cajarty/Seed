const vmExporter = require("./virtualMachine.js");

let vm = null;

module.exports = {
    beginTest : function(moduleName, startingUser) {
        vm = vmExporter.getVirtualMachine();
        return new ModuleTester(moduleName, startingUser);
    } 
}

class ModuleTester{
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

    failTest(failMessage, actualResult) {
        let msg = "Failed Test# " + this.totalCounter + " \n-" + failMessage;
        if (actualResult != undefined) {
            msg += "\nActual Result: ";
        }
        this.fails.push(msg);
        this.totalCounter++;
    }

    switchUser(newUser) {
        this.currentUser = newUser;
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
            this.failTest(failMessage, result);
            return false;
        }
    }

    assertInvokeFailToChangeState(functionName, args) {
        let result = this.invoke(functionName, args);
        if (result == vm.ERROR.FailedToChangeState) {
            this.passTest();
            return true;
        } else {
            this.failTest(functionName + " with args " + args + " was supposed to fail to change state");
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
        console.log("Test Complete For Module " + this.moduleName);
        console.log("Result: " + this.passCounter + "/" + this.totalCounter);
        if (this.fails.length > 0) {
            console.log(this.fails);
        }
    }
}