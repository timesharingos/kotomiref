const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const kg_interface = require("../kg/interface.cjs")
const evolutionType = require("../kg/reftype/evolution.cjs")

/**
 * ============================================================================
 * ENTITY API - COMPLETE REWRITE
 * ============================================================================
 *
 * Core Principles:
 * 1. ALL real entities (Object/Algo/Improvement/Problem/Definition/Contrib)
 *    have a corresponding EvoEntity node with the SAME NAME
 * 2. NO EXCEPTIONS - Contrib also has EvoEntity
 * 3. All APIs are split into two versions:
 *    - xxxEntities: Operate on EvoEntity nodes (abstract layer)
 *    - xxxNodes: Operate on real entity nodes (concrete layer)
 * 4. Penetration APIs:
 *    - getRelatedEntity: RealEntity → Entity (upward)
 *    - getRelatedNodes: Entity → RealEntities (downward/penetration)
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

// Get type instance by entity type string
function getTypeInstance(entityType) {
    switch (entityType) {
        case 'object': return evolutionType.evoConcepts.EvoObject.instance
        case 'algo': return evolutionType.evoConcepts.EvoAlgo.instance
        case 'improvement': return evolutionType.evoConcepts.EvoImprovement.instance
        case 'problem': return evolutionType.evoConcepts.EvoProblem.instance
        case 'definition': return evolutionType.evoConcepts.EvoDefinition.instance
        case 'contrib':
        case 'contribution': return evolutionType.evoConcepts.EvoContrib.instance
        case 'entity': return evolutionType.evoConcepts.EvoEntity.instance
        default: throw new Error(`Unknown entity type: ${entityType}`)
    }
}

// Get entity type string from type ID
function getEntityTypeString(typeId) {
    if (typeId === evolutionType.evoConcepts.EvoObject.instance.id) return 'object'
    if (typeId === evolutionType.evoConcepts.EvoAlgo.instance.id) return 'algo'
    if (typeId === evolutionType.evoConcepts.EvoImprovement.instance.id) return 'improvement'
    if (typeId === evolutionType.evoConcepts.EvoProblem.instance.id) return 'problem'
    if (typeId === evolutionType.evoConcepts.EvoDefinition.instance.id) return 'definition'
    if (typeId === evolutionType.evoConcepts.EvoContrib.instance.id) return 'contrib'
    if (typeId === evolutionType.evoConcepts.EvoEntity.instance.id) return 'entity'
    return 'unknown'
}

// Helper function to add a node to database
function addNodeToDb(db, typeId, name) {
    const node = new kg_interface.Node(typeId, [], name)
    db.nodeops.mergeNode(node.toDb())
    return node.id
}

// Helper function to add an attribute to a node
function addAttrToNode(db, nodeId, attrTypeId, value) {
    const attr = new kg_interface.AttributeInstance(attrTypeId, value)
    db.attrops.mergeAttr(attr.toDb())

    // Add attribute to node
    const node = db.nodeops.queryNodeById(nodeId)
    if (node) {
        node.attributes.push(attr.id)
        db.nodeops.mergeNode(node.toDb())
    }

    return attr.id
}

// Helper function to update an attribute
function updateAttrValue(db, attrId, value) {
    const attr = db.attrops.queryAttrById(attrId)
    if (attr) {
        const newAttr = new kg_interface.AttributeInstance(attr.type, value)
        // Keep the same ID
        const attrData = newAttr.toDb()
        attrData.id = attrId
        db.attrops.mergeAttr(attrData)
    }
}

// Helper function to add a relation
function addRelToDb(db, relTypeId, fromId, toId) {
    const rel = new kg_interface.Rel(relTypeId, '', [], fromId, toId)
    db.relops.mergeRel(rel.toDb())
    return rel.id
}

// Helper function to remove a relation
function removeRelFromDb(db, relId) {
    db.relops.deleteRel(relId)
}

// Helper function to update node name
function updateNodeName(db, nodeId, newName) {
    const node = db.nodeops.queryNodeById(nodeId)
    if (node) {
        // Create new node with same type and attributes but new name
        const newNode = new kg_interface.Node(node.type, node.attributes, newName)
        // Keep the same ID by manually setting it in toDb result
        const nodeData = newNode.toDb()
        nodeData.id = nodeId
        db.nodeops.mergeNode(nodeData)
    }
}

// Extract attributes from node
function extractAttributes(db, node) {
    const attrs = node.attributes.map(attrId => db.attrops.queryAttrById(attrId))
    const result = {}

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

    return result
}

// Get Entity relations (Subject, Alias, Parent, Relation)
function getEntityRelations(db, entityNodeId) {
    const result = {}

    // Get Subject relation
    const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
    const subjectRels = db.relops.queryRelsByFromId(subjectRelType.id, entityNodeId)
    if (subjectRels.length > 0) {
        const subjectNode = db.nodeops.queryNodeById(subjectRels[0].to)
        if (subjectNode) {
            result.subjectId = subjectNode.id
            const subjectNameAttr = db.attrops.queryAttrById(subjectNode.attributes[0])
            result.subjectName = subjectNameAttr ? subjectNameAttr.value : subjectNode.name
        }
    }

    // Get Alias relations - Entity nodes, get name from attributes
    const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
    const aliasRels = db.relops.queryRelsByFromId(aliasRelType.id, entityNodeId)
    result.aliasIds = aliasRels.map(rel => rel.to)
    result.aliasNames = aliasRels.map(rel => {
        const entityNode = db.nodeops.queryNodeById(rel.to)
        if (entityNode) {
            const attrs = extractAttributes(db, entityNode)
            return attrs.name || entityNode.name
        }
        return rel.to
    })

    // Get Parent relations - Entity nodes, get name from attributes
    const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
    const parentRels = db.relops.queryRelsByFromId(parentRelType.id, entityNodeId)
    result.parentIds = parentRels.map(rel => rel.to)
    result.parentNames = parentRels.map(rel => {
        const entityNode = db.nodeops.queryNodeById(rel.to)
        if (entityNode) {
            const attrs = extractAttributes(db, entityNode)
            return attrs.name || entityNode.name
        }
        return rel.to
    })

    // Get Relation relations - Entity nodes, get name from attributes
    const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
    const relationRels = db.relops.queryRelsByFromId(relationRelType.id, entityNodeId)
    result.relationIds = relationRels.map(rel => rel.to)
    result.relationNames = relationRels.map(rel => {
        const entityNode = db.nodeops.queryNodeById(rel.to)
        if (entityNode) {
            const attrs = extractAttributes(db, entityNode)
            return attrs.name || entityNode.name
        }
        return rel.to
    })

    return result
}

// Get type-specific relations for real entity nodes (algo, improvement, contrib, etc.)
function getTypeSpecificRelations(db, nodeId, nodeType) {
    const result = {}

    // Algo-specific relations
    if (nodeType === evolutionType.evoConcepts.EvoAlgo.instance.id) {
        // Target: a1 -> e2, need to get e2's name
        const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
        const targetRels = db.relops.queryRelsByFromId(targetRelType.id, nodeId)
        result.targetIds = targetRels.map(rel => rel.to)
        result.targetNames = targetRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Expectation
        const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
        const expectationRels = db.relops.queryRelsByFromId(expectationRelType.id, nodeId)
        result.expectationIds = expectationRels.map(rel => rel.to)
        result.expectationNames = expectationRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Transformation
        const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
        const transformationRels = db.relops.queryRelsByFromId(transformationRelType.id, nodeId)
        result.transformationIds = transformationRels.map(rel => rel.to)
        result.transformationNames = transformationRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })
    }

    // Improvement-specific relations
    if (nodeType === evolutionType.evoConcepts.EvoImprovement.instance.id) {
        // Origin
        const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
        const originRels = db.relops.queryRelsByFromId(originRelType.id, nodeId)
        result.originIds = originRels.map(rel => rel.to)
        result.originNames = originRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Advance
        const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance
        const advanceRels = db.relops.queryRelsByFromId(advanceRelType.id, nodeId)
        result.advanceIds = advanceRels.map(rel => rel.to)
        result.advanceNames = advanceRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })
    }

    // Contrib-specific relations
    if (nodeType === evolutionType.evoConcepts.EvoContrib.instance.id) {
        // SolutionTo (points to definition node directly)
        const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance
        const solutionToRels = db.relops.queryRelsByFromId(solutionToRelType.id, nodeId)
        if (solutionToRels.length > 0) {
            const solutionToNode = db.nodeops.queryNodeById(solutionToRels[0].to)
            if (solutionToNode) {
                result.solutionToId = solutionToNode.id
                const attrs = extractAttributes(db, solutionToNode)
                result.solutionToName = attrs.name || solutionToNode.name
            }
        }

        // Improvement
        const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
        const improvementRels = db.relops.queryRelsByFromId(improvementRelType.id, nodeId)
        result.improvementIds = improvementRels.map(rel => rel.to)
        result.improvementNames = improvementRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Algo
        const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
        const algoRels = db.relops.queryRelsByFromId(algoRelType.id, nodeId)
        result.algoIds = algoRels.map(rel => rel.to)
        result.algoNames = algoRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Object
        const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
        const objectRels = db.relops.queryRelsByFromId(objectRelType.id, nodeId)
        result.objectIds = objectRels.map(rel => rel.to)
        result.objectNames = objectRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })
    }

    // Problem-specific relations
    if (nodeType === evolutionType.evoConcepts.EvoProblem.instance.id) {
        // Domain
        const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
        const domainRels = db.relops.queryRelsByFromId(domainRelType.id, nodeId)
        result.domainIds = domainRels.map(rel => rel.to)
        result.domainNames = domainRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Evo
        const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
        const evoRels = db.relops.queryRelsByFromId(evoRelType.id, nodeId)
        result.evoIds = evoRels.map(rel => rel.to)
        result.evoNames = evoRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })
    }

    // Definition-specific relations
    if (nodeType === evolutionType.evoConcepts.EvoDefinition.instance.id) {
        // Refine
        const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
        const refineRels = db.relops.queryRelsByFromId(refineRelType.id, nodeId)
        result.refineIds = refineRels.map(rel => rel.to)
        result.refineNames = refineRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })

        // Scenario
        const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
        const scenarioRels = db.relops.queryRelsByFromId(scenarioRelType.id, nodeId)
        result.scenarioIds = scenarioRels.map(rel => rel.to)
        result.scenarioNames = scenarioRels.map(rel => {
            const entityNode = db.nodeops.queryNodeById(rel.to)
            if (entityNode) {
                const attrs = extractAttributes(db, entityNode)
                return attrs.name || entityNode.name
            }
            return rel.to
        })
    }

    return result
}

/**
 * ============================================================================
 * MAIN HANDLER REGISTRATION
 * ============================================================================
 */

function registerEntityHandlers() {

    /**
     * ========================================================================
     * PENETRATION APIs
     * ========================================================================
     */

    /**
     * Get Entity node from real entity node (upward penetration)
     * RealEntity → Entity
     */
    ipcMain.handle("entity:getRelatedEntity", async (_ev, realEntityId) => {
        try {
            return invokeDb((db) => {
                const realNode = db.nodeops.queryNodeById(realEntityId)
                if (!realNode) return null

                // Get name from real entity
                const attrs = extractAttributes(db, realNode)
                const entityName = attrs.name || realNode.name

                // Find Entity node with same name
                const entityType = evolutionType.evoConcepts.EvoEntity.instance
                const entityNode = db.nodeops.queryNodeByName(entityType.id, entityName)

                if (!entityNode) {
                    console.warn(`No Entity node found for real entity: ${entityName} (${realEntityId})`)
                    return null
                }

                return {
                    id: entityNode.id,
                    name: entityNode.name,
                    type: 'entity'
                }
            })
        } catch (e) {
            console.error("Failed to get related entity:", e)
            return null
        }
    })

    /**
     * Get real entity nodes from Entity node (downward penetration)
     * Entity → RealEntities[]
     */
    ipcMain.handle("entity:getRelatedNodes", async (_ev, entityId) => {
        try {
            return invokeDb((db) => {
                const entityNode = db.nodeops.queryNodeById(entityId)
                if (!entityNode) return []

                const entityName = entityNode.name
                const realEntities = []

                // Search in all real entity types
                const realTypes = [
                    { type: evolutionType.evoConcepts.EvoObject.instance, name: 'object' },
                    { type: evolutionType.evoConcepts.EvoAlgo.instance, name: 'algo' },
                    { type: evolutionType.evoConcepts.EvoImprovement.instance, name: 'improvement' },
                    { type: evolutionType.evoConcepts.EvoProblem.instance, name: 'problem' },
                    { type: evolutionType.evoConcepts.EvoDefinition.instance, name: 'definition' },
                    { type: evolutionType.evoConcepts.EvoContrib.instance, name: 'contrib' }
                ]

                for (const { type, name } of realTypes) {
                    const realEntity = db.nodeops.queryNodeByName(type.id, entityName)
                    if (realEntity) {
                        const attrs = extractAttributes(db, realEntity)
                        realEntities.push({
                            id: realEntity.id,
                            name: attrs.name || realEntity.name,
                            description: attrs.description || '',
                            type: name
                        })
                    }
                }

                return realEntities
            })
        } catch (e) {
            console.error("Failed to get related nodes:", e)
            return []
        }
    })

    /**
     * ========================================================================
     * ENTITY APIs (EvoEntity nodes)
     * ========================================================================
     */

    /**
     * Get all Entity nodes
     */
    ipcMain.handle("entity:getAllEntities", async () => {
        try {
            return invokeDb((db) => {
                const entityType = evolutionType.evoConcepts.EvoEntity.instance
                const nodes = db.nodeops.queryNodesByType(entityType.id)

                return nodes.map(node => {
                    const attrs = extractAttributes(db, node)
                    const relations = getEntityRelations(db, node.id)

                    return {
                        id: node.id,
                        name: attrs.name || node.name,
                        description: attrs.description || '',
                        ...relations
                    }
                })
            })
        } catch (e) {
            console.error("Failed to get all entities:", e)
            return []
        }
    })

    /**
     * Get Entity node by ID
     */
    ipcMain.handle("entity:getEntityById", async (_ev, entityId) => {
        try {
            return invokeDb((db) => {
                const node = db.nodeops.queryNodeById(entityId)
                if (!node) return null

                const attrs = extractAttributes(db, node)
                const relations = getEntityRelations(db, node.id)

                return {
                    id: node.id,
                    name: attrs.name || node.name,
                    description: attrs.description || '',
                    ...relations
                }
            })
        } catch (e) {
            console.error("Failed to get entity by ID:", e)
            return null
        }
    })

    /**
     * Add new Entity node
     */
    ipcMain.handle("entity:addEntity", async (_ev, entityData) => {
        try {
            return invokeDb((db) => {
                const { name, description, subjectId, aliasIds, parentIds, relationIds } = entityData

                // Create Entity node
                const entityType = evolutionType.evoConcepts.EvoEntity.instance
                const nodeId = addNodeToDb(db, entityType.id, name)

                // Add attributes
                if (name) {
                    const nameAttrType = evolutionType.evoAttributes.AttributeEvoName.instance
                    addAttrToNode(db, nodeId, nameAttrType.id, name)
                }
                if (description) {
                    const descAttrType = evolutionType.evoAttributes.AttributeEvoDesc.instance
                    addAttrToNode(db, nodeId, descAttrType.id, description)
                }

                // Add relations
                if (subjectId) {
                    const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                    addRelToDb(db, subjectRelType.id, nodeId, subjectId)
                }
                if (aliasIds && aliasIds.length > 0) {
                    const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                    aliasIds.forEach(aliasId => {
                        addRelToDb(db, aliasRelType.id, nodeId, aliasId)
                    })
                }
                if (parentIds && parentIds.length > 0) {
                    const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                    parentIds.forEach(parentId => {
                        addRelToDb(db, parentRelType.id, nodeId, parentId)
                    })
                }
                if (relationIds && relationIds.length > 0) {
                    const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                    relationIds.forEach(relationId => {
                        addRelToDb(db, relationRelType.id, nodeId, relationId)
                    })
                }

                return { success: true, id: nodeId }
            })
        } catch (e) {
            console.error("Failed to add entity:", e)
            return { success: false, error: e.message }
        }
    })

    /**
     * Update Entity node
     */
    ipcMain.handle("entity:updateEntity", async (_ev, entityId, entityData) => {
        try {
            return invokeDb((db) => {
                const { name, description, subjectId, aliasIds, parentIds, relationIds } = entityData

                // Update name
                if (name !== undefined) {
                    updateNodeName(db, entityId, name)

                    // Update name attribute
                    const node = db.nodeops.queryNodeById(entityId)
                    if (node) {
                        const nameAttrType = evolutionType.evoAttributes.AttributeEvoName.instance
                        const existingNameAttr = node.attributes
                            .map(attrId => db.attrops.queryAttrById(attrId))
                            .find(attr => attr && attr.type === nameAttrType.id)

                        if (existingNameAttr) {
                            updateAttrValue(db, existingNameAttr.id, name)
                        } else {
                            addAttrToNode(db, entityId, nameAttrType.id, name)
                        }
                    }
                }

                // Update description
                if (description !== undefined) {
                    const node = db.nodeops.queryNodeById(entityId)
                    if (node) {
                        const descAttrType = evolutionType.evoAttributes.AttributeEvoDesc.instance
                        const existingDescAttr = node.attributes
                            .map(attrId => db.attrops.queryAttrById(attrId))
                            .find(attr => attr && attr.type === descAttrType.id)

                        if (existingDescAttr) {
                            updateAttrValue(db, existingDescAttr.id, description)
                        } else {
                            addAttrToNode(db, entityId, descAttrType.id, description)
                        }
                    }
                }

                // Update Subject relation
                if (subjectId !== undefined) {
                    const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                    const existingRels = db.relops.queryRelsByFromId(subjectRelType.id, entityId)
                    existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                    if (subjectId) {
                        addRelToDb(db, subjectRelType.id, entityId, subjectId)
                    }
                }

                // Update Alias relations
                if (aliasIds !== undefined) {
                    const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                    const existingRels = db.relops.queryRelsByFromId(aliasRelType.id, entityId)
                    existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                    if (aliasIds && aliasIds.length > 0) {
                        aliasIds.forEach(aliasId => {
                            addRelToDb(db, aliasRelType.id, entityId, aliasId)
                        })
                    }
                }

                // Update Parent relations
                if (parentIds !== undefined) {
                    const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                    const existingRels = db.relops.queryRelsByFromId(parentRelType.id, entityId)
                    existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                    if (parentIds && parentIds.length > 0) {
                        parentIds.forEach(parentId => {
                            addRelToDb(db, parentRelType.id, entityId, parentId)
                        })
                    }
                }

                // Update Relation relations
                if (relationIds !== undefined) {
                    const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                    const existingRels = db.relops.queryRelsByFromId(relationRelType.id, entityId)
                    existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                    if (relationIds && relationIds.length > 0) {
                        relationIds.forEach(relationId => {
                            addRelToDb(db, relationRelType.id, entityId, relationId)
                        })
                    }
                }

                return { success: true }
            })
        } catch (e) {
            console.error("Failed to update entity:", e)
            return { success: false, error: e.message }
        }
    })

    /**
     * Delete Entity node
     */
    ipcMain.handle("entity:deleteEntity", async (_ev, entityId) => {
        try {
            return invokeDb((db) => {
                db.nodeops.deleteNode(entityId)
                return { success: true }
            })
        } catch (e) {
            console.error("Failed to delete entity:", e)
            return { success: false, error: e.message }
        }
    })

    /**
     * ========================================================================
     * NODE APIs (Real entity nodes: Object/Algo/Improvement/Problem/Definition/Contrib)
     * ========================================================================
     */

    /**
     * Get all nodes of a specific type
     */
    ipcMain.handle("entity:getAllNodes", async (_ev, entityType) => {
        try {
            return invokeDb((db) => {
                const conceptType = getTypeInstance(entityType)
                const nodes = db.nodeops.queryNodesByType(conceptType.id)

                return nodes.map(node => {
                    const attrs = extractAttributes(db, node)

                    // Get Entity node for this real entity
                    const entityName = attrs.name || node.name
                    const entityTypeInstance = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, entityName)
                    const entityRelations = entityNode ? getEntityRelations(db, entityNode.id) : {}

                    // Get type-specific relations (algo, improvement, contrib, etc.)
                    const typeSpecificRelations = getTypeSpecificRelations(db, node.id, node.type)

                    // Get entity type string
                    const entityTypeString = getEntityTypeString(node.type)

                    let result = {
                        id: node.id,
                        name: attrs.name || node.name,
                        description: attrs.description || '',
                        type: entityTypeString,
                        entityId: entityNode ? entityNode.id : null,
                        ...entityRelations,
                        ...typeSpecificRelations
                    }

                    // Add type-specific attributes
                    if (attrs.metric !== undefined) result.metric = attrs.metric
                    if (attrs.metricResultString !== undefined) result.metricResultString = attrs.metricResultString
                    if (attrs.metricResultNumber !== undefined) result.metricResultNumber = attrs.metricResultNumber

                    return result
                })
            })
        } catch (e) {
            console.error("Failed to get all nodes:", e)
            return []
        }
    })

    /**
     * Get node by ID
     */
    ipcMain.handle("entity:getNodeById", async (_ev, nodeId) => {
        try {
            return invokeDb((db) => {
                const node = db.nodeops.queryNodeById(nodeId)
                if (!node) return null

                const attrs = extractAttributes(db, node)
                const entityType = getEntityTypeString(node.type)

                // Get Entity node for this real entity
                const entityName = attrs.name || node.name
                const entityTypeInstance = evolutionType.evoConcepts.EvoEntity.instance
                const entityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, entityName)
                const entityRelations = entityNode ? getEntityRelations(db, entityNode.id) : {}

                // Get type-specific relations (algo, improvement, contrib, etc.)
                const typeSpecificRelations = getTypeSpecificRelations(db, node.id, node.type)

                let result = {
                    id: node.id,
                    name: attrs.name || node.name,
                    description: attrs.description || '',
                    type: entityType,
                    entityId: entityNode ? entityNode.id : null,
                    ...entityRelations,
                    ...typeSpecificRelations
                }

                // Add type-specific attributes
                if (attrs.metric !== undefined) result.metric = attrs.metric
                if (attrs.metricResultString !== undefined) result.metricResultString = attrs.metricResultString
                if (attrs.metricResultNumber !== undefined) result.metricResultNumber = attrs.metricResultNumber

                return result
            })
        } catch (e) {
            console.error("Failed to get node by ID:", e)
            return null
        }
    })

    /**
     * Add new node (real entity)
     * This will also create a corresponding Entity node if it doesn't exist
     */
    ipcMain.handle("entity:addNode", async (_ev, entityType, nodeData) => {
        try {
            return invokeDb((db) => {
                let { name, description, metric, metricResultString, metricResultNumber,
                        subjectId, aliasIds, parentIds, relationIds,
                        // Algo-specific
                        targetIds, expectationIds, transformationIds,
                        // Improvement-specific
                        originIds, advanceIds,
                        // Contrib-specific
                        improvementIds, algoIds, objectIds, solutionToId,
                        // Problem/Definition-specific
                        domainIds, evoIds, refineIds, scenarioIds } = nodeData

                // Auto-generate name for Contrib: subdomain_contrib_序号
                if (entityType === 'contrib' || entityType === 'contribution') {
                    if (!name) {
                        // Get subdomain from solutionToId (which is a Definition node)
                        let subdomain = 'unknown'
                        if (solutionToId) {
                            const solutionToNode = db.nodeops.queryNodeById(solutionToId)
                            if (solutionToNode) {
                                const solutionToAttrs = extractAttributes(db, solutionToNode)
                                subdomain = solutionToAttrs.name || solutionToNode.name || 'unknown'
                            }
                        }

                        // Find next sequence number for this subdomain
                        const conceptType = getTypeInstance(entityType)
                        const allContribs = db.nodeops.queryNodesByType(conceptType.id)
                        const subdomainContribs = allContribs.filter(node => {
                            const nodeName = node.name || ''
                            return nodeName.startsWith(`${subdomain}_contrib_`)
                        })
                        const nextSeq = subdomainContribs.length + 1
                        name = `${subdomain}_contrib_${nextSeq}`
                    }
                }

                // Create real entity node (e.g., o1, a1, c1)
                const conceptType = getTypeInstance(entityType)
                const node = new kg_interface.Node(conceptType.id, [], name)
                const nodeId = node.id

                // Create and add attributes based on entity type
                // According to evolution.cjs:
                // - entity: no attributes
                // - object/algo/contrib/problem/definition: [Name, Desc]
                // - improvement: [Name, Desc, Metric, MetricResultString, MetricResultNumber]
                const attributes = []

                if (entityType === 'entity') {
                    // EvoEntity has no attributes (evolution.cjs line 81)
                    // Do nothing
                } else if (entityType === 'improvement') {
                    // EvoImprovement: [Name, Desc, Metric, MetricResultString, MetricResultNumber]
                    if (name) {
                        const nameAttrType = evolutionType.evoAttributes.AttributeEvoName.instance
                        const nameAttr = new kg_interface.AttributeInstance(nameAttrType.id, name)
                        db.attrops.mergeAttr(nameAttr.toDb())
                        attributes.push(nameAttr.id)
                    }

                    const descAttrType = evolutionType.evoAttributes.AttributeEvoDesc.instance
                    const descAttr = new kg_interface.AttributeInstance(descAttrType.id, description || '')
                    db.attrops.mergeAttr(descAttr.toDb())
                    attributes.push(descAttr.id)

                    const metricAttrType = evolutionType.evoAttributes.AttributeEvoMetric.instance
                    const metricAttr = new kg_interface.AttributeInstance(metricAttrType.id, metric || '')
                    db.attrops.mergeAttr(metricAttr.toDb())
                    attributes.push(metricAttr.id)

                    const metricResultStringAttrType = evolutionType.evoAttributes.AttributeEvoMetricResultString.instance
                    const metricResultStringAttr = new kg_interface.AttributeInstance(metricResultStringAttrType.id, metricResultString || '')
                    db.attrops.mergeAttr(metricResultStringAttr.toDb())
                    attributes.push(metricResultStringAttr.id)

                    const metricResultNumberAttrType = evolutionType.evoAttributes.AttributeEvoMetricResultNumber.instance
                    const metricResultNumberAttr = new kg_interface.AttributeInstance(metricResultNumberAttrType.id, metricResultNumber !== undefined ? metricResultNumber : -1)
                    db.attrops.mergeAttr(metricResultNumberAttr.toDb())
                    attributes.push(metricResultNumberAttr.id)
                } else {
                    // object/algo/contrib/problem/definition: [Name, Desc]
                    if (name) {
                        const nameAttrType = evolutionType.evoAttributes.AttributeEvoName.instance
                        const nameAttr = new kg_interface.AttributeInstance(nameAttrType.id, name)
                        db.attrops.mergeAttr(nameAttr.toDb())
                        attributes.push(nameAttr.id)
                    }

                    const descAttrType = evolutionType.evoAttributes.AttributeEvoDesc.instance
                    const descAttr = new kg_interface.AttributeInstance(descAttrType.id, description || '')
                    db.attrops.mergeAttr(descAttr.toDb())
                    attributes.push(descAttr.id)
                }

                // Update node with attributes
                node.attributes = attributes
                db.nodeops.mergeNode(node.toDb())

                // Create or get Entity node with same name (e.g., e1)
                const entityTypeInstance = evolutionType.evoConcepts.EvoEntity.instance
                let entityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, name)

                if (!entityNode) {
                    // Create new Entity node
                    entityNode = new kg_interface.Node(entityTypeInstance.id, [], name)
                    const entityNodeId = entityNode.id
                    const entityAttributes = []

                    // EvoEntity only has name attribute (evolution.cjs line 81)
                    if (name) {
                        const nameAttrType = evolutionType.evoAttributes.AttributeEvoName.instance
                        const nameAttr = new kg_interface.AttributeInstance(nameAttrType.id, name)
                        db.attrops.mergeAttr(nameAttr.toDb())
                        entityAttributes.push(nameAttr.id)
                    }

                    // Update entity node with attributes
                    entityNode.attributes = entityAttributes
                    db.nodeops.mergeNode(entityNode.toDb())

                    // Add relations to Entity node (e1 -> other entities)
                    if (subjectId) {
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const subjectRel = new kg_interface.Rel(subjectRelType.id, `${entityNodeId}-subject-${subjectId}`, [], entityNodeId, subjectId)
                        db.relops.mergeRel(subjectRel.toDb())
                    }

                    // Alias: e1 -> e2 (where user selected o2, find e2)
                    if (aliasIds && aliasIds.length > 0) {
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        aliasIds.forEach(selectedNodeId => {
                            // Find the entity corresponding to the selected node
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const aliasRel = new kg_interface.Rel(aliasRelType.id, `${entityNodeId}-alias-${targetEntityNode.id}`, [], entityNodeId, targetEntityNode.id)
                                    db.relops.mergeRel(aliasRel.toDb())
                                }
                            }
                        })
                    }

                    if (parentIds && parentIds.length > 0) {
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        parentIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const parentRel = new kg_interface.Rel(parentRelType.id, `${entityNodeId}-parent-${targetEntityNode.id}`, [], entityNodeId, targetEntityNode.id)
                                    db.relops.mergeRel(parentRel.toDb())
                                }
                            }
                        })
                    }

                    if (relationIds && relationIds.length > 0) {
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        relationIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const relationRel = new kg_interface.Rel(relationRelType.id, `${entityNodeId}-relation-${targetEntityNode.id}`, [], entityNodeId, targetEntityNode.id)
                                    db.relops.mergeRel(relationRel.toDb())
                                }
                            }
                        })
                    }

                    // Algo-specific relations: a1 -> e2 (where user selected a2, find e2)
                    if (targetIds && targetIds.length > 0) {
                        const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                        targetIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const targetRel = new kg_interface.Rel(targetRelType.id, `${nodeId}-target-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(targetRel.toDb())
                                }
                            }
                        })
                    }

                    if (expectationIds && expectationIds.length > 0) {
                        const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                        expectationIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const expectationRel = new kg_interface.Rel(expectationRelType.id, `${nodeId}-expectation-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(expectationRel.toDb())
                                }
                            }
                        })
                    }

                    if (transformationIds && transformationIds.length > 0) {
                        const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
                        transformationIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const transformationRel = new kg_interface.Rel(transformationRelType.id, `${nodeId}-transformation-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(transformationRel.toDb())
                                }
                            }
                        })
                    }

                    // Improvement-specific relations
                    if (originIds && originIds.length > 0) {
                        const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                        originIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const originRel = new kg_interface.Rel(originRelType.id, `${nodeId}-origin-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(originRel.toDb())
                                }
                            }
                        })
                    }

                    if (advanceIds && advanceIds.length > 0) {
                        const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance
                        advanceIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const advanceRel = new kg_interface.Rel(advanceRelType.id, `${nodeId}-advance-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(advanceRel.toDb())
                                }
                            }
                        })
                    }

                    // Contrib-specific relations: c1 -> s1 (solutionTo is definition node)
                    if (solutionToId) {
                        const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance
                        const solutionToRel = new kg_interface.Rel(solutionToRelType.id, `${nodeId}-solutionTo-${solutionToId}`, [], nodeId, solutionToId)
                        db.relops.mergeRel(solutionToRel.toDb())
                    }

                    // ContribImprovement: Contrib -> Improvement (connect to real Improvement node, not Entity)
                    if (improvementIds && improvementIds.length > 0) {
                        const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
                        improvementIds.forEach(selectedNodeId => {
                            // selectedNodeId is already an Improvement node (i1, i2, etc.)
                            // Connect directly to it, no need to find Entity
                            const improvementRel = new kg_interface.Rel(improvementRelType.id, `${nodeId}-improvement-${selectedNodeId}`, [], nodeId, selectedNodeId)
                            db.relops.mergeRel(improvementRel.toDb())
                        })
                    }

                    // ContribAlgo: Contrib -> Algo (connect to real Algo node, not Entity)
                    if (algoIds && algoIds.length > 0) {
                        const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
                        algoIds.forEach(selectedNodeId => {
                            // selectedNodeId is already an Algo node (a1, a2, etc.)
                            // Connect directly to it, no need to find Entity
                            const algoRel = new kg_interface.Rel(algoRelType.id, `${nodeId}-algo-${selectedNodeId}`, [], nodeId, selectedNodeId)
                            db.relops.mergeRel(algoRel.toDb())
                        })
                    }

                    // ContribObject: Contrib -> Object (connect to real Object node, not Entity)
                    if (objectIds && objectIds.length > 0) {
                        const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
                        objectIds.forEach(selectedNodeId => {
                            // selectedNodeId is already an Object node (o1, o2, etc.)
                            // Connect directly to it, no need to find Entity
                            const objectRel = new kg_interface.Rel(objectRelType.id, `${nodeId}-object-${selectedNodeId}`, [], nodeId, selectedNodeId)
                            db.relops.mergeRel(objectRel.toDb())
                        })
                    }

                    // Problem/Definition-specific relations
                    if (domainIds && domainIds.length > 0) {
                        const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                        domainIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const domainRel = new kg_interface.Rel(domainRelType.id, `${nodeId}-domain-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(domainRel.toDb())
                                }
                            }
                        })
                    }

                    // ProblemEvo: Problem -> Problem (connect to real Problem node, not Entity)
                    if (evoIds && evoIds.length > 0 && entityType === 'problem') {
                        const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
                        evoIds.forEach(selectedNodeId => {
                            // selectedNodeId is already a Problem node (p1, p2, etc.)
                            // Connect directly to it, no need to find Entity
                            const evoRel = new kg_interface.Rel(evoRelType.id, `${nodeId}-evo-${selectedNodeId}`, [], nodeId, selectedNodeId)
                            db.relops.mergeRel(evoRel.toDb())
                        })
                    }

                    // DefinitionRefine: Definition -> Problem (connect to real Problem node, not Entity)
                    if (refineIds && refineIds.length > 0) {
                        const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                        refineIds.forEach(selectedNodeId => {
                            // selectedNodeId is already a Problem node (p1, p2, etc.)
                            // Connect directly to it, no need to find Entity
                            const refineRel = new kg_interface.Rel(refineRelType.id, `${nodeId}-refine-${selectedNodeId}`, [], nodeId, selectedNodeId)
                            db.relops.mergeRel(refineRel.toDb())
                        })
                    }

                    // DefinitionScenario: Definition -> Entity (connect to Entity node)
                    if (scenarioIds && scenarioIds.length > 0) {
                        const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                        scenarioIds.forEach(selectedNodeId => {
                            const selectedNode = db.nodeops.queryNodeById(selectedNodeId)
                            if (selectedNode) {
                                const selectedNodeAttrs = extractAttributes(db, selectedNode)
                                const selectedNodeName = selectedNodeAttrs.name || selectedNode.name
                                const targetEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, selectedNodeName)
                                if (targetEntityNode) {
                                    const scenarioRel = new kg_interface.Rel(scenarioRelType.id, `${nodeId}-scenario-${targetEntityNode.id}`, [], nodeId, targetEntityNode.id)
                                    db.relops.mergeRel(scenarioRel.toDb())
                                }
                            }
                        })
                    }

                    // DefinitionEvo: Definition -> Definition (connect to real Definition node, not Entity)
                    if (evoIds && evoIds.length > 0 && entityType === 'definition') {
                        const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance
                        evoIds.forEach(selectedNodeId => {
                            // selectedNodeId is already a Definition node (s1, s2, etc.)
                            // Connect directly to it, no need to find Entity
                            const evoRel = new kg_interface.Rel(evoRelType.id, `${nodeId}-evo-${selectedNodeId}`, [], nodeId, selectedNodeId)
                            db.relops.mergeRel(evoRel.toDb())
                        })
                    }
                }

                return { success: true, id: nodeId, entityId: entityNode ? entityNode.id : null }
            })
        } catch (e) {
            console.error("Failed to add node:", e)
            return { success: false, error: e.message }
        }
    })

    /**
     * Update node (real entity)
     * This will also update the corresponding Entity node
     */
    ipcMain.handle("entity:updateNode", async (_ev, nodeId, nodeData) => {
        try {
            return invokeDb((db) => {
                const node = db.nodeops.queryNodeById(nodeId)
                if (!node) return { success: false, error: "Node not found" }

                const oldAttrs = extractAttributes(db, node)
                const oldName = oldAttrs.name || node.name
                const entityType = getEntityTypeString(node.type)

                const { name, description, metric, metricResultString, metricResultNumber,
                        subjectId, aliasIds, parentIds, relationIds,
                        // Algo-specific
                        targetIds, expectationIds, transformationIds,
                        // Improvement-specific
                        originIds, advanceIds,
                        // Contrib-specific
                        improvementIds, algoIds, objectIds, solutionToId,
                        // Problem/Definition-specific
                        domainIds, evoIds, refineIds, scenarioIds } = nodeData

                // Update real entity node name
                if (name !== undefined && name !== oldName) {
                    updateNodeName(db, nodeId, name)
                }

                // Update attributes
                const updateOrAddAttr = (attrType, value) => {
                    if (value === undefined) return

                    const existingAttr = node.attributes
                        .map(attrId => db.attrops.queryAttrById(attrId))
                        .find(attr => attr && attr.type === attrType.id)

                    if (existingAttr) {
                        updateAttrValue(db, existingAttr.id, value)
                    } else {
                        addAttrToNode(db, nodeId, attrType.id, value)
                    }
                }

                updateOrAddAttr(evolutionType.evoAttributes.AttributeEvoName.instance, name)
                updateOrAddAttr(evolutionType.evoAttributes.AttributeEvoDesc.instance, description)
                updateOrAddAttr(evolutionType.evoAttributes.AttributeEvoMetric.instance, metric)
                updateOrAddAttr(evolutionType.evoAttributes.AttributeEvoMetricResultString.instance, metricResultString)
                updateOrAddAttr(evolutionType.evoAttributes.AttributeEvoMetricResultNumber.instance, metricResultNumber)

                // Update Entity node if name changed
                if (name !== undefined && name !== oldName) {
                    const entityTypeInstance = evolutionType.evoConcepts.EvoEntity.instance
                    const oldEntityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, oldName)

                    if (oldEntityNode) {
                        // Update Entity node name
                        updateNodeName(db, oldEntityNode.id, name)

                        // Update Entity node name attribute
                        const nameAttrType = evolutionType.evoAttributes.AttributeEvoName.instance
                        const existingNameAttr = oldEntityNode.attributes
                            .map(attrId => db.attrops.queryAttrById(attrId))
                            .find(attr => attr && attr.type === nameAttrType.id)

                        if (existingNameAttr) {
                            updateAttrValue(db, existingNameAttr.id, name)
                        }
                    }
                }

                // Update Entity node relations
                const entityTypeInstance = evolutionType.evoConcepts.EvoEntity.instance
                const currentName = name !== undefined ? name : oldName
                const entityNode = db.nodeops.queryNodeByName(entityTypeInstance.id, currentName)

                if (entityNode) {
                    // Update description
                    if (description !== undefined) {
                        const descAttrType = evolutionType.evoAttributes.AttributeEvoDesc.instance
                        const existingDescAttr = entityNode.attributes
                            .map(attrId => db.attrops.queryAttrById(attrId))
                            .find(attr => attr && attr.type === descAttrType.id)

                        if (existingDescAttr) {
                            updateAttrValue(db, existingDescAttr.id, description)
                        } else {
                            addAttrToNode(db, entityNode.id, descAttrType.id, description)
                        }
                    }

                    // Update Subject relation
                    if (subjectId !== undefined) {
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const existingRels = db.relops.queryRelsByFromId(subjectRelType.id, entityNode.id)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (subjectId) {
                            addRelToDb(db, subjectRelType.id, entityNode.id, subjectId)
                        }
                    }

                    // Update Alias relations
                    if (aliasIds !== undefined) {
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        const existingRels = db.relops.queryRelsByFromId(aliasRelType.id, entityNode.id)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (aliasIds && aliasIds.length > 0) {
                            aliasIds.forEach(aliasId => {
                                addRelToDb(db, aliasRelType.id, entityNode.id, aliasId)
                            })
                        }
                    }

                    // Update Parent relations
                    if (parentIds !== undefined) {
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        const existingRels = db.relops.queryRelsByFromId(parentRelType.id, entityNode.id)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (parentIds && parentIds.length > 0) {
                            parentIds.forEach(parentId => {
                                addRelToDb(db, parentRelType.id, entityNode.id, parentId)
                            })
                        }
                    }

                    // Update Relation relations
                    if (relationIds !== undefined) {
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        const existingRels = db.relops.queryRelsByFromId(relationRelType.id, entityNode.id)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (relationIds && relationIds.length > 0) {
                            relationIds.forEach(relationId => {
                                addRelToDb(db, relationRelType.id, entityNode.id, relationId)
                            })
                        }
                    }
                }

                // Update type-specific relations on the real entity node
                // Algo-specific relations
                if (entityType === 'algo') {
                    if (targetIds !== undefined) {
                        const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                        const existingRels = db.relops.queryRelsByFromId(targetRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (targetIds && targetIds.length > 0) {
                            targetIds.forEach(targetId => {
                                addRelToDb(db, targetRelType.id, nodeId, targetId)
                            })
                        }
                    }

                    if (expectationIds !== undefined) {
                        const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                        const existingRels = db.relops.queryRelsByFromId(expectationRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (expectationIds && expectationIds.length > 0) {
                            expectationIds.forEach(expectationId => {
                                addRelToDb(db, expectationRelType.id, nodeId, expectationId)
                            })
                        }
                    }

                    if (transformationIds !== undefined) {
                        const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
                        const existingRels = db.relops.queryRelsByFromId(transformationRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (transformationIds && transformationIds.length > 0) {
                            transformationIds.forEach(transformationId => {
                                addRelToDb(db, transformationRelType.id, nodeId, transformationId)
                            })
                        }
                    }
                }

                // Improvement-specific relations
                if (entityType === 'improvement') {
                    if (originIds !== undefined) {
                        const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                        const existingRels = db.relops.queryRelsByFromId(originRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (originIds && originIds.length > 0) {
                            originIds.forEach(originId => {
                                addRelToDb(db, originRelType.id, nodeId, originId)
                            })
                        }
                    }

                    if (advanceIds !== undefined) {
                        const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance
                        const existingRels = db.relops.queryRelsByFromId(advanceRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (advanceIds && advanceIds.length > 0) {
                            advanceIds.forEach(advanceId => {
                                addRelToDb(db, advanceRelType.id, nodeId, advanceId)
                            })
                        }
                    }
                }

                // Contrib-specific relations
                if (entityType === 'contrib') {
                    if (solutionToId !== undefined) {
                        const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance
                        const existingRels = db.relops.queryRelsByFromId(solutionToRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (solutionToId) {
                            addRelToDb(db, solutionToRelType.id, nodeId, solutionToId)
                        }
                    }

                    if (improvementIds !== undefined) {
                        const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
                        const existingRels = db.relops.queryRelsByFromId(improvementRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (improvementIds && improvementIds.length > 0) {
                            improvementIds.forEach(improvementId => {
                                addRelToDb(db, improvementRelType.id, nodeId, improvementId)
                            })
                        }
                    }

                    if (algoIds !== undefined) {
                        const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
                        const existingRels = db.relops.queryRelsByFromId(algoRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (algoIds && algoIds.length > 0) {
                            algoIds.forEach(algoId => {
                                addRelToDb(db, algoRelType.id, nodeId, algoId)
                            })
                        }
                    }

                    if (objectIds !== undefined) {
                        const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
                        const existingRels = db.relops.queryRelsByFromId(objectRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (objectIds && objectIds.length > 0) {
                            objectIds.forEach(objectId => {
                                addRelToDb(db, objectRelType.id, nodeId, objectId)
                            })
                        }
                    }
                }

                // Problem-specific relations
                if (entityType === 'problem') {
                    if (domainIds !== undefined) {
                        const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                        const existingRels = db.relops.queryRelsByFromId(domainRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (domainIds && domainIds.length > 0) {
                            domainIds.forEach(domainId => {
                                addRelToDb(db, domainRelType.id, nodeId, domainId)
                            })
                        }
                    }

                    if (evoIds !== undefined) {
                        const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
                        const existingRels = db.relops.queryRelsByFromId(evoRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (evoIds && evoIds.length > 0) {
                            evoIds.forEach(evoId => {
                                addRelToDb(db, evoRelType.id, nodeId, evoId)
                            })
                        }
                    }
                }

                // Definition-specific relations
                if (entityType === 'definition') {
                    if (refineIds !== undefined) {
                        const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                        const existingRels = db.relops.queryRelsByFromId(refineRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (refineIds && refineIds.length > 0) {
                            refineIds.forEach(refineId => {
                                addRelToDb(db, refineRelType.id, nodeId, refineId)
                            })
                        }
                    }

                    if (scenarioIds !== undefined) {
                        const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                        const existingRels = db.relops.queryRelsByFromId(scenarioRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (scenarioIds && scenarioIds.length > 0) {
                            scenarioIds.forEach(scenarioId => {
                                addRelToDb(db, scenarioRelType.id, nodeId, scenarioId)
                            })
                        }
                    }

                    if (evoIds !== undefined) {
                        const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance
                        const existingRels = db.relops.queryRelsByFromId(evoRelType.id, nodeId)
                        existingRels.forEach(rel => removeRelFromDb(db, rel.id))
                        if (evoIds && evoIds.length > 0) {
                            evoIds.forEach(evoId => {
                                addRelToDb(db, evoRelType.id, nodeId, evoId)
                            })
                        }
                    }
                }

                return { success: true }
            })
        } catch (e) {
            console.error("Failed to update node:", e)
            return { success: false, error: e.message }
        }
    })

    /**
     * Delete node (real entity)
     * This will NOT delete the corresponding Entity node (Entity nodes are shared)
     */
    ipcMain.handle("entity:deleteNode", async (_ev, nodeId) => {
        try {
            return invokeDb((db) => {
                db.nodeops.deleteNode(nodeId)
                return { success: true }
            })
        } catch (e) {
            console.error("Failed to delete node:", e)
            return { success: false, error: e.message }
        }
    })

}

module.exports = {
    registerEntityHandlers
}

