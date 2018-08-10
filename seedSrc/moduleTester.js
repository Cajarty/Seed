/*******************
 * moduleTester.js *
 *******************
 * 
 * Helper class for unit testing/scenario testing modules
 * 
 * Exported Functions:
 *      beginTest(moduleName, startingUser, simulateDAG)
 */

const vmExporter = require("./virtualMachine/virtualMachine.js");
const transactionExporter = require("./transaction.js");
const entanglementExporter = require("./entanglement.js");
const accountExporter = require("./account.js");

let vm = null;

module.exports = {
    /**
     * Beings a test and creates a new ModuleTester class to return
     * 
     * If simulateDAG is true, relay transactions will be required to validate transactions. If its false, none will be required
     * 
     * @param moduleName - The name of the module to test on
     * @param startingUser - The default user in the test
     * @param simulateDAG - Whether to simulate DAG validation requirements or not
     * 
     * @return - The newly created ModuleTester for this test
     */
    beginTest : function(moduleName, startingUser, simulateDAG) {
        vm = vmExporter.getVirtualMachine();
        return new ModuleTester(moduleName, startingUser, simulateDAG);
    } 
}

/**
 * The wrapper class for testing modules
 */
class ModuleTester{
    /**
     * The constructor for ModuleTester which begins the test and assigns the default variables
     * 
     * @param moduleName - The name of the module to test on
     * @param startingUser - The default user in the test
     * @param simulateDAG - Whether to simulate DAG validation requirements or not
     */
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

    /**
     * Invoked when a test is passed, this increases updates the tallies for the passing tests
     */
    passTest() {
        this.passCounter++;
        this.totalCounter++;
    }

    /**
     * Invoked when a test fails, this creates a fail message and adds it to a list of fail messages. These messages are all displayed once
     * the unit tests terminate. Also increases teh totalCounter tests tally
     * 
     * @param {*} failMessage - The message to display upon failing
     * @param {*} actualResult - The actual result for whatever test failed, rather than the expected one
     */
    failTest(failMessage, actualResult) {
        let msg = "Failed Test# " + this.totalCounter + " \n-" + failMessage;
        if (actualResult != undefined) {
            msg += "\nActual Result: ";
        }
        this.fails.push(msg);
        this.totalCounter++;
    }

    /**
     * Changes which user is sending the follow transactions
     * 
     * @param {*} newUser - A string representing the new user to send transactions ons behalf
     */
    switchUser(newUser) {
        if (this.accounts[newUser] == undefined) {
            this.accounts[newUser] = accountExporter.newAccount( { entropy : newUser + "_123456789012345678901234567890", network : "00" });
        }
        this.currentUser = this.accounts[newUser];
    }

    /**
     * Returns the Account object related to a given user's string/name
     * 
     * @param {*} user - The name of the user to fetch
     */
    getAccount(user) {
        if (this.accounts[user] == undefined) {
            this.accounts[user] = accountExporter.newAccount( { entropy : user + "_123456789012345678901234567890", network : "00" });
        }
        return this.accounts[user].publicKey;
    }

    /**
     * Invokes a module's function execution in the virutal machine
     * 
     * @param {*} functionName - The name of the function to invoke
     * @param {*} args - The arguments passed in as parameters
     */
    invoke(functionName, args) {
        return vm.invoke({ 
            module : this.moduleName, 
            function : functionName, 
            user : this.currentUser.publicKey, 
            args : args,
            txHashes : []
        });
    }

    /**
     * Creates a relay transaction to push validation forward in the simulation. Creates a random user to do the transaction
     * 
     * @return - The transaction created
     */
    relay() {
        let oldAccount = this.currentUser;
        let name = "Z" + (Math.random() * 100) % 100;
        this.switchUser(name);
        let transaction = vm.createTransaction(this.currentUser, "Relay", "relay", {}, this.simulateDAG ? 4 : 0);
        this.currentUser = oldAccount;
        return transaction;
    }

    /**
     * Creates a transaction and runs it in the virtual machine
     * 
     * @param {*} functionName - The name of the function to execute
     * @param {*} args - The arguments to be passed into the function as parameters
     * 
     * @return - The transaction created
     */
    createTransaction(functionName, args) {
        return vm.createTransaction(this.currentUser, this.moduleName, functionName, args, this.simulateDAG ? 2 : 0);
    }

    /**
     * Tries to create a transaction, and if it can't due to congestion issues, it creates a relay if needed before trying again
     * 
     * @param {*} functionName - The name of the function to execute
     * @param {*} args - The arguments to be passed into the function as parameters
     */
    createTransactionWithRelay(functionName, args) {
        let transaction = this.createTransaction(functionName, args);
        if (transaction == null) {
            this.relay();
            return this.createTransactionWithRelay(functionName, args);
        }
        return transaction;
    }

    /**
     * Tries to create a transaction and invoke it in the virtual machine
     * 
     * @param {*} functionName - The name of the function to execute
     * @param {*} args - The arguments to be passed into the function as parameters
     * 
     * @return - The changeset resulted from the invoked transaction
     */
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

    /**
     * Asserts that, if we invoked the given function with its given arguments, what it returns will be equal to the valueToCheck
     * If not, it will fail the test and log the failMessage
     * 
     * @param {*} functionName - The name of the getter to check
     * @param {*} args - The arguments passed into the getter
     * @param {*} valueToCheck - The expected value to get
     * @param {*} failMessage - The fail message to log if the values do not match
     */
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

    /**
     * Asserts that, if we attepted to execute a transaction, it would fail
     * 
     * @param {*} functionName - The function that we want to test
     * @param {*} args - The arguments passed into the function to test
     */
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

    /**
     * Asserts that, if we invoked the given function with its given arguments, what it returns will true
     * If not, it will fail the test and log the failMessage
     * 
     * @param {*} functionName - The name of the getter to check
     * @param {*} args - The arguments passed into the getter
     * @param {*} failMessage - The fail message to log if the values do not match
     */
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

    /**
     * Ends the test and logs the results to the console
     */
    endTest() {
        console.log("### Test Complete For Module " + this.moduleName + " ###");
        console.log("### Result: " + this.passCounter + "/" + this.totalCounter+ " ###") ;
        if (this.fails.length > 0) {
            console.log(this.fails);
        }
    }
}