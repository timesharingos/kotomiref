const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld(
    'dev',
    {
        send: (msg) => ipcRenderer.send("dev:test", msg),
        invoke: (msg) => ipcRenderer.invoke("dev:bitest", msg)
    }
)