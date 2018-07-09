
/**
 * Runs test scenarios to be called by the clientSrc/wallet.js files for testing the internal seedSrc code.
 * 
 * Unit testing is great, however these are to test scenarios.
 * 
 * Exports:
 *      seedModuleTest() - Runs the Seed Module test scenario and prints to the console along the way
 *      cryptographyTest() - Runs the cryptography test scenario and invokes the unit tests
 *      vmModuleTest() - Runs a simple module creation and execution test [Deprecated in favour of seedModuleTest]
 *      
 */

const cryptoHelperExporter = require("./helpers/cryptoHelper.js");
const accountExporter = require("./account.js");
const cryptographyHelper = cryptoHelperExporter.newCryptoHelper();
const virtualMachineExporter = require("./virtualMachine/virtualMachine.js");
const moduleExporter = require("./module.js");
const seedExporter = require("./modules/seed.js");
const moduleTester = require("./moduleTester.js");
const transactionExporter = require("./transaction.js");
const entanglementExporter = require("./entanglement.js");

let tipsToWork = function(tips, svm) {
    let result = [];
    for(let i = 0; i < tips.length; i++) {
        let transaction = tips[i];
        let localSimulation = svm.simulate({ module : transaction.execution.moduleName, function : transaction.execution.functionName, args : transaction.execution.args, user : transaction.sender });
        let localSimAsString = JSON.stringify(localSimulation);
        if (localSimAsString == transaction.execution.changeSet) {
            let moduleUsed = svm.getModule({ module : transaction.execution.moduleName });
            
            if (moduleUsed != undefined) {
                let functionHash = moduleUsed.functionHashes[transaction.execution.functionName];
                if (functionHash != undefined) {
                    let moduleChecksum = cryptographyHelper.hashToChecksum(moduleUsed.fullHash());
                    let functionChecksum = cryptographyHelper.hashToChecksum(functionHash);
                    result.push( { transactionHash : transaction.transactionHash, moduleChecksum : moduleChecksum, functionChecksum : functionChecksum, changeSet : localSimAsString });
                } else {
                    throw new Error("Failed to get function hash");
                }
            } else {
                throw new Error("Failed to get module");
            }
        } else {
            throw new Error("Failed to simulate tip");
        }
    }
    return result;
}

let createTransaction = function(account, mod, func, args) {
    console.info("Creating Tx:", mod, func, args, account);
    let vm = virtualMachineExporter.getVirtualMachine();
    let localSimulation = vm.simulate({ module : mod, function : func, args : args, user : account.publicKey });
    let tips = entanglementExporter.getTipsToValidate(account.publicKey, 2);

    let work = tipsToWork(tips, vm);

    let transaction = transactionExporter.createNewTransaction(account.publicKey, { moduleName : mod, functionName : func, args : args, changeSet : JSON.stringify(localSimulation) }, work);
    transaction.signature = account.sign(transaction.transactionHash);
    if (transactionExporter.isTransactionValid(transaction)) {
        console.info("Adding Valid Tx To Tangle");
        entanglementExporter.tryAddTransaction(transaction);
    } else {
        console.log("FAILED TO CREATE TRANSACTION. FAILED VALIDATION");
    }
    return transaction;
}

module.exports = {
    transactionTest : function() {
        console.log("### Transaction Test ###");

        //Prep seed module
        let vm = virtualMachineExporter.getVirtualMachine();
        let seedModule = seedExporter.getSeed();
        vm.addModule(seedModule);

        //Prep account
        let accountABC = accountExporter.newAccount({ entropy : "ABC_123456789012345678901234567890", network : "00" });
        let accountDEF = accountExporter.newAccount({ entropy : "DEF_123456789012345678901234567890", network : "00" });
        let accountHGI = accountExporter.newAccount({ entropy : "GHI_123456789012345678901234567890", network : "00" });
        entanglementExporter.getEntanglement();
        
        console.log(createTransaction(accountABC, "Seed", "constructor", { initialSeed : 1000 }));
        console.log(createTransaction(accountABC, "Seed", "approve", { spender : accountDEF.publicKey, value : 250 }));
        console.log(createTransaction(accountDEF, "Seed", "transferFrom", { from : accountABC.publicKey, to : accountDEF.publicKey, value : 100 }));

        console.info("Entanglement", entanglementExporter.getEntanglement());


    },
    /**
     * Runs the Seed Module test scenario, confirming the Seed cryptocurrency module behaves as expected
     */
    seedModuleTest : function() {
        let vm = virtualMachineExporter.getVirtualMachine();
        let seedModule = seedExporter.getSeed();
        vm.addModule(seedModule);

        
        let tester = moduleTester.beginTest("Seed", "ABC");
        tester.invoke("constructor", { initialSeed : 1000 });
        tester.assertEqual("getBalanceOf", { owner : "ABC" }, 1000, "Creator should start with 1000 SEED");
        tester.assertEqual("getSymbol", {}, "SEED", "The symbol of Seed should be \"SEED\"");
        tester.assertEqual("getDecimals", {}, 4, "Seed should have 4 decimal points");
        tester.assertEqual("getTotalSupply", {}, 1000, "1000 SEED should be in circulation upon creation");

        tester.assertEqual("getAllowance", { owner : "ABC", spender : "DEF" }, undefined, "Get allowance is unset for user who has never used Seed before" );
        tester.switchUser("DEF");

        //Before DEF has an account, should fail
        tester.assertInvokeFailToChangeState("transferFrom", { from : "ABC", to : "GEH", value : 100 });

        vm.addUser({ module : "Seed" }, "DEF"); // I don't think we need, or want to need, this

        // Before DEF has allowance, should fail
        tester.assertInvokeFailToChangeState("transferFrom", { from : "ABC", to : "GEH", value : 100 });

        tester.switchUser("ABC");
        tester.invoke("approve", { spender : "DEF", value : 250 });
        tester.switchUser("DEF");
        tester.invoke("transferFrom", { from : "ABC", to : "DEF", value : 100 });
        tester.invoke("transferFrom", { from : "ABC", to : "GHI", value : 100 });

        tester.assertEqual("getBalanceOf", { owner : "ABC" }, 800, "Owner should still have 800 SEED");
        tester.assertEqual("getBalanceOf", { owner : "DEF" }, 100, "DEF sent 100 SEED to himself");
        tester.assertEqual("getBalanceOf", { owner : "GHI" }, 100, "GHI received 100 SEED from DEF on ABC's behalf");

        tester.switchUser("GHI");
        tester.invoke("transfer", { to : "ABC", value : 50 });
        tester.assertEqual("getBalanceOf", { owner : "ABC" }, 850, "ABC should have received 50 from GHI");

        tester.switchUser("DEF");
        tester.invoke("burn", { value : 25 });
        tester.assertEqual("getBalanceOf", { owner : "DEF" }, 75, "DEF should have 75 after burning 25, removing it from circulation");
        tester.assertEqual("getTotalSupply", {}, 975, "25 coins were burned, removed from circulation, since initial 1000 creation");

        tester.endTest();
    },
    /**
     * Runs the Cryptography and account test scenario
     */
    cryptographyTest: function() {
        console.log("Cryptography Test");
        let newAccount = accountExporter.newAccount({ entropy : "1349082123412353tgfdvrewfdvdfr43f34390413290413", network : "00" });
        if (newAccount.privateKey == null) {
            console.log("NO PRIVATE KEY");
        }
        console.info(newAccount);
        let signature = newAccount.sign("dataToSign");
        console.log(signature);
        accountExporter.runUnitTests();
        cryptoHelperExporter.runUnitTests();
        console.log("Crypto Test Complete");
    },
    /**
     * Runs a basic virtual machine test scenario
     */
    vmModuleTest : function() {
        let vm = virtualMachineExporter.getVirtualMachine();
        vm.addModule(moduleExporter.createModule({
            module : "Game", 
            initialData : { walls : [[1, 1, 1], [0, 0, 0], [0, 0, 0]] },
            initialUserData : { x : 2, y : 1 },
            functions : {
                moveLeft : function(container, changeContext) {
                    let gameData = container.getModuleData();
                    let userData = container.getSenderData();
                    let walls = gameData["walls"];
                    if (walls[userData.x - 1][userData.y] == 0) {
                        changeContext.subtract(1, { user : container.sender, key : "x" });
                    }
                    return changeContext;
                },
                getX : function(container) {
                    return container.getSenderData().x;
                },
                getY : function(container) {
                    return container.getSenderData().y;
                },
                moveRightDependantLocal : function(container, changeContext) {
                    let userX = container.getter({function : "getX"}, changeContext);
                    if (container.getModuleData()["walls"][userX + 1][container.getSenderData().y] == 0) {
                        changeContext.add(1, { user : container.sender, key : "x" });
                    }
                    return changeContext;
                },
                moveRightDependantGlobal : function(container, changeContext) {
                    let userX = container.getter({function : "getX"}, changeContext);
                    let isGlobalStateTrue = container.getter({ module : "Reliant", function : "doesMatchState", args : { state : "ThisIsTheState" } }, changeContext);
                    if (isGlobalStateTrue && container.getModuleData()["walls"][userX + 1][container.getSenderData().y] == 0) {
                        changeContext.add(1, { user : container.sender, key : "x" });
                    }
                    return changeContext;
                },
                moveUpThenLeft : function(container, changeContext) {
                    let userData = container.getSenderData();
                    if (container.getModuleData()["walls"][userData.x][userData.y + 1] == 0) {
                        changeContext.add(1, { user : container.sender, key : "y" });
                    }
                    container.invoke({ function : "moveLeft" }, changeContext);
                    return changeContext;
                }
            }
        }));

        vm.addModule(moduleExporter.createModule({
            module : "Reliant",
            initialData : { state : "ThisIsTheState" },
            initialUserData : {},
            functions : {
                doesMatchState : function(container) {
                    return container.getModuleData().state == container.args.state;
                }
            }
        }));

        let tester = moduleTester.beginTest("Game", "ABC");
        
        tester.assertEqual("getX", {}, 2, "ABC should start as x position 2");
        tester.invoke("moveLeft");
        tester.assertEqual("getX", {}, 1, "ABC should have x of 1 after moving left");
        tester.invoke("moveLeft");
        tester.assertEqual("getX", {}, 1, "ABC should have x of 1 after moving left again cause they hit wall at 1");
        tester.invoke("moveRightDependantLocal");
        tester.assertEqual("getX", {}, 2, "ABC should have x of 2 after moving right");
        tester.invoke("moveLeft");
        tester.assertEqual("getX", {}, 1, "Move back to 1 so we can move right");
        tester.invoke("moveRightDependantGlobal");
        tester.assertEqual("getX", {}, 2, "ABC should have x of 2 after moving right");
        tester.invoke("moveUpThenLeft");
        tester.assertEqual("getY", {}, 2, "ABC should have y of 2 after moving up");
        tester.assertEqual("getX", {}, 1, "ABC should have x of 1 after moving left");

        tester.endTest();
    }
 }