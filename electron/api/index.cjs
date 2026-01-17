const { registerDevHandlers } = require("./dev.cjs")
const { registerConfigHandlers } = require("./config.cjs")

/**
 * Register all IPC handlers
 * @param {Function} createWindow - Function to create main window
 */
function registerAllHandlers(createWindow) {
    registerDevHandlers()
    registerConfigHandlers(createWindow)
}

module.exports = {
    registerAllHandlers
}

