const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const kg_interface = require("../kg/interface.cjs")
const subjectType = require("../kg/reftype/subject.cjs")

/**
 * Register domain management IPC handlers
 */
function registerDomainHandlers() {
    // Get all main domains (Subject)
    ipcMain.handle("domain:getAllMain", async () => {
        try {
            return invokeDb((db) => {
                const subjectTypeInst = subjectType.Subject.instance
                const nodes = db.nodeops.queryNodesByType(subjectTypeInst.id)

                return nodes.map(node => ({
                    id: node.id,
                    name: node.name
                }))
            })
        } catch (e) {
            console.error("Failed to get main domains:", e)
            return []
        }
    })

    // Get all sub domains (SubSubject)
    ipcMain.handle("domain:getAllSub", async () => {
        try {
            return invokeDb((db) => {
                const subSubjectTypeInst = subjectType.SubSubject.instance
                const nodes = db.nodeops.queryNodesByType(subSubjectTypeInst.id)

                return nodes.map(node => ({
                    id: node.id,
                    name: node.name,
                    mainDomainId: null // Will be populated from relations
                }))
            })
        } catch (e) {
            console.error("Failed to get sub domains:", e)
            return []
        }
    })

    // Get sub domain relations (SubSubject -> Subject)
    ipcMain.handle("domain:getSubRelations", async () => {
        try {
            return invokeDb((db) => {
                const subSubjectRelType = subjectType.SubSubjectRel.instance
                const rels = db.relops.queryRelsByType(subSubjectRelType.id)

                return rels.map(rel => ({
                    subDomainId: rel.from,
                    mainDomainId: rel.to
                }))
            })
        } catch (e) {
            console.error("Failed to get sub domain relations:", e)
            return []
        }
    })

    // Add main domain
    ipcMain.handle("domain:addMain", async (_ev, data) => {
        try {
            const { name } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const subjectTypeInst = subjectType.Subject.instance
                    const node = new kg_interface.Node(subjectTypeInst.id, [], name)
                    db.nodeops.mergeNode(node.toDb())

                    db.dbops.commit()
                    return { success: true, id: node.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add main domain:", e)
            return { success: false, error: e.message }
        }
    })

    // Update main domain
    ipcMain.handle("domain:updateMain", async (_ev, data) => {
        try {
            const { id, name } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Main domain not found")
                    }

                    const updatedNode = new kg_interface.Node(
                        existingNode.type,
                        existingNode.attributes,
                        name
                    )
                    const nodeDb = updatedNode.toDb()
                    nodeDb.id = id
                    db.nodeops.mergeNode(nodeDb)

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to update main domain:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete main domain (cascade delete sub domains)
    ipcMain.handle("domain:deleteMain", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const subSubjectRelType = subjectType.SubSubjectRel.instance

                    // Find all sub domains belonging to this main domain
                    const subRels = db.relops.queryRelsByToId(subSubjectRelType.id, id)
                    const subDomainIds = subRels.map(rel => rel.from)

                    // Delete sub domain relations
                    db.relops.deleteRelsByToId(subSubjectRelType.id, id)

                    // Delete sub domain nodes
                    for (const subId of subDomainIds) {
                        db.nodeops.deleteNode(subId)
                    }

                    // Delete main domain node
                    db.nodeops.deleteNode(id)

                    db.dbops.commit()
                    return { success: true, deletedSubCount: subDomainIds.length }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to delete main domain:", e)
            return { success: false, error: e.message }
        }
    })

    // Add sub domain
    ipcMain.handle("domain:addSub", async (_ev, data) => {
        try {
            const { name, mainDomainId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const subSubjectTypeInst = subjectType.SubSubject.instance
                    const node = new kg_interface.Node(subSubjectTypeInst.id, [], name)
                    db.nodeops.mergeNode(node.toDb())

                    // Create relation to main domain
                    const subSubjectRelType = subjectType.SubSubjectRel.instance
                    const rel = new kg_interface.Rel(
                        subSubjectRelType.id,
                        `${node.id}_belongTo_${mainDomainId}`,
                        [],
                        node.id,
                        mainDomainId
                    )
                    db.relops.mergeRel(rel.toDb())

                    db.dbops.commit()
                    return { success: true, id: node.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add sub domain:", e)
            return { success: false, error: e.message }
        }
    })

    // Update sub domain
    ipcMain.handle("domain:updateSub", async (_ev, data) => {
        try {
            const { id, name, mainDomainId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Sub domain not found")
                    }

                    const updatedNode = new kg_interface.Node(
                        existingNode.type,
                        existingNode.attributes,
                        name
                    )
                    const nodeDb = updatedNode.toDb()
                    nodeDb.id = id
                    db.nodeops.mergeNode(nodeDb)

                    // Update relation if mainDomainId changed
                    const subSubjectRelType = subjectType.SubSubjectRel.instance
                    db.relops.deleteRelsByFromId(subSubjectRelType.id, id)

                    const rel = new kg_interface.Rel(
                        subSubjectRelType.id,
                        `${id}_belongTo_${mainDomainId}`,
                        [],
                        id,
                        mainDomainId
                    )
                    db.relops.mergeRel(rel.toDb())

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to update sub domain:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete sub domain
    ipcMain.handle("domain:deleteSub", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // Delete relation
                    const subSubjectRelType = subjectType.SubSubjectRel.instance
                    db.relops.deleteRelsByFromId(subSubjectRelType.id, id)

                    // Delete node
                    db.nodeops.deleteNode(id)

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to delete sub domain:", e)
            return { success: false, error: e.message }
        }
    })
}

module.exports = {
    registerDomainHandlers
}