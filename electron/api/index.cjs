const { registerDevHandlers } = require("./dev.cjs")
const { registerConfigHandlers } = require("./config.cjs")
const { registerDataHandlers } = require("./data.cjs")
const { registerAffiliationHandlers } = require("./affiliation.cjs")
const { registerAuthorHandlers } = require("./author.cjs")
const { registerDomainHandlers } = require("./domain.cjs")
const { registerEntityHandlers } = require("./entity.cjs")
const { registerArticleHandlers } = require("./article.cjs")
const { registerElectronHandlers } = require("./electron.cjs")

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
    registerDomainHandlers()
    registerEntityHandlers()
    registerArticleHandlers()
    registerElectronHandlers()
}

module.exports = {
    registerAllHandlers
}

