
const cryptoHelperExporter = require("./cryptoHelper.js");
const accountExporter = require("./account.js");
const cryptographyHelper = cryptoHelperExporter.newCryptoHelper();
const virtualMachineExporter = require("./virtualMachine.js");
const moduleExporter = require("./module.js");

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
        let changeContext = vm.invoke({module : "Game", function : "moveLeft", user : "ABC"});
        console.info("Changes caused by \"MoveLeft\"", changeContext);
        vm.applyChangeContext({module : "Game"}, changeContext);
        console.info("User data after moving left the first time", vm.getModule({module : "Game"}));
    
        console.log("Invoke \"MoveLeft\" function on user");
        changeContext = vm.invoke({module : "Game", function : "moveLeft", user : "ABC"});
        console.info("Changes caused by \"MoveLeft\"", changeContext);
        vm.applyChangeContext({module : "Game"}, changeContext);
        console.info("User data after moving left the second time", vm.getModule({module : "Game"}));

        console.log("VM Test Complere");
    }
 }