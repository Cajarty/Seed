const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain } = electron;
const path = require('path');
const url = require('url');

//'production': Release for public
//'development': Development tools enabled
//'debug': Debug tools active, e.g. print lines
process.env.NODE_ENV = 'development'; 


var menuTemplate = [
    {
        label: "Seed",
        submenu: [
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
    mainWindow = new BrowserWindow({width: 800, height: 500, title: 'Seed'});
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'wallet.html'),
        protocol: 'file:',
        slashes: true
    }));

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
