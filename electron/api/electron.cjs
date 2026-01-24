const { ipcMain, dialog } = require("electron")
const fs = require("fs").promises

/**
 * Register electron utility IPC handlers
 */
function registerElectronHandlers() {
    // Read file from disk
    ipcMain.handle("electron:readFile", async (_ev, filePath) => {
        try {
            const buffer = await fs.readFile(filePath)
            return buffer
        } catch (e) {
            console.error("Failed to read file:", e)
            throw e
        }
    })

    // Select file and return absolute path
    ipcMain.handle("electron:selectFile", async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Documents', extensions: ['md', 'txt', 'doc', 'docx', 'pdf'] },
                    { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            })

            if (result.canceled || result.filePaths.length === 0) {
                return null
            }

            return result.filePaths[0]
        } catch (e) {
            console.error("Failed to select file:", e)
            return null
        }
    })
}

module.exports = {
    registerElectronHandlers
}

