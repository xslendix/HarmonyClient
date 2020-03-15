const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');

const net = require('net');
const dns = require('dns');

app.allowRendererProcessReuse = true;

var data = {};

var win=null, win2=null;
var win2ready = false;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        resizable: false
    });

    // win.setMenu(null);
    win.loadFile('public/index.html');

    win.on('close', e => {
        e.preventDefault();
        app.exit();
    });

    /////////////////////////////////////////////////

    win2 = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // win2.setMenu(null);
    win2.loadFile('public/chat.html');
    win2.setTitle('Not connected');
    win2.hide();

    win2.webContents.once('dom-ready', () => {win2ready=true});

    win2.on('close', e => {
        e.preventDefault();
        win2.hide();
        win.show();
        data.auth.destroy();
        data.chat.destroy();
        data.chat=null;
        data.auth=null;
        data.chatip="127.0.0.1";
        data.authip="127.0.0.1";
        data.username="Test"
        win.webContents.send('resetvals');
        win2.setTitle('Not connected');
    });
}

function connect(authip, chatip, username) {
    data.authip = authip;
    data.chatip = chatip;
    data.username = username;

    while(!win2ready);

    data.chat = net.createConnection(8080, data.chatip);
    data.auth = net.createConnection(8090, data.authip);

    dns.lookup(authip, {
        family: 4,
        hints: dns.ADDRCONFIG | dns.V4MAPPED
    }, (err, addr, family) => {
            data.auth.write(JSON.stringify(
                {
                    intent: "register", 
                    data: {
                        id: data.username, 
                        server: addr
                    }
                }
            ));
        }
    );

    data.auth.on('data', (data) => {
        win2.webContents.send('authdata', data);
    });
    
    data.chat.on('data', (data) => {
        win2.webContents.send('chatdata', data);
    });
}

ipcMain.on('win2ready', (e) => {
    win2ready=true;
});

ipcMain.on('sendchatdata', (e, data2) => {
    data.chat.write(data2);
});

ipcMain.on('ExitApp', (e, arg) => {
    app.exit();
});

ipcMain.on('connect', (e, authip, chatip, username) => {
    console.log(authip, chatip, username);
    win.hide();
    win2.show();
    connect(authip, chatip, username);
    win2.setTitle(`Connected to auth server ${authip}, chat server ${chatip}`);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if(process.platform !== "darwin") {
        app.quit();
    }
})

app.on('activate', () => {
    if(BrowserWindow.getAllWindows.length === 0) {
        createWindow()
    }
})
