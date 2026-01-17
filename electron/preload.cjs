const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld(
    'dev',
    {
        send: (msg) => ipcRenderer.send("dev:test", msg),
        invoke: (msg) => ipcRenderer.invoke("dev:bitest", msg)
    }
)

contextBridge.exposeInMainWorld(
    'config',
    {
        checkInitialized: () => ipcRenderer.invoke("config:checkInitialized"),
        saveConfig: (config) => ipcRenderer.invoke("config:save", config),
        getConfig: () => ipcRenderer.invoke("config:get"),
        selectDirectory: () => ipcRenderer.invoke("config:selectDirectory")
    }
)