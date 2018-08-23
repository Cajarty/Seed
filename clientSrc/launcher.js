const ipc = require('electron').ipcRenderer;

function launch(moduleName, htmlFile) {
    console.info("laucner", moduleName, htmlFile);
    ipc.send('launchModule', moduleName, "modules/" + moduleName.toLowerCase() + "/" + htmlFile);
}

function runUnitTests() {
    ipc.send("runUnitTests");
}