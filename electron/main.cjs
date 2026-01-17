const { app, BrowserWindow } = require("electron")
const { Menu } = require("electron/main")

const path = require("path")
const config = require("./config/default.cjs")
const { SystemConfig } = require("./config/system.cjs")
const { registerAllHandlers } = require("./api/index.cjs")

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
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs")
        }
    })
    Menu.setApplicationMenu(null)
    loadWindow(mainWin, process.env.NODE_ENV ?? "dev")
}
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