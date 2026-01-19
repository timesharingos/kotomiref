const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld(
    'dev',
    {
        send: (msg) => ipcRenderer.send("dev:test", msg),
        invoke: (msg) => ipcRenderer.invoke("dev:bitest", msg),
        getVersion: () => ipcRenderer.invoke("dev:getVersion")
    }
)

contextBridge.exposeInMainWorld(
    'config',
    {
        checkInitialized: () => ipcRenderer.invoke("config:checkInitialized"),
        saveConfig: (config) => ipcRenderer.invoke("config:save", config),
        updateConfig: (config) => ipcRenderer.invoke("config:update", config),
        getConfig: () => ipcRenderer.invoke("config:get"),
        selectDirectory: () => ipcRenderer.invoke("config:selectDirectory"),
        initOnly: () => ipcRenderer.invoke("config:initOnly")
    }
)

contextBridge.exposeInMainWorld(
    'data',
    {
        backup: (targetDir, includeConfig) => ipcRenderer.invoke("data:backup", targetDir, includeConfig),
        restore: (sourceDir, includeConfig) => ipcRenderer.invoke("data:restore", sourceDir, includeConfig),
        reset: (includeConfig) => ipcRenderer.invoke("data:reset", includeConfig),
        selectDirectory: () => ipcRenderer.invoke("data:selectDirectory")
    }
)

contextBridge.exposeInMainWorld(
    'affiliation',
    {
        getAll: () => ipcRenderer.invoke("affiliation:getAll"),
        getHierarchy: () => ipcRenderer.invoke("affiliation:getHierarchy"),
        add: (data) => ipcRenderer.invoke("affiliation:add", data),
        update: (data) => ipcRenderer.invoke("affiliation:update", data),
        delete: (id) => ipcRenderer.invoke("affiliation:delete", id)
    }
)

contextBridge.exposeInMainWorld(
    'author',
    {
        getAll: () => ipcRenderer.invoke("author:getAll"),
        getAffiliations: () => ipcRenderer.invoke("author:getAffiliations"),
        add: (data) => ipcRenderer.invoke("author:add", data),
        update: (data) => ipcRenderer.invoke("author:update", data),
        delete: (id) => ipcRenderer.invoke("author:delete", id)
    }
)

contextBridge.exposeInMainWorld(
    'domain',
    {
        getAllMain: () => ipcRenderer.invoke("domain:getAllMain"),
        getAllSub: () => ipcRenderer.invoke("domain:getAllSub"),
        getSubRelations: () => ipcRenderer.invoke("domain:getSubRelations"),
        addMain: (data) => ipcRenderer.invoke("domain:addMain", data),
        updateMain: (data) => ipcRenderer.invoke("domain:updateMain", data),
        deleteMain: (id) => ipcRenderer.invoke("domain:deleteMain", id),
        addSub: (data) => ipcRenderer.invoke("domain:addSub", data),
        updateSub: (data) => ipcRenderer.invoke("domain:updateSub", data),
        deleteSub: (id) => ipcRenderer.invoke("domain:deleteSub", id)
    }
)

