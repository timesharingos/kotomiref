const { SystemConfig } = require("./system.cjs")
const db_mapping = {
    "sqlite": require("../db/sqlite/init.cjs").SqliteDb
}

let db = null
let config = null

function init(dbmode = "sqlite", filemode = "readonly", filedir = ""){
    config = SystemConfig.initConfig()
    if(config === null || !config.initialized){
        db = new db_mapping[dbmode]()
        config = new SystemConfig(dbmode, filemode, filedir, true, process.env.npm_package_version || "0.0.0", process.env.npm_package_version || "0.0.0")
        SystemConfig.writeConfig(config)
    } else
        db = new db_mapping[config.dbmode]()
}

function getConfig(){
    return config
}

module.exports = {
    init, getConfig,
    invokeDb: (func) => {return func(db)},
}