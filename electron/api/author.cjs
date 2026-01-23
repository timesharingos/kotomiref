const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const kg_interface = require("../kg/interface.cjs")
const signatureType = require("../kg/reftype/signature.cjs")

/**
 * Register author management IPC handlers
 */
function registerAuthorHandlers() {
    // Get all authors
    ipcMain.handle("author:getAll", async () => {
        try {
            return invokeDb((db) => {
                const authorType = signatureType.Author.instance
                const nodes = db.nodeops.queryNodesByType(authorType.id)

                return nodes.map(node => {
                    // node.attributes is an array of attribute IDs, need to fetch actual AttributeInstance objects
                    const nameAttrId = node.attributes[0] // First attribute is AuthorName
                    const nameAttr = nameAttrId ? db.attrops.queryAttrById(nameAttrId) : null

                    return {
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        affiliations: [] // Will be populated from relations
                    }
                })
            })
        } catch (e) {
            console.error("Failed to get authors:", e)
            return []
        }
    })

    // Get author-affiliation relations
    ipcMain.handle("author:getAffiliations", async () => {
        try {
            return invokeDb((db) => {
                const authorBelongToType = signatureType.AuthorBelongTo.instance
                const rels = db.relops.queryRelsByType(authorBelongToType.id)

                return rels.map(rel => ({
                    authorId: rel.from,
                    affiliationId: rel.to
                }))
            })
        } catch (e) {
            console.error("Failed to get author affiliations:", e)
            return []
        }
    })

    // Add author
    ipcMain.handle("author:add", async (_ev, data) => {
        try {
            const { name, affiliations } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const authorType = signatureType.Author.instance

                    // Create attribute instance for AuthorName
                    const nameAttr = new kg_interface.AttributeInstance(
                        signatureType.AttributeSigName.instance.id,
                        name || ""
                    )

                    // Store attribute in database first
                    db.attrops.mergeAttr(nameAttr.toDb())

                    // Create author node with attribute ID
                    const node = new kg_interface.Node(
                        authorType.id,
                        [nameAttr.id], // Pass attribute ID, not object
                        name
                    )
                    db.nodeops.mergeNode(node.toDb())

                    // Create author-affiliation relations
                    if (affiliations && affiliations.length > 0) {
                        const authorBelongToType = signatureType.AuthorBelongTo.instance
                        for (const affId of affiliations) {
                            const rel = new kg_interface.Rel(
                                authorBelongToType.id,
                                `${node.id}_belongTo_${affId}`,
                                [],
                                node.id,
                                affId
                            )
                            db.relops.mergeRel(rel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: node.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add author:", e)
            return { success: false, error: e.message }
        }
    })

    // Update author
    ipcMain.handle("author:update", async (_ev, data) => {
        try {
            const { id, name, affiliations } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Author not found")
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
                    nodeDb.id = id
                    db.nodeops.mergeNode(nodeDb)

                    // Update affiliations
                    const authorBelongToType = signatureType.AuthorBelongTo.instance

                    // Delete old affiliation relations
                    db.relops.deleteRelsByFromId(authorBelongToType.id, id)

                    // Create new affiliation relations
                    if (affiliations && affiliations.length > 0) {
                        for (const affId of affiliations) {
                            const rel = new kg_interface.Rel(
                                authorBelongToType.id,
                                `${id}_belongTo_${affId}`,
                                [],
                                id,
                                affId
                            )
                            db.relops.mergeRel(rel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to update author:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete author
    ipcMain.handle("author:delete", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // Delete all author-affiliation relations
                    const authorBelongToType = signatureType.AuthorBelongTo.instance
                    db.relops.deleteRelsByFromId(authorBelongToType.id, id)

                    // Delete author node and its attributes
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
            console.error("Failed to delete author:", e)
            return { success: false, error: e.message }
        }
    })
}

module.exports = {
    registerAuthorHandlers
}