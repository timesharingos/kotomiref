const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const kg_interface = require("../kg/interface.cjs")
const evolutionType = require("../kg/reftype/evolution.cjs")

/**
 * Register entity management IPC handlers
 */
function registerEntityHandlers() {
    // Get all entities of a specific type
    ipcMain.handle("entity:getAllByType", async (_ev, entityType) => {
        try {
            return invokeDb((db) => {
                let conceptType
                switch (entityType) {
                    case 'object':
                        conceptType = evolutionType.evoConcepts.EvoObject.instance
                        break
                    case 'algo':
                        conceptType = evolutionType.evoConcepts.EvoAlgo.instance
                        break
                    case 'improvement':
                        conceptType = evolutionType.evoConcepts.EvoImprovement.instance
                        break
                    case 'contrib':
                        conceptType = evolutionType.evoConcepts.EvoContrib.instance
                        break
                    case 'problem':
                        conceptType = evolutionType.evoConcepts.EvoProblem.instance
                        break
                    case 'definition':
                        conceptType = evolutionType.evoConcepts.EvoDefinition.instance
                        break
                    default:
                        throw new Error(`Unknown entity type: ${entityType}`)
                }

                const nodes = db.nodeops.queryNodesByType(conceptType.id)

                return nodes.map(node => {
                    // node.attributes is an array of attribute IDs
                    const attrs = node.attributes.map(attrId => db.attrops.queryAttrById(attrId))
                    
                    // Extract attribute values based on entity type
                    let result = {
                        id: node.id,
                        name: node.name
                    }

                    // Map attributes by their type
                    attrs.forEach(attr => {
                        if (!attr) return
                        
                        if (attr.type === evolutionType.evoAttributes.AttributeEvoName.instance.id) {
                            result.name = attr.value
                        } else if (attr.type === evolutionType.evoAttributes.AttributeEvoDesc.instance.id) {
                            result.description = attr.value
                        } else if (attr.type === evolutionType.evoAttributes.AttributeEvoMetric.instance.id) {
                            result.metric = attr.value
                        } else if (attr.type === evolutionType.evoAttributes.AttributeEvoMetricResultString.instance.id) {
                            result.metricResultString = attr.value
                        } else if (attr.type === evolutionType.evoAttributes.AttributeEvoMetricResultNumber.instance.id) {
                            result.metricResultNumber = attr.value
                        }
                    })

                    // Get Entity relations (Subject, Alias, Parent, Relation)
                    // Find corresponding Entity node by name
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityType.id, node.name)

                    if (entityNode) {
                        // Get Subject relation
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const subjectRels = db.relops.queryRelsByFromId(subjectRelType.id, entityNode.id)
                        if (subjectRels.length > 0) {
                            const subjectNode = db.nodeops.queryNodeById(subjectRels[0].to)
                            if (subjectNode) {
                                result.subjectId = subjectNode.id
                                const subjectNameAttr = db.attrops.queryAttrById(subjectNode.attributes[0])
                                result.subjectName = subjectNameAttr ? subjectNameAttr.value : subjectNode.name
                            }
                        }

                        // Get Alias relations
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        const aliasRels = db.relops.queryRelsByFromId(aliasRelType.id, entityNode.id)
                        result.aliasIds = aliasRels.map(rel => rel.to)
                        result.aliasNames = aliasRels.map(rel => {
                            const aliasNode = db.nodeops.queryNodeById(rel.to)
                            return aliasNode ? aliasNode.name : rel.to
                        })

                        // Get Parent relations
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        const parentRels = db.relops.queryRelsByFromId(parentRelType.id, entityNode.id)
                        result.parentIds = parentRels.map(rel => rel.to)
                        result.parentNames = parentRels.map(rel => {
                            const parentNode = db.nodeops.queryNodeById(rel.to)
                            return parentNode ? parentNode.name : rel.to
                        })

                        // Get Relation relations
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        const relationRels = db.relops.queryRelsByFromId(relationRelType.id, entityNode.id)
                        result.relationIds = relationRels.map(rel => rel.to)
                        result.relationNames = relationRels.map(rel => {
                            const relationNode = db.nodeops.queryNodeById(rel.to)
                            return relationNode ? relationNode.name : rel.to
                        })

                        // Get Algo-specific relations if entity type is algo
                        if (entityType === 'algo') {
                            // Get Target relations
                            const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                            const targetRels = db.relops.queryRelsByFromId(targetRelType.id, entityNode.id)
                            result.targetIds = targetRels.map(rel => rel.to)
                            result.targetNames = targetRels.map(rel => {
                                const targetNode = db.nodeops.queryNodeById(rel.to)
                                return targetNode ? targetNode.name : rel.to
                            })

                            // Get Expectation relations
                            const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                            const expectationRels = db.relops.queryRelsByFromId(expectationRelType.id, entityNode.id)
                            result.expectationIds = expectationRels.map(rel => rel.to)
                            result.expectationNames = expectationRels.map(rel => {
                                const expectationNode = db.nodeops.queryNodeById(rel.to)
                                return expectationNode ? expectationNode.name : rel.to
                            })

                            // Get Transformation relations
                            const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
                            const transformationRels = db.relops.queryRelsByFromId(transformationRelType.id, entityNode.id)
                            result.transformationIds = transformationRels.map(rel => rel.to)
                            result.transformationNames = transformationRels.map(rel => {
                                const transformationNode = db.nodeops.queryNodeById(rel.to)
                                return transformationNode ? transformationNode.name : rel.to
                            })
                        }
                    }

                    return result
                })
            })
        } catch (e) {
            console.error("Failed to get entities:", e)
            return []
        }
    })

    // Get all entities (for relationship selection)
    ipcMain.handle("entity:getAll", async () => {
        try {
            return invokeDb((db) => {
                const entityType = evolutionType.evoConcepts.EvoEntity.instance
                const nodes = db.nodeops.queryNodesByType(entityType.id)

                return nodes.map(node => ({
                    id: node.id,
                    name: node.name,
                    type: 'entity',
                    typeName: 'Entity'
                }))
            })
        } catch (e) {
            console.error("Failed to get all entities:", e)
            return []
        }
    })

    // Add entity (Object type)
    ipcMain.handle("entity:addObject", async (_ev, data) => {
        try {
            const { name, description, subjectId, aliasIds, parentIds, relationIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Create EvoObject node with attributes
                    const objectType = evolutionType.evoConcepts.EvoObject.instance

                    // Create attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    // Store attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Create Object node
                    const objectNode = new kg_interface.Node(
                        objectType.id,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    db.nodeops.mergeNode(objectNode.toDb())

                    // 2. Create corresponding EvoEntity node with same name
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = new kg_interface.Node(
                        entityType.id,
                        [], // Entity has no attributes
                        name
                    )
                    db.nodeops.mergeNode(entityNode.toDb())

                    // 3. Create Entity relations
                    // Subject relation (required)
                    if (subjectId) {
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const subjectRel = new kg_interface.Rel(
                            subjectRelType.id,
                            `${entityNode.id}_subject_${subjectId}`,
                            [],
                            entityNode.id,
                            subjectId
                        )
                        db.relops.mergeRel(subjectRel.toDb())
                    }

                    // Alias relations (optional, multiple)
                    if (aliasIds && aliasIds.length > 0) {
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        for (const aliasId of aliasIds) {
                            const aliasRel = new kg_interface.Rel(
                                aliasRelType.id,
                                `${entityNode.id}_alias_${aliasId}`,
                                [],
                                entityNode.id,
                                aliasId
                            )
                            db.relops.mergeRel(aliasRel.toDb())
                        }
                    }

                    // Parent relations (optional, multiple)
                    if (parentIds && parentIds.length > 0) {
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        for (const parentId of parentIds) {
                            const parentRel = new kg_interface.Rel(
                                parentRelType.id,
                                `${entityNode.id}_parent_${parentId}`,
                                [],
                                entityNode.id,
                                parentId
                            )
                            db.relops.mergeRel(parentRel.toDb())
                        }
                    }

                    // Relation relations (optional, multiple)
                    if (relationIds && relationIds.length > 0) {
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        for (const relationId of relationIds) {
                            const relationRel = new kg_interface.Rel(
                                relationRelType.id,
                                `${entityNode.id}_relation_${relationId}`,
                                [],
                                entityNode.id,
                                relationId
                            )
                            db.relops.mergeRel(relationRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: objectNode.id, entityId: entityNode.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add object:", e)
            return { success: false, error: e.message }
        }
    })

    // Update entity (Object type)
    ipcMain.handle("entity:updateObject", async (_ev, data) => {
        try {
            const { id, name, description, subjectId, aliasIds, parentIds, relationIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Update EvoObject node
                    const existingObjectNode = db.nodeops.queryNodeById(id)
                    if (!existingObjectNode) {
                        throw new Error("Object not found")
                    }

                    // Create new attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    // Delete old attributes
                    if (existingObjectNode.attributes[0]) {
                        db.attrops.deleteAttr(existingObjectNode.attributes[0])
                    }
                    if (existingObjectNode.attributes[1]) {
                        db.attrops.deleteAttr(existingObjectNode.attributes[1])
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update Object node
                    const updatedObjectNode = new kg_interface.Node(
                        existingObjectNode.type,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    const objectNodeDb = updatedObjectNode.toDb()
                    objectNodeDb.id = id
                    db.nodeops.mergeNode(objectNodeDb)

                    // 2. Update corresponding EvoEntity node
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const oldEntityNode = db.nodeops.queryNodeByName(entityType.id, existingObjectNode.name)

                    if (oldEntityNode) {
                        // If name changed, create new Entity node
                        if (existingObjectNode.name !== name) {
                            // Delete old Entity node and its relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(aliasRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(parentRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(relationRelType.id, oldEntityNode.id)
                            db.nodeops.deleteNode(oldEntityNode.id)

                            // Create new Entity node
                            const newEntityNode = new kg_interface.Node(
                                entityType.id,
                                [],
                                name
                            )
                            db.nodeops.mergeNode(newEntityNode.toDb())

                            // Use new entity node for relations
                            var entityNodeId = newEntityNode.id
                        } else {
                            // Name unchanged, use existing entity node
                            var entityNodeId = oldEntityNode.id

                            // Delete old relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(aliasRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(parentRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(relationRelType.id, entityNodeId)
                        }

                        // 3. Create new Entity relations
                        // Subject relation (required)
                        if (subjectId) {
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const subjectRel = new kg_interface.Rel(
                                subjectRelType.id,
                                `${entityNodeId}_subject_${subjectId}`,
                                [],
                                entityNodeId,
                                subjectId
                            )
                            db.relops.mergeRel(subjectRel.toDb())
                        }

                        // Alias relations (optional, multiple)
                        if (aliasIds && aliasIds.length > 0) {
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            for (const aliasId of aliasIds) {
                                const aliasRel = new kg_interface.Rel(
                                    aliasRelType.id,
                                    `${entityNodeId}_alias_${aliasId}`,
                                    [],
                                    entityNodeId,
                                    aliasId
                                )
                                db.relops.mergeRel(aliasRel.toDb())
                            }
                        }

                        // Parent relations (optional, multiple)
                        if (parentIds && parentIds.length > 0) {
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            for (const parentId of parentIds) {
                                const parentRel = new kg_interface.Rel(
                                    parentRelType.id,
                                    `${entityNodeId}_parent_${parentId}`,
                                    [],
                                    entityNodeId,
                                    parentId
                                )
                                db.relops.mergeRel(parentRel.toDb())
                            }
                        }

                        // Relation relations (optional, multiple)
                        if (relationIds && relationIds.length > 0) {
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                            for (const relationId of relationIds) {
                                const relationRel = new kg_interface.Rel(
                                    relationRelType.id,
                                    `${entityNodeId}_relation_${relationId}`,
                                    [],
                                    entityNodeId,
                                    relationId
                                )
                                db.relops.mergeRel(relationRel.toDb())
                            }
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
            console.error("Failed to update object:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete entity (Object type)
    ipcMain.handle("entity:deleteObject", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Get Object node
                    const objectNode = db.nodeops.queryNodeById(id)
                    if (!objectNode) {
                        throw new Error("Object not found")
                    }

                    // 2. Delete corresponding Entity node and its relations
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityType.id, objectNode.name)

                    if (entityNode) {
                        // Delete all Entity relations
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                        db.relops.deleteRelsByFromId(subjectRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(aliasRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(parentRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(relationRelType.id, entityNode.id)

                        // Also delete relations where this entity is the target
                        db.relops.deleteRelsByToId(aliasRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(parentRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(relationRelType.id, entityNode.id)

                        // Delete Entity node
                        db.nodeops.deleteNode(entityNode.id)
                    }

                    // 3. Delete Object node and its attributes
                    for (const attrId of objectNode.attributes) {
                        db.attrops.deleteAttr(attrId)
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
            console.error("Failed to delete object:", e)
            return { success: false, error: e.message }
        }
    })

    // Add entity (Algo type)
    ipcMain.handle("entity:addAlgo", async (_ev, data) => {
        try {
            const { name, description, subjectId, aliasIds, parentIds, relationIds, targetIds, expectationIds, transformationIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Create EvoAlgo node with attributes
                    const algoType = evolutionType.evoConcepts.EvoAlgo.instance

                    // Create attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    // Store attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Create Algo node
                    const algoNode = new kg_interface.Node(
                        algoType.id,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    db.nodeops.mergeNode(algoNode.toDb())

                    // 2. Create corresponding EvoEntity node with same name
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = new kg_interface.Node(
                        entityType.id,
                        [], // Entity has no attributes
                        name
                    )
                    db.nodeops.mergeNode(entityNode.toDb())

                    // 3. Create Entity relations (same as Object)
                    if (subjectId) {
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const subjectRel = new kg_interface.Rel(
                            subjectRelType.id,
                            `${entityNode.id}_subject_${subjectId}`,
                            [],
                            entityNode.id,
                            subjectId
                        )
                        db.relops.mergeRel(subjectRel.toDb())
                    }

                    if (aliasIds && aliasIds.length > 0) {
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        for (const aliasId of aliasIds) {
                            const aliasRel = new kg_interface.Rel(
                                aliasRelType.id,
                                `${entityNode.id}_alias_${aliasId}`,
                                [],
                                entityNode.id,
                                aliasId
                            )
                            db.relops.mergeRel(aliasRel.toDb())
                        }
                    }

                    if (parentIds && parentIds.length > 0) {
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        for (const parentId of parentIds) {
                            const parentRel = new kg_interface.Rel(
                                parentRelType.id,
                                `${entityNode.id}_parent_${parentId}`,
                                [],
                                entityNode.id,
                                parentId
                            )
                            db.relops.mergeRel(parentRel.toDb())
                        }
                    }

                    if (relationIds && relationIds.length > 0) {
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        for (const relationId of relationIds) {
                            const relationRel = new kg_interface.Rel(
                                relationRelType.id,
                                `${entityNode.id}_relation_${relationId}`,
                                [],
                                entityNode.id,
                                relationId
                            )
                            db.relops.mergeRel(relationRel.toDb())
                        }
                    }

                    // 4. Create Algo-specific relations
                    if (targetIds && targetIds.length > 0) {
                        const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                        for (const targetId of targetIds) {
                            const targetRel = new kg_interface.Rel(
                                targetRelType.id,
                                `${entityNode.id}_target_${targetId}`,
                                [],
                                entityNode.id,
                                targetId
                            )
                            db.relops.mergeRel(targetRel.toDb())
                        }
                    }

                    if (expectationIds && expectationIds.length > 0) {
                        const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                        for (const expectationId of expectationIds) {
                            const expectationRel = new kg_interface.Rel(
                                expectationRelType.id,
                                `${entityNode.id}_expectation_${expectationId}`,
                                [],
                                entityNode.id,
                                expectationId
                            )
                            db.relops.mergeRel(expectationRel.toDb())
                        }
                    }

                    if (transformationIds && transformationIds.length > 0) {
                        const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
                        for (const transformationId of transformationIds) {
                            const transformationRel = new kg_interface.Rel(
                                transformationRelType.id,
                                `${entityNode.id}_transformation_${transformationId}`,
                                [],
                                entityNode.id,
                                transformationId
                            )
                            db.relops.mergeRel(transformationRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: algoNode.id, entityId: entityNode.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add algo:", e)
            return { success: false, error: e.message }
        }
    })

    // Update entity (Algo type)
    ipcMain.handle("entity:updateAlgo", async (_ev, data) => {
        try {
            const { id, name, description, subjectId, aliasIds, parentIds, relationIds, targetIds, expectationIds, transformationIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Update EvoAlgo node (same as Object)
                    const existingAlgoNode = db.nodeops.queryNodeById(id)
                    if (!existingAlgoNode) {
                        throw new Error("Algo not found")
                    }

                    // Create new attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    // Delete old attributes
                    if (existingAlgoNode.attributes[0]) {
                        db.attrops.deleteAttr(existingAlgoNode.attributes[0])
                    }
                    if (existingAlgoNode.attributes[1]) {
                        db.attrops.deleteAttr(existingAlgoNode.attributes[1])
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update Algo node
                    const updatedAlgoNode = new kg_interface.Node(
                        existingAlgoNode.type,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    const algoNodeDb = updatedAlgoNode.toDb()
                    algoNodeDb.id = id
                    db.nodeops.mergeNode(algoNodeDb)

                    // 2. Update corresponding EvoEntity node (same as Object)
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const oldEntityNode = db.nodeops.queryNodeByName(entityType.id, existingAlgoNode.name)

                    if (oldEntityNode) {
                        let entityNodeId

                        if (existingAlgoNode.name !== name) {
                            // Delete old Entity node and its relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                            const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                            const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                            const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(aliasRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(parentRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(relationRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(targetRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(expectationRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(transformationRelType.id, oldEntityNode.id)
                            db.nodeops.deleteNode(oldEntityNode.id)

                            // Create new Entity node
                            const newEntityNode = new kg_interface.Node(
                                entityType.id,
                                [],
                                name
                            )
                            db.nodeops.mergeNode(newEntityNode.toDb())
                            entityNodeId = newEntityNode.id
                        } else {
                            // Name unchanged, use existing entity node
                            entityNodeId = oldEntityNode.id

                            // Delete old relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                            const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                            const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                            const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(aliasRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(parentRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(relationRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(targetRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(expectationRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(transformationRelType.id, entityNodeId)
                        }

                        // 3. Create new Entity relations
                        if (subjectId) {
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const subjectRel = new kg_interface.Rel(
                                subjectRelType.id,
                                `${entityNodeId}_subject_${subjectId}`,
                                [],
                                entityNodeId,
                                subjectId
                            )
                            db.relops.mergeRel(subjectRel.toDb())
                        }

                        if (aliasIds && aliasIds.length > 0) {
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            for (const aliasId of aliasIds) {
                                const aliasRel = new kg_interface.Rel(
                                    aliasRelType.id,
                                    `${entityNodeId}_alias_${aliasId}`,
                                    [],
                                    entityNodeId,
                                    aliasId
                                )
                                db.relops.mergeRel(aliasRel.toDb())
                            }
                        }

                        if (parentIds && parentIds.length > 0) {
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            for (const parentId of parentIds) {
                                const parentRel = new kg_interface.Rel(
                                    parentRelType.id,
                                    `${entityNodeId}_parent_${parentId}`,
                                    [],
                                    entityNodeId,
                                    parentId
                                )
                                db.relops.mergeRel(parentRel.toDb())
                            }
                        }

                        if (relationIds && relationIds.length > 0) {
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                            for (const relationId of relationIds) {
                                const relationRel = new kg_interface.Rel(
                                    relationRelType.id,
                                    `${entityNodeId}_relation_${relationId}`,
                                    [],
                                    entityNodeId,
                                    relationId
                                )
                                db.relops.mergeRel(relationRel.toDb())
                            }
                        }

                        // 4. Create Algo-specific relations
                        if (targetIds && targetIds.length > 0) {
                            const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                            for (const targetId of targetIds) {
                                const targetRel = new kg_interface.Rel(
                                    targetRelType.id,
                                    `${entityNodeId}_target_${targetId}`,
                                    [],
                                    entityNodeId,
                                    targetId
                                )
                                db.relops.mergeRel(targetRel.toDb())
                            }
                        }

                        if (expectationIds && expectationIds.length > 0) {
                            const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                            for (const expectationId of expectationIds) {
                                const expectationRel = new kg_interface.Rel(
                                    expectationRelType.id,
                                    `${entityNodeId}_expectation_${expectationId}`,
                                    [],
                                    entityNodeId,
                                    expectationId
                                )
                                db.relops.mergeRel(expectationRel.toDb())
                            }
                        }

                        if (transformationIds && transformationIds.length > 0) {
                            const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
                            for (const transformationId of transformationIds) {
                                const transformationRel = new kg_interface.Rel(
                                    transformationRelType.id,
                                    `${entityNodeId}_transformation_${transformationId}`,
                                    [],
                                    entityNodeId,
                                    transformationId
                                )
                                db.relops.mergeRel(transformationRel.toDb())
                            }
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
            console.error("Failed to update algo:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete entity (Algo type)
    ipcMain.handle("entity:deleteAlgo", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Get Algo node
                    const algoNode = db.nodeops.queryNodeById(id)
                    if (!algoNode) {
                        throw new Error("Algo not found")
                    }

                    // 2. Delete corresponding Entity node and its relations
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityType.id, algoNode.name)

                    if (entityNode) {
                        // Delete all Entity relations
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                        const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                        const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance

                        db.relops.deleteRelsByFromId(subjectRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(aliasRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(parentRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(relationRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(targetRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(expectationRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(transformationRelType.id, entityNode.id)

                        // Also delete relations where this entity is the target
                        db.relops.deleteRelsByToId(aliasRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(parentRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(relationRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(targetRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(expectationRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(transformationRelType.id, entityNode.id)

                        // Delete Entity node
                        db.nodeops.deleteNode(entityNode.id)
                    }

                    // 3. Delete Algo node and its attributes
                    for (const attrId of algoNode.attributes) {
                        db.attrops.deleteAttr(attrId)
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
            console.error("Failed to delete algo:", e)
            return { success: false, error: e.message }
        }
    })
}

module.exports = {
    registerEntityHandlers
}

