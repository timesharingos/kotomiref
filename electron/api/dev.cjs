const { ipcMain } = require("electron")

/**
 * Register development/testing IPC handlers
 */
function registerDevHandlers() {
    // Test send handler
    ipcMain.on("dev:test", (_ev, msg) => {
        console.log("receive!" + msg)
    })

    // Test invoke handler
    ipcMain.handle("dev:bitest", (_ev, msg) => {
        console.log("bi receive!")
        return "hello ipc" + msg
    })

    // Get app version
    ipcMain.handle("dev:getVersion", () => {
        const { app } = require("electron")
        return app.getVersion()
    })
}

module.exports = {
    registerDevHandlers
}
