/***********
 * main.js *
 ***********
 * 
 * The Main process' starting point, which is loaded when the Electron app starts.
 * 
 * This process creates the launcher window, loads the modules, runs the Seed API,
 * wraps the Seed API into a High Level API (HLAPI) for DApps to request through IPC,
 * and has extra functions available through IPC to help the convenience of DApps.
 */

const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require('path');
const url = require('url');
const promiseIpc = require('electron-promise-ipc');
const seed = require("../seedSrc/index.js");
const moduleLoader = require("./moduleLoader");

//'production': Release for public
//'development': Development tools enabled
//'debug': Debug tools active, e.g. print lines
process.env.NODE_ENV = 'development';
let windows = {};
let activeAccountEntropy = undefined;

/**
 * The menu bar's outline
 */
let menuTemplate = [
    {
        label : "Edit",
        submenu: [
            { role : "undo" },
            { role : "redo" },
            { role : "separator" },
            { role : "cut" },
            { role : "copy" },
            { role : "paste" },
            { role : "pasteandmatchstyle" },
            { role : "delete" },
            { role : "selectall" },
        ]
    },
    {
        label: "Seed",
        submenu: [
            {
                label : "Accounts",
                submenu : [
                    { label : "Account #1", click() { switchAccount("ABC"); } },
                    { label : "Account #2", click() { switchAccount("DEF"); } },
                    { label : "Account #3", click() { switchAccount("GHI"); } },
                    { label : "Account #4", click() { switchAccount("JKL"); } },
                    { label : "Account #5", click() { switchAccount("MNO"); } }
                ]
            },
            {
                label: "Relay",
                click() {
                    relayTransaction();
                }
            },
            { 
                label: "About (version 0.0.1)",
                click() {
                    //Open About Window
                }
            }, {
                type: "separator"
            }, {
                label: "Exit",
                click() {
                    app.quit();
                }
            }
        ]
    }
];

/**
 * Invoked when Electron finishes loading the Main process
 * 
 * Creates the launcher, loads the menu, dynamically loads all modules found in the /modules/ folder,
 * and then modifies the Launcher window to add buttons regarding each loaded module.
 */
app.on('ready', function() {
    windows["Launcher"] = new BrowserWindow({width: 800, height: 500, title: 'Seed Launcher'});
    windows["Launcher"].loadURL(url.format({
        pathname: path.join(__dirname, 'launcher.html'),
        protocol: 'file:',
        slashes: true
    }));

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    let javascript = "let moduleButtonsDiv = document.getElementById(\"moduleButtons\");\n";
    let loadedModules = moduleLoader.loadModules();
    let keys = Object.keys(loadedModules);
    for(let i = 0; i < keys.length; i++) {
        let loadedModule = loadedModules[keys[i]];
        let moduleButtonName = "moduleButton" + loadedModule.name;
        javascript += "let " + moduleButtonName + " = document.createElement(\"input\");\n";
        javascript += moduleButtonName + ".type = \"button\";\n";
        javascript += moduleButtonName + ".value = \"" + loadedModule.name + "\";\n";
        javascript += moduleButtonName + ".onclick = function() { launch(\"" + loadedModule.name + "\", \"" + loadedModule.dappSource + "\"); };\n";
        javascript += "moduleButtonsDiv.appendChild(" + moduleButtonName + ");\n";
    }
    windows["Launcher"].webContents.executeJavaScript(javascript);

    // Launch DApp
});

//If we're on a Mac, add an empty object to fix OS specific menubar issue
if (process.platform == 'darwin') {
    menuTemplate.unshift({});
}

//Add developer tools item not in production
if (process.env.NODE_ENV !== 'production') {
    menuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+D' : 'Ctrl+D',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }, {
                role: 'reload'
            }
        ]
    });
}

/**
 * When a Renderer requests a module be launched, the Renderer passes the name and htmlFile over,
 * and then the Main process launches the new window
 */
ipcMain.on("launchModule", function(event, windowName, htmlFile) {
    seed.newStorage(seed.newFileSystemInjector(__dirname), false);
    windows[windowName] = new BrowserWindow({width: 800, height: 500, title: windowName});
    windows[windowName].loadURL(url.format({
        pathname: path.join(__dirname, htmlFile),
        protocol: 'file:',
        slashes: true
    }));
});

/**
 * Executes JavaScript on the renderer's behalf on a DApp's window
 */
ipcMain.on("executeJavaScript", function(event, windowName, javaScriptString, callback) {
    windows[windowName].webContents.executeJavaScript(javaScriptString, callback);
});

/**
 * Runs unit tests. Assumes the state of the Seed cryptocurrency is already prepped for unit tests
 */
ipcMain.once("runUnitTests", () => {
    //let transactions = seed.getEntanglementExporter().getEntanglement();
    //console.log(transactions);
    seed.getScenarioTestExporter().seedScenarioSetupTest();
});

/**
 * Runs unit tests. Assumes the state of the Seed cryptocurrency is already prepped for unit tests
 */
ipcMain.once("loadFromDisk", () => {
    seed.newStorage(seed.newFileSystemInjector(__dirname, "data"), false).loadInitialState();
});

/**
 * Function which switches accounts (creating one if needed) based on the passed in entropy.
 * All windows are then notified of an account change, being given the new public key
 * 
 * @param {*} accountEntropy - Entropy used for creating an account
 */
function switchAccount(accountEntropy) {
    activeAccountEntropy = accountEntropy + "_123456789012345678901234567890";
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    let keys = Object.keys(windows);
    for(let i = 0; i < keys.length; i++) {
        windows[keys[i]].webContents.send("accountChanged", account.publicKey);
    }
}

// #### High Level API (HLAPI) wrapped in PromiseIPC ####
/**
 * Receives a requests through the HLAPI for an account switch to occur based on new entropy
 */
promiseIpc.on("switchAccount", function(accountEntropy) {
    switchAccount(accountEntropy);
    return activeAccountEntropy;
});

/**
 * Receives a requests through the HLAPI for the currently logged in account
 */
promiseIpc.on("getAccount", () => {
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    return account;
});

/**
 * Receives a requests through the HLAPI to get a transaction out of the ledger/entanglement based on the transaction hash
 */
promiseIpc.on("getTransaction", (transactionHash) => {
    return seed.getEntanglementExporter().getEntanglement().transactions[transactionHash];
});

/**
 * Receives a requests through the HLAPI to create a new transaction for a given module, function, passing in a set arguments
 * JSON object and the amount of transactions they with their transaction to validate.
 */
promiseIpc.on("createTransaction", (moduleName, functionName, args, numOfValidations) => {
    console.info("createTransaction", moduleName, functionName, args, numOfValidations);
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    return seed.getSVMExporter().getVirtualMachine().createTransaction(account, moduleName, functionName, args, numOfValidations);
});

/**
 * Receives a requests through the HLAPI to add a transaction to the entanglement
 */
promiseIpc.on("addTransaction", (jsonTransaction) => {
    let transaction = seed.getTransactionExporter().createExistingTransaction(jsonTransaction.sender, jsonTransaction.execution, jsonTransaction.validatedTransactions, jsonTransaction.transactionHash, jsonTransaction.signature);
    return seed.getSVMExporter().getVirtualMachine().incomingTransaction(transaction);
});

/**
 * Receives a requests through the HLAPI to invoke a "getter" function inside the given module, passing in
 * a JSON object of arguments
 */
promiseIpc.on("getter", (moduleName, getterName, args) => {
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    let svm = seed.getSVMExporter().getVirtualMachine();
    return svm.invoke({ 
        module : moduleName,
        function : getterName,
        args : args,
        user : account.publicKey,
        txHashes : []
    });
});

/**
 * Receives a requests through the HLAPI to read data from the ledger regarding a given module
 */
promiseIpc.on("read", (moduleName, dataKey, optionalUser) => {
    let moduleData = this.seed.getLedgerExporter().getLedger().getModuleData(moduleName);
    if (optionalUser) {
        return moduleData[optionalUser][dataKey];
    } else {
        return moduleData[dataKey];
    }
});

/**
 * Receives a requests through the HLAPI to subscribe for a callback to be invoked upon
 * a certain function being invoked on a given module.
 * 
 * If the windows' name is the same as the module, the "optionalWindow" parameter is not needed.
 * If its different (for example, if a game wants to be notified when a Seed transaction occurs),
 * then the optionalWindow should refer to the DApp wanting to be called back
 */
promiseIpc.on("subscribeToFunctionCallback", (moduleName, functionName, optionalWindow) => {
    if (!optionalWindow) {
        optionalWindow = moduleName;
    }
    return seed.subscribeToFunctionCallback(moduleName, functionName, () => {
        windows[optionalWindow].webContents.send((moduleName+functionName), message);
    });
});

/**
 * Receives a requests through the HLAPI to subscribe for a callback to be invoked upon
 * a certain peice of data being changed in a given module.
 * 
 * If the windows' name is the same as the module, the "optionalWindow" parameter is not needed.
 * If its different (for example, if a game wants to be notified when their user's Seed balance changes),
 * then the optionalWindow should refer to the DApp wanting to be called back
 */
promiseIpc.on("subscribeToDataChange", (moduleName, dataKey, user, optionalWindow) => {
    if (!optionalWindow) {
        optionalWindow = moduleName;
    }
    return seed.subscribeToDataChange(moduleName, dataKey, (message) => {
        windows[optionalWindow].webContents.send((moduleName+dataKey+user), message);
    }, user);
});

/**
 * Receives a requests through the HLAPI to unsubscribe for a previously subscribed callback
 */
promiseIpc.on("unsubscribe", (moduleName, funcNameOrDataKey, receipt, optionalUser) => {
    return seed.unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser);
});

/**
 * Receives a requests through the HLAPI to add a module to the Seed Virtual Machine
 */
promiseIpc.on("addModule", (newModule) => {
    let svm = seed.getSVMExporter().getVirtualMachine();
    return svm.addModule(newModule);
});

/**
 * Receives a requests through the HLAPI to create a new module based on the modules name,
 * initial state data and the initial state data of each user
 */
promiseIpc.on("createModule", (moduleName, initialStateData, initialUserStateData) => {
    return seed.getModuleExporter().createModule({ module : moduleName, data : initialStateData, initialUserData : initialUserStateData });
});

/**
 * Receives a requests through the HLAPI to fetch a module from the SVM based on the modules name
 */
promiseIpc.on("getModule", (moduleName) => {
    return seed.getSVMExporter().getModule({ module : moduleName });
});

// Switch to the first user for testing
switchAccount("ABC");