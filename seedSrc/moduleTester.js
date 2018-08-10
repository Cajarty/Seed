const vmExporter = require("./virtualMachine/virtualMachine.js");
const transactionExporter = require("./transaction.js");
const entanglementExporter = require("./entanglement.js");
const accountExporter = require("./account.js");

let vm = null;

module.exports = {
    beginTest : function(moduleName, startingUser, simulateDAG) {
        vm = vmExporter.getVirtualMachine();
        return new ModuleTester(moduleName, startingUser, simulateDAG);
    } 
}

class ModuleTester{
    constructor(moduleName, startingUser, simulateDAG) {
        console.info("Begin Test For Module " + moduleName);
        this.moduleName = moduleName;
        this.passCounter = 1;
        this.totalCounter = 1;
        this.fails = [];
        this.accounts = {};
        this.switchUser(startingUser);
        entanglementExporter.getEntanglement();
        this.simulateDAG = simulateDAG;
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
        if (this.accounts[newUser] == undefined) {
            this.accounts[newUser] = accountExporter.newAccount( { entropy : newUser + "_123456789012345678901234567890", network : "00" });
        }
        this.currentUser = this.accounts[newUser];
    }

    getAccount(user) {
        if (this.accounts[user] == undefined) {
            this.accounts[user] = accountExporter.newAccount( { entropy : user + "_123456789012345678901234567890", network : "00" });
        }
        return this.accounts[user].publicKey;
    }

    invoke(functionName, args) {
        return vm.invoke({ 
            module : this.moduleName, 
            function : functionName, 
            user : this.currentUser.publicKey, 
            args : args,
            txHashes : []
        });
    }

    relay() {
        let oldAccount = this.currentUser;
        let name = "Z" + Math.floor((Math.random() * 10));
        this.switchUser(name);
        let transaction = vm.createTransaction(this.currentUser, "Relay", "relay", {}, this.simulateDAG ? 4 : 0);
        this.currentUser = oldAccount;
        return transaction;
    }

    createTransaction(functionName, args) {
        return vm.createTransaction(this.currentUser, this.moduleName, functionName, args, this.simulateDAG ? 2 : 0);
    }

    createTransactionWithRelay(functionName, args) {
        //console.info("CreatingTransaction", functionName, args);
        let transaction = this.createTransaction(functionName, args);
        if (transaction == null) {
            this.relay();
            return this.createTransactionWithRelay(functionName, args);
        }
        return transaction;
    }

    createAndInvokeTransaction(functionName, args) {
        let transaction = this.createTransaction(functionName, args);
        let txHashes = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            txHashes.push(transaction.validatedTransactions[i].transactionHash);
        }
        return vm.invoke({ 
            module : transaction.execution.moduleName, 
            function : transaction.execution.functionName, 
            user : this.currentUser.publicKey, 
            args : transaction.execution.args,
            txHashes : txHashes
        }, transaction.execution.changeSet);
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