const { app, BrowserWindow, ipcMain } = require("electron")

const path = require("path")

function loadWindow(mainWin, env){
    if(env == "dev"){
        mainWin.loadURL("http://localhost:5173")
    } else if(env == "prod") {
        mainWin.loadFile(path.join(__dirname, "../dist/index.html"))
    } else {
        console.log("illegal type")
        app.quit()
    }
}

function createWindow(){
    const mainWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs")
        }
    })
    loadWindow(mainWin, process.env.NODE_ENV ?? "dev")
}
app.whenReady().then(() => {
    createWindow()
    ipcMain.on("dev:test", (ev, msg) => console.log("receive!" + msg))
    ipcMain.handle("dev:bitest", (ev, msg) => {console.log("bi receive!"); return "hello ipc" + msg})

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