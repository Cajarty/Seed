

const ipc = require('electron').ipcRenderer;

function launch(moduleName, htmlFile) {
    ipc.send('launchModule', moduleName, "modules/" + moduleName.toLowerCase() + "/" + htmlFile);
}