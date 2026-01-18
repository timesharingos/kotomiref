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
        selectDirectory: () => ipcRenderer.invoke("config:selectDirectory")
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
