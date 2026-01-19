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

                return nodes.map(node => {
                    // node.attributes is an array of attribute IDs, need to fetch actual AttributeInstance objects
                    const nameAttrId = node.attributes[0] // First attribute is subjectName
                    const descAttrId = node.attributes[1] // Second attribute is subjectDesc

                    const nameAttr = nameAttrId ? db.attrops.queryAttrById(nameAttrId) : null
                    const descAttr = descAttrId ? db.attrops.queryAttrById(descAttrId) : null

                    return {
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        description: descAttr ? descAttr.value : ''
                    }
                })
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

                return nodes.map(node => {
                    // node.attributes is an array of attribute IDs, need to fetch actual AttributeInstance objects
                    const nameAttrId = node.attributes[0] // First attribute is subjectName
                    const descAttrId = node.attributes[1] // Second attribute is subjectDesc

                    const nameAttr = nameAttrId ? db.attrops.queryAttrById(nameAttrId) : null
                    const descAttr = descAttrId ? db.attrops.queryAttrById(descAttrId) : null

                    return {
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        description: descAttr ? descAttr.value : '',
                        mainDomainId: null // Will be populated from relations
                    }
                })
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
            const { name, desc } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const subjectTypeInst = subjectType.Subject.instance

                    // Create attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectDesc.instance.id,
                        desc || "" // Optional, empty string if not provided
                    )

                    // Store attributes in database first
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Create node with attribute IDs (not the objects themselves)
                    const node = new kg_interface.Node(
                        subjectTypeInst.id,
                        [nameAttr.id, descAttr.id], // Pass IDs, not objects
                        name
                    )
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
            const { id, name, desc } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Main domain not found")
                    }

                    // Get existing description if desc not provided
                    let existingDesc = ""
                    if (existingNode.attributes[1]) {
                        const existingDescAttr = db.attrops.queryAttrById(existingNode.attributes[1])
                        existingDesc = existingDescAttr ? existingDescAttr.value : ""
                    }

                    // Create new attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectDesc.instance.id,
                        desc !== undefined ? desc : existingDesc
                    )

                    // Delete old attributes
                    if (existingNode.attributes[0]) {
                        db.attrops.deleteAttr(existingNode.attributes[0])
                    }
                    if (existingNode.attributes[1]) {
                        db.attrops.deleteAttr(existingNode.attributes[1])
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update node with new attribute IDs
                    const updatedNode = new kg_interface.Node(
                        existingNode.type,
                        [nameAttr.id, descAttr.id],
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

                    // Delete sub domain nodes and their attributes
                    for (const subId of subDomainIds) {
                        const subNode = db.nodeops.queryNodeById(subId)
                        if (subNode) {
                            // Delete attributes
                            for (const attrId of subNode.attributes) {
                                db.attrops.deleteAttr(attrId)
                            }
                        }
                        db.nodeops.deleteNode(subId)
                    }

                    // Delete main domain node and its attributes
                    const mainNode = db.nodeops.queryNodeById(id)
                    if (mainNode) {
                        // Delete attributes
                        for (const attrId of mainNode.attributes) {
                            db.attrops.deleteAttr(attrId)
                        }
                    }
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
            const { name, desc, mainDomainId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const subSubjectTypeInst = subjectType.SubSubject.instance

                    // Create attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectDesc.instance.id,
                        desc || "" // Optional, empty string if not provided
                    )

                    // Store attributes in database first
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Create node with attribute IDs
                    const node = new kg_interface.Node(
                        subSubjectTypeInst.id,
                        [nameAttr.id, descAttr.id],
                        name
                    )
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
            const { id, name, desc, mainDomainId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Sub domain not found")
                    }

                    // Get existing description if desc not provided
                    let existingDesc = ""
                    if (existingNode.attributes[1]) {
                        const existingDescAttr = db.attrops.queryAttrById(existingNode.attributes[1])
                        existingDesc = existingDescAttr ? existingDescAttr.value : ""
                    }

                    // Create new attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        subjectType.AttributeSubjectDesc.instance.id,
                        desc !== undefined ? desc : existingDesc
                    )

                    // Delete old attributes
                    if (existingNode.attributes[0]) {
                        db.attrops.deleteAttr(existingNode.attributes[0])
                    }
                    if (existingNode.attributes[1]) {
                        db.attrops.deleteAttr(existingNode.attributes[1])
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update node with new attribute IDs
                    const updatedNode = new kg_interface.Node(
                        existingNode.type,
                        [nameAttr.id, descAttr.id],
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

                    // Delete node and its attributes
                    const node = db.nodeops.queryNodeById(id)
                    if (node) {
                        // Delete attributes
                        for (const attrId of node.attributes) {
                            db.attrops.deleteAttr(attrId)
                        }
                    }
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