const path = require("path")
const fs = require("fs")

class SystemConfig{
    // sqlite only currently
    #dbmode
    // readonly/copy/cut
    #filemode
    #filedir
    #initialized
    #stateVersion
    #compatibleVersion

    static #dbmode_allowed = ["sqlite"]
    static #filemode_allowed = ["readonly", "copy", "cut"]

    constructor(dbmode, filemode, filedir, initialized, stateVersion, compatibleVersion){
        this.#dbmode = dbmode
        this.#filemode = filemode
        this.#filedir = filedir
        this.#initialized = initialized
        this.#stateVersion = stateVersion
        this.#compatibleVersion = compatibleVersion
    }
    get dbmode(){return this.#dbmode}
    get filemode(){return this.#filemode}
    get filedir(){return this.#filedir}
    get initialized(){return this.#initialized}
    get stateVersion(){return this.#stateVersion}
    get compatibleVersion(){return this.#compatibleVersion}

    static get dbmode_allowed(){return SystemConfig.#dbmode_allowed}
    static get filemode_allowed(){return SystemConfig.#filemode_allowed}

    static #checkAllowed(mode, allowed){
        return allowed.includes(mode)
    }

    static initConfig(){
        let config = readConfig()
        if(config !== null){
            return config
        }
        return {
            dbmode: "sqlite",
            filemode: "readonly",
            filedir: "",
            initialized: false,
            stateVersion: process.env.npm_package_version,
            compatibleVersion: process.env.npm_package_version,
        }
    }

    static readConfig(){
        const { app } = require("electron")
        const config_path = path.join(app.getPath("userData"), "config.json")
        if(fs.existsSync(config_path)){
            return JSON.parse(fs.readFileSync(config_path))
        } else {
            return null
        }
    }

    static writeConfig(config){
        if(!SystemConfig.#checkAllowed(config.#dbmode, SystemConfig.dbmode_allowed) || !SystemConfig.#checkAllowed(config.#filemode, SystemConfig.filemode_allowed)){
            return false
        }
        fs.writeFileSync(config_path, JSON.stringify(config))
        return true
    }

    changeDbMode(newMode){
        if(SystemConfig.#checkAllowed(newMode, SystemConfig.dbmode_allowed)){
            return false
        }
        let config = readConfig()
        if(config === null){
            return false
        }
        config.#dbmode = newMode
        return SystemConfig.writeConfig(config)
    }

    changeFileDir(newDir){
        let config = SystemConfig.readConfig()
        if(config === null){
            return false
        }
        if(config.#filemode === "readonly"){
            return false
        }
        config.#filedir = newDir
        let result = SystemConfig.writeConfig(config)
        if(result){
            let files = fs.readdirSync(config.#filedir)
            if(!fs.existsSync(newDir)){
                fs.mkdirSync(newDir)
            }
            for(let file of files){
                fs.copyFileSync(path.join(config.#filedir, file), path.join(newDir, file))
            }
        }
        return result
    }

    initialize(){
        let config = readConfig()
        if(config === null){
            return false
        }
        config.initialized = true
        return SystemConfig.writeConfig(config)
    }

    isUpdated(newVersion){
        let newVersionPartition = newVersion.split(".")
        let curVersionPartition = this.#stateVersion.split(".")
        for(let i = 0; i < newVersionPartition.length; i++){
            if(newVersionPartition[i] > curVersionPartition[i]){
                return true
            } else if(newVersionPartition[i] < curVersionPartition[i]){
                return false
            }
        }
        return false
    }
}


module.exports = {
    SystemConfig
}