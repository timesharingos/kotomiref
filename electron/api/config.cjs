const { ipcMain, dialog, BrowserWindow, app } = require("electron")
const { SystemConfig } = require("../config/system.cjs")
const config = require("../config/default.cjs")

/**
 * Register configuration IPC handlers
 * @param {Function} createWindow - Function to create main window
 */
function registerConfigHandlers(createWindow) {
    // Check if config is initialized
    ipcMain.handle("config:checkInitialized", () => {
        const cfg = SystemConfig.initConfig()
        return cfg ? cfg.initialized : false
    })

    // Save configuration
    ipcMain.handle("config:save", (_ev, configData) => {
        try {
            const newConfig = new SystemConfig(
                configData.dbmode,
                configData.filemode,
                configData.filedir,
                true,
                app.getVersion(),
                app.getVersion()
            )
            const success = SystemConfig.writeConfig(newConfig)
            if (success) {
                // Initialize the system with new config (including database)
                config.init(configData.dbmode, configData.filemode, configData.filedir)
                // Close config window and open main window
                const configWin = BrowserWindow.getFocusedWindow()
                if (configWin) {
                    configWin.close()
                }
                createWindow()
            }
            return success
        } catch (e) {
            console.error("Failed to save config:", e)
            return false
        }
    })

    // Get current configuration
    ipcMain.handle("config:get", () => {
        const cfg = SystemConfig.initConfig()
        return cfg ? cfg.toJSON() : null
    })

    // Select directory dialog
    ipcMain.handle("config:selectDirectory", async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (result.canceled) {
            return null
        }
        return result.filePaths[0]
    })
}

module.exports = {
    registerConfigHandlers
}
