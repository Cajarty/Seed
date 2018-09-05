/***************
 * launcher.js *
 ***************
 * 
 * The JavaScript loaded into the Seed DApp Launcher
 * 
 * Buttons in the launcher can be clicked to launch a DApp.
 * There is also a button to run the unit tests
 */

const ipc = require('electron').ipcRenderer;

/**
 * Notifies the Main process through IPC that a module/DApp should be launched
 * 
 * @param {*} moduleName - Name of the module to launch
 * @param {*} htmlFile  - HTML file name of the DApp's source code
 */
function launch(moduleName, htmlFile) {
    ipc.send('launchModule', moduleName, "modules/" + moduleName.toLowerCase() + "/" + htmlFile);
}

/**
 * Notifies the main process through IPC to run the unit tests
 */
function runUnitTests() {
    ipc.send("runUnitTests");
}

/**
 * Notifies the main process through IPC to load data from the disk
 */
function loadFromDisk() {
    ipc.send("loadFromDisk");
}