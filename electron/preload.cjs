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
    'electron',
    {
        readFile: (filePath) => ipcRenderer.invoke("electron:readFile", filePath),
        selectFile: () => ipcRenderer.invoke("electron:selectFile")
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
    'signature',
    {
        getAll: () => ipcRenderer.invoke("signature:getAll"),
        getByReference: (referenceId) => ipcRenderer.invoke("signature:getByReference", referenceId),
        save: (data) => ipcRenderer.invoke("signature:save", data),
        delete: (id) => ipcRenderer.invoke("signature:delete", id),
        linkToReference: (referenceId, signatureId) => ipcRenderer.invoke("signature:linkToReference", referenceId, signatureId),
        unlinkFromReference: (referenceId, signatureId) => ipcRenderer.invoke("signature:unlinkFromReference", referenceId, signatureId)
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

contextBridge.exposeInMainWorld(
    'entity',
    {
        // Penetration APIs
        getRelatedEntity: (realEntityId) => ipcRenderer.invoke("entity:getRelatedEntity", realEntityId),
        getRelatedNodes: (entityId) => ipcRenderer.invoke("entity:getRelatedNodes", entityId),

        // Entity APIs (abstract layer)
        getAllEntities: () => ipcRenderer.invoke("entity:getAllEntities"),
        getEntityById: (entityId) => ipcRenderer.invoke("entity:getEntityById", entityId),
        addEntity: (data) => ipcRenderer.invoke("entity:addEntity", data),
        updateEntity: (entityId, data) => ipcRenderer.invoke("entity:updateEntity", entityId, data),
        deleteEntity: (entityId) => ipcRenderer.invoke("entity:deleteEntity", entityId),

        // Node APIs (concrete layer)
        getAllNodes: (entityType) => ipcRenderer.invoke("entity:getAllNodes", entityType),
        getNodeById: (nodeId) => ipcRenderer.invoke("entity:getNodeById", nodeId),
        addNode: (entityType, data) => ipcRenderer.invoke("entity:addNode", entityType, data),
        updateNode: (nodeId, data) => ipcRenderer.invoke("entity:updateNode", nodeId, data),
        deleteNode: (nodeId) => ipcRenderer.invoke("entity:deleteNode", nodeId)
    }
)

contextBridge.exposeInMainWorld(
    'article',
    {
        getAll: () => ipcRenderer.invoke("article:getAll"),
        getById: (id) => ipcRenderer.invoke("article:getById", id),
        add: (data) => ipcRenderer.invoke("article:add", data),
        update: (data) => ipcRenderer.invoke("article:update", data),
        delete: (id) => ipcRenderer.invoke("article:delete", id)
    }
)

contextBridge.exposeInMainWorld(
    'search',
    {
        problemEvolutionChain: (problemId) => ipcRenderer.invoke("search:problemEvolutionChain", problemId),
        definitionEvolutionChain: (definitionId) => ipcRenderer.invoke("search:definitionEvolutionChain", definitionId),
        entityImprovementPath: (entityId) => ipcRenderer.invoke("search:entityImprovementPath", entityId),
        problemDefinitionsAndSolutions: (problemId) => ipcRenderer.invoke("search:problemDefinitionsAndSolutions", problemId),
        oneHopNeighbors: (nodeId) => ipcRenderer.invoke("search:oneHopNeighbors", nodeId)
    }
)
