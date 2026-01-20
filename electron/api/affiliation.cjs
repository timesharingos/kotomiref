const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const kg_interface = require("../kg/interface.cjs")
const signatureType = require("../kg/reftype/signature.cjs")

/**
 * Register affiliation management IPC handlers
 */
function registerAffiliationHandlers() {
    // Get all affiliations
    ipcMain.handle("affiliation:getAll", async () => {
        try {
            return invokeDb((db) => {
                const affiliationType = signatureType.Affiliation.instance

                // Query all affiliation nodes
                const nodes = db.nodeops.queryNodesByType(affiliationType.id)

                return nodes.map(node => {
                    // node.attributes is an array of attribute IDs, need to fetch actual AttributeInstance objects
                    const nameAttrId = node.attributes[0] // First attribute is AuthorName (used for both Author and Affiliation)
                    const nameAttr = nameAttrId ? db.attrops.queryAttrById(nameAttrId) : null

                    return {
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        parentId: null // Will be populated from hierarchy
                    }
                })
            })
        } catch (e) {
            console.error("Failed to get affiliations:", e)
            return []
        }
    })

    // Get affiliation hierarchy (parent-child relations)
    ipcMain.handle("affiliation:getHierarchy", async () => {
        try {
            return invokeDb((db) => {
                const affiliationBelongToType = signatureType.AffiliationBelongTo.instance

                // Query all AffiliationBelongTo relations
                const rels = db.relops.queryRelsByType(affiliationBelongToType.id)

                return rels.map(rel => ({
                    childId: rel.from,
                    parentId: rel.to
                }))
            })
        } catch (e) {
            console.error("Failed to get affiliation hierarchy:", e)
            return []
        }
    })

    // Add affiliation
    ipcMain.handle("affiliation:add", async (_ev, data) => {
        try {
            const { name, parentId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const affiliationType = signatureType.Affiliation.instance

                    // Create attribute instance for affiliation name
                    const nameAttr = new kg_interface.AttributeInstance(
                        signatureType.AttributeSigName.instance.id,
                        name || ""
                    )

                    // Store attribute in database first
                    db.attrops.mergeAttr(nameAttr.toDb())

                    // Create affiliation node with attribute ID
                    const node = new kg_interface.Node(
                        affiliationType.id,
                        [nameAttr.id], // Pass attribute ID, not object
                        name
                    )
                    db.nodeops.mergeNode(node.toDb())

                    // Create parent-child relation if parentId exists
                    if (parentId) {
                        const affiliationBelongToType = signatureType.AffiliationBelongTo.instance
                        const rel = new kg_interface.Rel(
                            affiliationBelongToType.id,
                            `${node.id}_belongTo_${parentId}`,
                            [],
                            node.id,
                            parentId
                        )
                        db.relops.mergeRel(rel.toDb())
                    }

                    db.dbops.commit()
                    return { success: true, id: node.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add affiliation:", e)
            return { success: false, error: e.message }
        }
    })

    // Update affiliation
    ipcMain.handle("affiliation:update", async (_ev, data) => {
        try {
            const { id, name, parentId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // Get existing node
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Affiliation not found")
                    }

                    // Create new attribute instance
                    const nameAttr = new kg_interface.AttributeInstance(
                        signatureType.AttributeSigName.instance.id,
                        name || ""
                    )

                    // Delete old attribute
                    if (existingNode.attributes[0]) {
                        db.attrops.deleteAttr(existingNode.attributes[0])
                    }

                    // Store new attribute
                    db.attrops.mergeAttr(nameAttr.toDb())

                    // Update node with new attribute ID
                    const updatedNode = new kg_interface.Node(
                        existingNode.type,
                        [nameAttr.id],
                        name
                    )
                    const nodeDb = updatedNode.toDb()
                    nodeDb.id = id // Keep the same ID
                    db.nodeops.mergeNode(nodeDb)

                    // Update parent relation
                    const affiliationBelongToType = signatureType.AffiliationBelongTo.instance

                    // Delete old parent relation
                    db.relops.deleteRelsByFromId(affiliationBelongToType.id, id)

                    // Create new parent relation if parentId exists
                    if (parentId) {
                        const rel = new kg_interface.Rel(
                            affiliationBelongToType.id,
                            `${id}_belongTo_${parentId}`,
                            [],
                            id,
                            parentId
                        )
                        db.relops.mergeRel(rel.toDb())
                    }

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to update affiliation:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete affiliation (cascade delete children and author relations)
    ipcMain.handle("affiliation:delete", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const affiliationBelongToType = signatureType.AffiliationBelongTo.instance

                    // Get all descendant IDs recursively
                    const getAllDescendants = (affId) => {
                        const childRels = db.relops.queryRelsByToId(affiliationBelongToType.id, affId)
                        let descendants = childRels.map(rel => rel.from)

                        for (const childId of childRels.map(rel => rel.from)) {
                            descendants = descendants.concat(getAllDescendants(childId))
                        }

                        return descendants
                    }

                    const allIds = [id, ...getAllDescendants(id)]

                    // Delete all author-affiliation relations
                    const authorBelongToType = signatureType.AuthorBelongTo.instance
                    for (const affId of allIds) {
                        db.relops.deleteRelsByToId(authorBelongToType.id, affId)
                    }

                    // Delete all parent-child relations
                    for (const affId of allIds) {
                        db.relops.deleteRelsByFromId(affiliationBelongToType.id, affId)
                        db.relops.deleteRelsByToId(affiliationBelongToType.id, affId)
                    }

                    // Delete all nodes and their attributes
                    for (const affId of allIds) {
                        const node = db.nodeops.queryNodeById(affId)
                        if (node) {
                            // Delete attributes
                            for (const attrId of node.attributes) {
                                db.attrops.deleteAttr(attrId)
                            }
                        }
                        db.nodeops.deleteNode(affId)
                    }

                    db.dbops.commit()
                    return { success: true, deletedCount: allIds.length }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to delete affiliation:", e)
            return { success: false, error: e.message }
        }
    })
}

module.exports = {
    registerAffiliationHandlers
}

