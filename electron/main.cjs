const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { Menu } = require("electron/main")

const path = require("path")
const config = require("./config/default.cjs")
const { SystemConfig } = require("./config/system.cjs")

function loadWindow(mainWin, env){
    if(app.isPackaged){
        mainWin.loadFile("./dist/index.html")
    } else if(env == "dev"){
        mainWin.loadURL("http://localhost:5173")
    } else if(env == "prod") {
        mainWin.loadFile(path.join(__dirname, "../dist/index.html"))
    } else if(app.isPackage){
        console.log("illegal type")
        app.quit()
    }
    mainWin.webContents.openDevTools()
}

function createWindow(){
    const mainWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs")
        }
    })
    Menu.setApplicationMenu(null)
    loadWindow(mainWin, process.env.NODE_ENV ?? "dev")
}
app.whenReady().then(() => {
    createWindow()
    ipcMain.on("dev:test", (ev, msg) => console.log("receive!" + msg))
    ipcMain.handle("dev:bitest", (ev, msg) => {console.log("bi receive!"); return "hello ipc" + msg})

    // Config IPC Handlers
    ipcMain.handle("config:checkInitialized", () => {
        const cfg = SystemConfig.initConfig()
        return cfg ? cfg.initialized : false
    })

    ipcMain.handle("config:save", (ev, configData) => {
        try {
            // Initialize the system with new config (including database)
            config.init(configData.dbmode, configData.filemode, configData.filedir)
            // Close config window and open main window
            const configWin = BrowserWindow.getFocusedWindow()
            if (configWin) {
                configWin.close()
            }
            createWindow()
            return true
        } catch (e) {
            console.error("Failed to save config:", e)
            return false
        }
    })

    ipcMain.handle("config:get", () => {
        const cfg = SystemConfig.initConfig()
        return cfg ? cfg.toJSON() : null
    })

    ipcMain.handle("config:selectDirectory", async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (result.canceled) {
            return null
        }
        return result.filePaths[0]
    })

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