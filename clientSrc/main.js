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
    console.info(javascript);
    windows["Launcher"].webContents.executeJavaScript(javascript);
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

ipcMain.on("launchModule", function(event, windowName, htmlFile) {
    windows[windowName] = new BrowserWindow({width: 800, height: 500, title: windowName});
    windows[windowName].loadURL(url.format({
        pathname: path.join(__dirname, htmlFile),
        protocol: 'file:',
        slashes: true
    }));
});

ipcMain.on("runOnMainThread", function(event, windowName, funcToRun) {
    if (funcToRun) {
        funcToRun(windows[windowName]);
    }
});

ipcMain.on("executeJavaScript", function(event, windowName, javaScriptString, callback) {
    windows[windowName].webContents.executeJavaScript(javaScriptString, callback);
});

ipcMain.once("runUnitTests", () => {
    seed.getScenarioTestExporter().seedScenarioSetupTest();
});

function switchAccount(accountEntropy) {
    activeAccountEntropy = accountEntropy + "_123456789012345678901234567890";
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    let keys = Object.keys(windows);
    for(let i = 0; i < keys.length; i++) {
        windows[keys[i]].webContents.send("accountChanged", account.publicKey);
    }
    // Ideally send to the new account through IPC
}

// #### High Level API (HLAPI) wrapped in PromiseIPC ####
promiseIpc.on("switchAccount", function(accountEntropy) {
    switchAccount(accountEntropy);
    return activeAccountEntropy;
});

promiseIpc.on("getAccount", () => {
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    return account;
});

promiseIpc.on("getTransaction", (transactionHash) => {
    return seed.getEntanglementExporter().getEntanglement().transactions[transactionHash];
});

promiseIpc.on("createTransaction", (moduleName, functionName, args, numOfValidations) => {
    let account = seed.getAccountExporter().newAccount( { entropy : activeAccountEntropy, network : "00" });
    return seed.getSVMExporter().getVirtualMachine().createTransaction(account, moduleName, functionName, args, numOfValidations);
});

promiseIpc.on("addTransaction", (jsonTransaction) => {
    let transaction = seed.getTransactionExporter().createExistingTransaction(jsonTransaction.sender, jsonTransaction.execution, jsonTransaction.validatedTransactions, jsonTransaction.transactionHash, jsonTransaction.signature);
    return seed.getSVMExporter().getVirtualMachine().incomingTransaction(transaction);
});

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

promiseIpc.on("read", (moduleName, dataKey, optionalUser) => {
    let moduleData = this.seed.getLedgerExporter().getLedger().getModuleData(moduleName);
    if (optionalUser) {
        return moduleData[optionalUser][dataKey];
    } else {
        return moduleData[dataKey];
    }
});

promiseIpc.on("subscribeToFunctionCallback", (moduleName, functionName) => {
    return seed.subscribeToFunctionCallback(moduleName, functionName, () => {
        console.info("TODO", "subscribeToFunctionCallback", "When the callback happens, callback " + (moduleName+functionName) + " through IPC renderer, so they ipc.on for it");
    });
});

promiseIpc.on("subscribeToDataChange", (moduleName, dataKey, user) => {
    return seed.subscribeToDataChange(moduleName, dataKey, () => {
        console.info("TODO", "subscribeToDataChange", "When the callback happens, callback " + (moduleName+dataKey+user) + " through IPC renderer, so they ipc.on for it");
    }, user);
});

promiseIpc.on("unsubscribe", (moduleName, funcNameOrDataKey, receipt, optionalUser) => {
    return seed.unsubscribe(moduleName, funcNameOrDataKey, receipt, optionalUser);
});

promiseIpc.on("addModule", (newModule) => {
    let svm = seed.getSVMExporter().getVirtualMachine();
    return svm.addModule(newModule);
});

promiseIpc.on("createModule", (moduleName, initialStateData, initialUserStateData) => {
    return seed.getModuleExporter().createModule({ module : moduleName, data : initialStateData, initialUserData : initialUserStateData });
});

promiseIpc.on("getModule", (moduleName) => {
    return seed.getSVMExporter().getModule({ module : moduleName });
});

seed.getEntanglementExporter().getEntanglement();
switchAccount("ABC");