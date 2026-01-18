const { ipcMain, dialog, app, BrowserWindow } = require("electron")
const path = require("path")
const fs = require("fs")

/**
 * Register data management IPC handlers
 * @param {Function} createWindow - Function to create main window
 */
function registerDataHandlers(createWindow) {
    // Backup data
    ipcMain.handle("data:backup", async (_ev, targetDir, includeConfig) => {
        try {
            const userDataPath = app.getPath("userData")
            const dbPath = path.join(userDataPath, "kotomiref.db")
            const configPath = path.join(userDataPath, "config.json")

            // Ensure target directory exists
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
            }

            // Backup database
            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, path.join(targetDir, "kotomiref.db"))
            }

            // Backup config if requested
            if (includeConfig && fs.existsSync(configPath)) {
                fs.copyFileSync(configPath, path.join(targetDir, "config.json"))
            }

            return true
        } catch (e) {
            console.error("Failed to backup data:", e)
            return false
        }
    })

    // Restore data
    ipcMain.handle("data:restore", async (_ev, sourceDir, includeConfig) => {
        try {
            const userDataPath = app.getPath("userData")
            const dbPath = path.join(userDataPath, "kotomiref.db")
            const configPath = path.join(userDataPath, "config.json")

            const sourceDbPath = path.join(sourceDir, "kotomiref.db")
            const sourceConfigPath = path.join(sourceDir, "config.json")

            // Restore database
            if (fs.existsSync(sourceDbPath)) {
                fs.copyFileSync(sourceDbPath, dbPath)
            } else {
                return false
            }

            // Restore config if requested
            if (includeConfig && fs.existsSync(sourceConfigPath)) {
                fs.copyFileSync(sourceConfigPath, configPath)
            }

            return true
        } catch (e) {
            console.error("Failed to restore data:", e)
            return false
        }
    })

    // Reset data
    ipcMain.handle("data:reset", async (_ev, includeConfig) => {
        try {
            const userDataPath = app.getPath("userData")
            const dbPath = path.join(userDataPath, "kotomiref.db")
            const configPath = path.join(userDataPath, "config.json")

            // Clear all data from database tables
            if (fs.existsSync(dbPath)) {
                const Database = require("better-sqlite3")
                const db = new Database(dbPath)

                try {
                    // Delete all data from tables (in reverse order to respect foreign keys)
                    db.prepare("DELETE FROM rel").run()
                    db.prepare("DELETE FROM node").run()
                    db.prepare("DELETE FROM attribute").run()
                    db.prepare("DELETE FROM type").run()

                    db.close()
                } catch (e) {
                    db.close()
                    throw e
                }
            }

            // If includeConfig, set initialized to false
            if (includeConfig && fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
                config.initialized = false
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
            }

            // Close current window and reopen
            const currentWindow = BrowserWindow.getFocusedWindow()
            if (currentWindow) {
                currentWindow.close()
            }

            createWindow()

            return true
        } catch (e) {
            console.error("Failed to reset data:", e)
            return false
        }
    })

    // Select directory for backup/restore
    ipcMain.handle("data:selectDirectory", async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory']
        })
        if (result.canceled) {
            return null
        }
        return result.filePaths[0]
    })
}

module.exports = {
    registerDataHandlers
}

