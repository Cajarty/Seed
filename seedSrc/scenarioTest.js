
const cryptoHelperExporter = require("./cryptoHelper.js");
const accountExporter = require("./account.js");
const cryptographyHelper = cryptoHelperExporter.newCryptoHelper();
const virtualMachineExporter = require("./virtualMachine.js");
const moduleExporter = require("./module.js");
const seedExporter = require("./seed.js");

module.exports = {
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
    vmModuleTest : function() {
        console.log("Module Test::Create Game");
        let vm = virtualMachineExporter.createVirtualMachine();
        let game = moduleExporter.createModule({
            module : "Game", 
            data : { walls : [[1, 1, 1], [0, 0, 0], [0, 0, 0]] },
            initialUserData : { x : 2, y : 1 }
        });
        
        let moveLeft = function(container, changeContext) {
            let gameData = container.getModuleData("Game");
            let userData = container.getUserData("Game", container.sender);
            let walls = gameData["walls"];
            if (walls[userData["x"] - 1][userData["y"]] == 0) {
                changeContext.subtract(1, { user : container.sender, key : "x" });
            }
            return changeContext;
        }
        
        game.addFunction({
            invoke : moveLeft, 
            name : "moveLeft"
        });
        
        console.log("Add Game to VM");
        vm.addModule(game);
        console.log("Add user to Game in VM");
        vm.addUser({module : "Game"}, "ABC");
        console.info("User Data In Module (Default)", vm.getModule({module : "Game"}).data["userData"]);
        
        console.log("Invoke \"MoveLeft\" function on user");
        let changeContext = vm.simulate({module : "Game", function : "moveLeft", user : "ABC"});
        console.info("Changes caused by \"MoveLeft\"", changeContext);
        vm.applyChangeContext({module : "Game"}, changeContext);
        console.info("User data after moving left the first time", vm.getModule({module : "Game"}));
    
        console.log("Invoke \"MoveLeft\" function on user");
        changeContext = vm.simulate({module : "Game", function : "moveLeft", user : "ABC"});
        console.info("Changes caused by \"MoveLeft\"", changeContext);
        vm.applyChangeContext({module : "Game"}, changeContext);
        console.info("User data after moving left the second time", vm.getModule({module : "Game"}));

        console.log("VM Test Complere");
    },
    seedModuleTest : function() {
        console.log("SeedModuleTest::Start")

        let vm = virtualMachineExporter.createVirtualMachine();
        let seedModule = seedExporter.getSeed();

        console.log("Add Seed Module To VM")
        vm.addModule(seedModule);

        console.log("Construct Seed")
        vm.invoke({ 
            module : "Seed", 
            function : "constructor", 
            user : "ABC", 
            args : {
                initialSeed : 1000
            } 
        });

        console.info("getBalanceOf creator", vm.invoke({ module : "Seed", function : "getBalanceOf", user : "ABC", args : { owner : "ABC" } }));
        console.info("getSymbol", vm.invoke({ module : "Seed", function : "getSymbol", user : "ABC" }));
        console.info("getDecimals", vm.invoke({ module : "Seed", function : "getDecimals", user : "ABC" }));
        console.info("getTotalSupply", vm.invoke({ module : "Seed", function : "getTotalSupply", user : "ABC" }));
        console.info("getAllowance before allowance set [Expected Fail]", vm.invoke({ module : "Seed", function : "getAllowance", user : "ABC", args : { owner : "ABC", spender : "DEF" } }));

        console.info("TransferFrom before DEF exists or allowance set [Expected Fail]");
        console.log(vm.invoke({ module : "Seed", function : "transferFrom", user : "DEF", args : { from : "ABC", to : "GEH", value : 100 } }));

        console.log("Add user DEF");
        vm.addUser({ module : "Seed" }, "DEF");

        console.info("TransferFrom before allowance set [Expected Fail]");
        console.log(vm.invoke({ module : "Seed", function : "transferFrom", user : "DEF", args : { from : "ABC", to : "GEH", value : 100 } }));

        console.info("Give DEF allowance for ABC");
        console.log(vm.invoke({ module : "Seed", function : "approve", user : "ABC", args : { spender : "DEF", value : 250 } }));

        console.info("TransferFrom with allowance to added user");
        console.log(vm.invoke({ module : "Seed", function : "transferFrom", user : "DEF", args : { from : "ABC", to : "DEF", value : 100 } }));

        console.info("TransferFrom with allowance to a user that has not been added yet [Should add user and send to them]");
        console.log(vm.invoke({ module : "Seed", function : "transferFrom", user : "DEF", args : { from : "ABC", to : "GHI", value : 100 } }));

        console.info("getBalanceOf ABC (should be 800)", vm.invoke({ module : "Seed", function : "getBalanceOf", user : "ABC", args : { owner : "ABC" } }));
        console.info("getBalanceOf DEF (should be 100)", vm.invoke({ module : "Seed", function : "getBalanceOf", user : "DEF", args : { owner : "DEF" } }));
        console.info("getBalanceOf GHI (should be 100)", vm.invoke({ module : "Seed", function : "getBalanceOf", user : "GHI", args : { owner : "GHI" } }));

        console.info("Transfer GHI 50 SEED to ABC");
        console.log(vm.invoke({ module : "Seed", function : "transfer", user : "GHI", args : { to : "ABC", value : 50 } }));

        console.info("DEF burns 25 SEED");
        console.log(vm.invoke({ module : "Seed", function : "burn", user : "DEF", args : {value : 25 } }));

        console.info(seedModule.data);
    }
 }