const { ipcMain, dialog, BrowserWindow, app } = require("electron")
const { SystemConfig } = require("../config/system.cjs")
const config = require("../config/default.cjs")
const { init_kg } = require("../kg/init.cjs")

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

    // Save configuration (for initial setup)
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
            // Initialize the system with new config (including database)
            config.init(configData.dbmode, configData.filemode, configData.filedir)
            init_kg()
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

    // Update configuration (for edit mode - only updates config file, no init)
    ipcMain.handle("config:update", (_ev, configData) => {
        try {
            const newConfig = new SystemConfig(
                configData.dbmode,
                configData.filemode,
                configData.filedir,
                configData.initialized,
                configData.stateVersion,
                configData.compatibleVersion
            )
            const success = SystemConfig.writeConfig(newConfig)
            return success
        } catch (e) {
            console.error("Failed to update config:", e)
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
