const { SystemConfig } = require("./system.cjs")
const db_mapping = {
    "sqlite": require("../db/sqlite/init.cjs").SqliteDb
}

let db = null
let config = null

function init(dbmode = "sqlite", filemode = "readonly", filedir = ""){
    config = SystemConfig.initConfig()
    if(config === null || !config.initialized){
        config = new systemConfig.SystemConfig(dbmode, filemode, filedir, true, process.env.npm_package_version, process.env.npm_package_version)
        SystemConfig.writeConfig(config)
    }
    db = new db_mapping[dbmode]()
}

function getConfig(){
    return config
}

module.exports = {
    init, getConfig,
    invokeDb: (func) => {return func(db)},
}