console.log("seedSrc npm hit");
const cryptographyExporter = require("./cryptography.js");
const cryptographyHelper = cryptographyExporter.newCryptographyHelper();
const cryptographyUnitTests = cryptographyExporter.newCryptographyUnitTests();
cryptographyUnitTests.RunTests();
console.log("Test Complete");

console.log("Module Test::Create Game");
const virtualMachineExporter = require("./virtualMachine.js");
let vm = virtualMachineExporter.createVirtualMachine();
let game = virtualMachineExporter.createModule({module : "Game", version : "1"});

let moveLeft = function(container, changeContext, user) {
    let gameData = container.getModuleData("Game");
    let userData = container.getUserData("Game", user);
    let walls = gameData.get("walls"); //[,]
    if (walls[userData.x - 1][userData.y] == 0) {
        changeContext.subtract(user, "x", 1);
    }
    return changeContext;
}

game.addFunction({
    invoke : moveLeft, 
    name : "moveLeft", 
    version : "1",
    data : { walls : [[1, 1, 1], [0, 0, 0], [0, 0, 0]] },
    initialuserData : { x : 2, y : 1 }
});

console.log("Add Game to VM");
vm.addModule(game);

console.log("Add user to Game in VM");
vm.addUser({module : "Game", version : "1"}, "ABC");

console.log("Make user move left");
let changeContext = vm.invoke({module : "Game", version : "1", function : "moveLeft", user : "ABC"});
console.info("ChangeContext", changeContext);
