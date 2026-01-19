const { registerDevHandlers } = require("./dev.cjs")
const { registerConfigHandlers } = require("./config.cjs")
const { registerDataHandlers } = require("./data.cjs")
const { registerAffiliationHandlers } = require("./affiliation.cjs")
const { registerAuthorHandlers } = require("./author.cjs")

/**
 * Register all IPC handlers
 * @param {Function} createWindow - Function to create main window
 */
function registerAllHandlers(createWindow) {
    registerDevHandlers()
    registerConfigHandlers(createWindow)
    registerDataHandlers(createWindow)
    registerAffiliationHandlers()
    registerAuthorHandlers()
}

module.exports = {
    registerAllHandlers
}

