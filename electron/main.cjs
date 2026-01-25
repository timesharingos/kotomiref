const { app, BrowserWindow } = require("electron")
const { Menu } = require("electron/main")

const path = require("path")
const config = require("./config/default.cjs")
const { SystemConfig } = require("./config/system.cjs")
const { registerAllHandlers } = require("./api/index.cjs")
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

function loadWindow(mainWin, env){
    if(app.isPackaged){
        mainWin.loadFile("./dist/index.html")
    } else if(env == "dev"){
        mainWin.loadURL("http://localhost:5173")
        mainWin.webContents.openDevTools()
    } else if(env == "prod") {
        mainWin.loadFile(path.join(__dirname, "../dist/index.html"))
    } else if(app.isPackage){
        console.log("illegal type")
        app.quit()
    }
}

function createWindow(){
    const mainWin = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs")
        }
    })
    Menu.setApplicationMenu(null)
    loadWindow(mainWin, process.env.NODE_ENV ?? "dev")
}
autoUpdater.on('checking-for-update', () => {
  toast.info('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  toast.info('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  toast.info('Update not available.');
})
autoUpdater.on('error', (err) => {
  toast.info('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  toast.info(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  toast.info('Update downloaded');
});
app.whenReady().then(() => {
    // Register all IPC handlers
    registerAllHandlers(createWindow)
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})