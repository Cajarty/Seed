
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
const seedExporter = require("../clientSrc/modules/seed/seed.js");
const relayExporter = require("../clientSrc/modules/relay/relay.js");
const moduleTester = require("./moduleTester.js");
const transactionExporter = require("./transaction.js");
const entanglementExporter = require("./entanglement.js");
const ledgerExporter = require("./ledger.js");
const messagingExporter = require("./messaging.js");
const squasherExporter = require("./squasher.js");

let messageReply = function(payload) {
    //console.info("FunctionInvoke: " , payload);
}

let dataChangeReply = function(payload) {
    //console.info("DataChange: " , payload);
}

let userChangeReply = function(payload) {
    //console.info("UserChange: " , payload);
}

let sleep = function() {
    for(let i = 0; i < 500000; i++) {
        for(let j = i; j + i < 250000; j++) {
            let k = j * 2 + i - j;
        }
    }
}

module.exports = {
    seedScenarioSetupTest : function() {
        console.log("### Seed Scenario Setup Test ###");
        let tester = moduleTester.beginTest("Seed", "ABC", true);
        tester.relay();
        sleep();
        tester.relay();
        sleep();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 1000, "Creator should start with 1000 SEED");
        tester.assertEqual("getSymbol", {}, "SEED", "The symbol of Seed should be \"SEED\"");
        tester.assertEqual("getDecimals", {}, 4, "Seed should have 4 decimal points");
        tester.assertEqual("getTotalSupply", {}, 1000, "1000 SEED should be in circulation upon creation");
        tester.assertEqual("getAllowance", { owner : tester.getAccount("ABC"), spender : tester.getAccount("DEF") }, undefined, "Get allowance is unset for user who has never used Seed before" );

        tester.switchUser("ABC");
        sleep();
        tester.createTransactionWithRelay("approve", { spender : tester.getAccount("DEF"), value : 250 });
        sleep();
        tester.relay();
        sleep();

        tester.switchUser("DEF");
        sleep();
        tester.createTransactionWithRelay("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("DEF"), value : 100 });
        sleep();
        tester.createTransactionWithRelay("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GHI"), value : 100 });
        sleep();
        tester.relay();
        sleep();
        tester.relay();
        sleep();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 800, "Owner should still have 800 SEED");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 100, "DEF sent 100 SEED to himself");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("GHI") }, 100, "GHI received 100 SEED from DEF on ABC's behalf");

        tester.switchUser("GHI");
        sleep();
        tester.createTransactionWithRelay("transfer", { to : tester.getAccount("ABC"), value : 50 });
        sleep();
        tester.relay();
        sleep();
        tester.relay();
        sleep();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 850, "ABC should have received 50 from GHI");

        tester.switchUser("DEF");
        tester.createTransactionWithRelay("burn", { value : 25 });
        sleep();
        tester.relay();
        sleep();
        tester.relay();
        sleep();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 75, "DEF should have 75 after burning 25, removing it from circulation");
        tester.assertEqual("getTotalSupply", {}, 975, "25 coins were burned, removed from circulation, since initial 1000 creation");

        squasherExporter.transactionsToBlock(Object.values(entanglementExporter.getEntanglement().transactions));

        tester.endTest();
    },
    seedAndSVMTransactionTest : function() {
        console.log("### Seed & SVM Transaction Test ###");

        messagingExporter.subscribeToFunctionCallback("Seed", "transfer", messageReply);
        messagingExporter.subscribeToDataChange("Seed", "totalSupply", dataChangeReply);

        //Prep seed module
        let vm = virtualMachineExporter.getVirtualMachine();
        let seedModule = seedExporter.getModule();
        vm.addModule(seedModule);
        vm.addModule(relayExporter.getModule());

        let tester = moduleTester.beginTest("Seed", "ABC", true);
        messagingExporter.subscribeToDataChange("Seed", "balance", userChangeReply, tester.currentUser.publicKey);
        tester.createTransactionWithRelay("constructor", { initialSeed : 1000 });
        tester.relay();
        tester.relay();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 1000, "Creator should start with 1000 SEED");
        tester.assertEqual("getSymbol", {}, "SEED", "The symbol of Seed should be \"SEED\"");
        tester.assertEqual("getDecimals", {}, 4, "Seed should have 4 decimal points");
        tester.assertEqual("getTotalSupply", {}, 1000, "1000 SEED should be in circulation upon creation");
        tester.assertEqual("getAllowance", { owner : tester.getAccount("ABC"), spender : tester.getAccount("DEF") }, undefined, "Get allowance is unset for user who has never used Seed before" );

        tester.switchUser("ABC");
        tester.createTransactionWithRelay("approve", { spender : tester.getAccount("DEF"), value : 250 });
        tester.relay();

        tester.switchUser("DEF");
        tester.createTransactionWithRelay("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("DEF"), value : 100 });
        tester.createTransactionWithRelay("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GHI"), value : 100 });
        tester.relay();
        tester.relay();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 800, "Owner should still have 800 SEED");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 100, "DEF sent 100 SEED to himself");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("GHI") }, 100, "GHI received 100 SEED from DEF on ABC's behalf");

        tester.switchUser("GHI");
        tester.createTransactionWithRelay("transfer", { to : tester.getAccount("ABC"), value : 50 });
        tester.relay();
        tester.relay();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 850, "ABC should have received 50 from GHI");

        tester.switchUser("DEF");
        tester.createTransactionWithRelay("burn", { value : 25 });
        tester.relay();
        tester.relay();
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 75, "DEF should have 75 after burning 25, removing it from circulation");
        tester.assertEqual("getTotalSupply", {}, 975, "25 coins were burned, removed from circulation, since initial 1000 creation");

        tester.endTest();

        //console.info("Entanglement", entanglementExporter.getEntanglement(), "Ledger", ledgerExporter.getLedger());
        
    },
    seedAndSVMTransactionTest_NoDAG : function() {
        console.log("### Seed & SVM Transaction Test ###");

        //Prep seed module
        let vm = virtualMachineExporter.getVirtualMachine();
        let seedModule = seedExporter.getModule();
        vm.addModule(seedModule);

        let tester = moduleTester.beginTest("Seed", "ABC");
        tester.createAndInvokeTransaction("constructor", { initialSeed : 1000 });
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 1000, "Creator should start with 1000 SEED");
        tester.assertEqual("getSymbol", {}, "SEED", "The symbol of Seed should be \"SEED\"");
        tester.assertEqual("getDecimals", {}, 4, "Seed should have 4 decimal points");
        tester.assertEqual("getTotalSupply", {}, 1000, "1000 SEED should be in circulation upon creation");

        tester.assertEqual("getAllowance", { owner : tester.getAccount("ABC"), spender : tester.getAccount("DEF") }, undefined, "Get allowance is unset for user who has never used Seed before" );
        tester.switchUser("DEF");

        //Before DEF has an account, should fail
        tester.assertInvokeFailToChangeState("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GEH"), value : 100 });
        vm.addUser({ module : "Seed" }, tester.getAccount("DEF")); // I don't think we need, or want to need, this
    
        // Before DEF has allowance, should fail
        tester.assertInvokeFailToChangeState("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GEH"), value : 100 });

        tester.switchUser("ABC");
        tester.createAndInvokeTransaction("approve", { spender : tester.getAccount("DEF"), value : 250 });
        tester.switchUser("DEF");
        tester.createAndInvokeTransaction("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("DEF"), value : 100 });
        tester.createAndInvokeTransaction("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GHI"), value : 100 });

        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 800, "Owner should still have 800 SEED");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 100, "DEF sent 100 SEED to himself");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("GHI") }, 100, "GHI received 100 SEED from DEF on ABC's behalf");

        tester.switchUser("GHI");
        tester.createAndInvokeTransaction("transfer", { to : tester.getAccount("ABC"), value : 50 });
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 850, "ABC should have received 50 from GHI");

        tester.switchUser("DEF");
        tester.createAndInvokeTransaction("burn", { value : 25 });
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 75, "DEF should have 75 after burning 25, removing it from circulation");
        tester.assertEqual("getTotalSupply", {}, 975, "25 coins were burned, removed from circulation, since initial 1000 creation");

        tester.endTest();

        //console.info("Entanglement", entanglementExporter.getEntanglement(), "Ledger", ledgerExporter.getLedger().getModuleData("Seed"));
        
    },
    /**
     * Runs the Seed Module test scenario, confirming the Seed cryptocurrency module behaves as expected
     */
    seedModuleTest : function() {
        let vm = virtualMachineExporter.getVirtualMachine();
        let seedModule = seedExporter.getModule();
        vm.addModule(seedModule);
        
        let tester = moduleTester.beginTest("Seed", "ABC");
        tester.invoke("constructor", { initialSeed : 1000 });
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 1000, "Creator should start with 1000 SEED");
        tester.assertEqual("getSymbol", {}, "SEED", "The symbol of Seed should be \"SEED\"");
        tester.assertEqual("getDecimals", {}, 4, "Seed should have 4 decimal points");
        tester.assertEqual("getTotalSupply", {}, 1000, "1000 SEED should be in circulation upon creation");

        tester.assertEqual("getAllowance", { owner : tester.getAccount("ABC"), spender : tester.getAccount("DEF") }, undefined, "Get allowance is unset for user who has never used Seed before" );
        tester.switchUser("DEF");

        //Before DEF has an account, should fail
        tester.assertInvokeFailToChangeState("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GEH"), value : 100 });

        vm.addUser({ module : "Seed" }, "DEF");

        // Before DEF has allowance, should fail
        tester.assertInvokeFailToChangeState("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GEH"), value : 100 });

        tester.switchUser("ABC");
        tester.invoke("approve", { spender : tester.getAccount("DEF"), value : 250 });
        tester.switchUser("DEF");
        tester.invoke("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("DEF"), value : 100 });
        tester.invoke("transferFrom", { from : tester.getAccount("ABC"), to : tester.getAccount("GHI"), value : 100 });

        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 800, "Owner should still have 800 SEED");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 100, "DEF sent 100 SEED to himself");
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("GHI") }, 100, "GHI received 100 SEED from DEF on ABC's behalf");

        tester.switchUser("GHI");
        tester.invoke("transfer", { to : tester.getAccount("ABC"), value : 50 });
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("ABC") }, 850, "ABC should have received 50 from GHI");

        tester.switchUser("DEF");
        tester.invoke("burn", { value : 25 });
        tester.assertEqual("getBalanceOf", { owner : tester.getAccount("DEF") }, 75, "DEF should have 75 after burning 25, removing it from circulation");
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
