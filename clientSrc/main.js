const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require('path');
const url = require('url');

//'production': Release for public
//'development': Development tools enabled
//'debug': Debug tools active, e.g. print lines
process.env.NODE_ENV = 'development';
let windows = {};
let activeAccountEntropy = undefined;//switchAccount("ABC");

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

    //windows["Seed"] = new BrowserWindow({width: 800, height: 500, title: 'Seed'});
    //windows["Seed"].loadURL(url.format({
    //    pathname: path.join(__dirname, 'seed.html'),
    //    protocol: 'file:',
    //    slashes: true
    //}));

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
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

ipcMain.on("reloadBalance", function(event, balance) {
    let repaintStr = "document.getElementById(\"seedBalance\").innerHTML = " + balance + ";";
    windows["Seed"].webContents.executeJavaScript(repaintStr, function (result) {});
});

ipcMain.on("reloadAddress", function(event, address) {
    let repaintStr = "document.getElementById(\"seedAddress\").innerHTML = \"" + address + "\";";
    windows["Seed"].webContents.executeJavaScript(repaintStr, function (result) {});
});

ipcMain.on("activeUserRequest", function(event) {
    event.sender.send("activeUserResponse", activeAccountEntropy);
});

ipcMain.on("inputFieldsRequest", function(event, funcToCall) {
    let getBalance = "document.getElementById(\"inValue\").value;";
    windows["Seed"].webContents.executeJavaScript(getBalance, function (balance) {
        balance = parseInt(balance);
        let getAddress = "document.getElementById(\"inAddress\").value;";
        windows["Seed"].webContents.executeJavaScript(getAddress, function (address) {
            event.sender.send("inputFieldsResponse", balance, address, funcToCall);
        });
    });
});

function switchAccount(accountEntropy) {
    activeAccountEntropy = accountEntropy + "_123456789012345678901234567890";
    // Ideally send to the 
}

function relayTransaction() {
    console.info("relayTransaction");
}

