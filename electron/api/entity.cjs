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
                    // For Contribution, query directly from the node itself
                    // For other types, find corresponding Entity node by name
                    let entityNodeId = node.id
                    if (entityType !== 'contrib') {
                        const entityConceptType = evolutionType.evoConcepts.EvoEntity.instance
                        const entityNode = db.nodeops.queryNodeByName(entityConceptType.id, node.name)
                        if (entityNode) {
                            entityNodeId = entityNode.id
                        } else {
                            entityNodeId = null
                        }
                    }

                    if (entityNodeId) {
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

                        // Get Alias relations
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        const aliasRels = db.relops.queryRelsByFromId(aliasRelType.id, entityNodeId)
                        result.aliasIds = aliasRels.map(rel => rel.to)
                        result.aliasNames = aliasRels.map(rel => {
                            const aliasNode = db.nodeops.queryNodeById(rel.to)
                            return aliasNode ? aliasNode.name : rel.to
                        })

                        // Get Parent relations
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        const parentRels = db.relops.queryRelsByFromId(parentRelType.id, entityNodeId)
                        result.parentIds = parentRels.map(rel => rel.to)
                        result.parentNames = parentRels.map(rel => {
                            const parentNode = db.nodeops.queryNodeById(rel.to)
                            return parentNode ? parentNode.name : rel.to
                        })

                        // Get Relation relations
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        const relationRels = db.relops.queryRelsByFromId(relationRelType.id, entityNodeId)
                        result.relationIds = relationRels.map(rel => rel.to)
                        result.relationNames = relationRels.map(rel => {
                            const relationNode = db.nodeops.queryNodeById(rel.to)
                            return relationNode ? relationNode.name : rel.to
                        })

                        // Get Algo-specific relations if entity type is algo
                        if (entityNodeId && entityType === 'algo') {
                            // Get Target relations
                            const targetRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance
                            const targetRels = db.relops.queryRelsByFromId(targetRelType.id, entityNodeId)
                            result.targetIds = targetRels.map(rel => rel.to)
                            result.targetNames = targetRels.map(rel => {
                                const targetNode = db.nodeops.queryNodeById(rel.to)
                                return targetNode ? targetNode.name : rel.to
                            })

                            // Get Expectation relations
                            const expectationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance
                            const expectationRels = db.relops.queryRelsByFromId(expectationRelType.id, entityNodeId)
                            result.expectationIds = expectationRels.map(rel => rel.to)
                            result.expectationNames = expectationRels.map(rel => {
                                const expectationNode = db.nodeops.queryNodeById(rel.to)
                                return expectationNode ? expectationNode.name : rel.to
                            })

                            // Get Transformation relations
                            const transformationRelType = evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance
                            const transformationRels = db.relops.queryRelsByFromId(transformationRelType.id, entityNodeId)
                            result.transformationIds = transformationRels.map(rel => rel.to)
                            result.transformationNames = transformationRels.map(rel => {
                                const transformationNode = db.nodeops.queryNodeById(rel.to)
                                return transformationNode ? transformationNode.name : rel.to
                            })
                        }

                        // Get Improvement-specific relations if entity type is improvement
                        if (entityNodeId && entityType === 'improvement') {
                            // Get Origin relations
                            const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                            const originRels = db.relops.queryRelsByFromId(originRelType.id, entityNodeId)
                            result.originIds = originRels.map(rel => rel.to)
                            result.originNames = originRels.map(rel => {
                                const originNode = db.nodeops.queryNodeById(rel.to)
                                return originNode ? originNode.name : rel.to
                            })

                            // Get Advance relations
                            const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance
                            const advanceRels = db.relops.queryRelsByFromId(advanceRelType.id, entityNodeId)
                            result.advanceIds = advanceRels.map(rel => rel.to)
                            result.advanceNames = advanceRels.map(rel => {
                                const advanceNode = db.nodeops.queryNodeById(rel.to)
                                return advanceNode ? advanceNode.name : rel.to
                            })
                        }

                        // Get Problem-specific relations if entity type is problem
                        if (entityType === 'problem') {
                            // Get Domain relations
                            const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                            const domainRels = db.relops.queryRelsByFromId(domainRelType.id, node.id)
                            result.domainIds = domainRels.map(rel => rel.to)
                            result.domainNames = domainRels.map(rel => {
                                const domainNode = db.nodeops.queryNodeById(rel.to)
                                return domainNode ? domainNode.name : rel.to
                            })

                            // Get Evo relations
                            const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
                            const evoRels = db.relops.queryRelsByFromId(evoRelType.id, node.id)
                            result.evoIds = evoRels.map(rel => rel.to)
                            result.evoNames = evoRels.map(rel => {
                                const evoNode = db.nodeops.queryNodeById(rel.to)
                                return evoNode ? evoNode.name : rel.to
                            })
                        }

                        // Get Definition-specific relations if entity type is definition
                        if (entityType === 'definition') {
                            // Get Refine relations (Definition -> Problem)
                            const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                            const refineRels = db.relops.queryRelsByFromId(refineRelType.id, node.id)
                            result.refineIds = refineRels.map(rel => rel.to)
                            result.refineNames = refineRels.map(rel => {
                                const refineNode = db.nodeops.queryNodeById(rel.to)
                                return refineNode ? refineNode.name : rel.to
                            })

                            // Get Scenario relations (Definition -> Entity)
                            const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                            const scenarioRels = db.relops.queryRelsByFromId(scenarioRelType.id, node.id)
                            result.scenarioIds = scenarioRels.map(rel => rel.to)
                            result.scenarioNames = scenarioRels.map(rel => {
                                const scenarioNode = db.nodeops.queryNodeById(rel.to)
                                return scenarioNode ? scenarioNode.name : rel.to
                            })

                            // Get Evo relations (Definition -> Definition)
                            const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance
                            const evoRels = db.relops.queryRelsByFromId(evoRelType.id, node.id)
                            result.evoIds = evoRels.map(rel => rel.to)
                            result.evoNames = evoRels.map(rel => {
                                const evoNode = db.nodeops.queryNodeById(rel.to)
                                return evoNode ? evoNode.name : rel.to
                            })
                        }

                        // Get Contribution-specific relations if entity type is contrib
                        if (entityType === 'contrib') {
                            // Get Improvement relations (Contribution -> Improvement)
                            const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
                            const improvementRels = db.relops.queryRelsByFromId(improvementRelType.id, node.id)
                            result.improvementIds = improvementRels.map(rel => rel.to)
                            result.improvementNames = improvementRels.map(rel => {
                                const improvementNode = db.nodeops.queryNodeById(rel.to)
                                return improvementNode ? improvementNode.name : rel.to
                            })

                            // Get Algo relations (Contribution -> Algo)
                            const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
                            const algoRels = db.relops.queryRelsByFromId(algoRelType.id, node.id)
                            result.algoIds = algoRels.map(rel => rel.to)
                            result.algoNames = algoRels.map(rel => {
                                const algoNode = db.nodeops.queryNodeById(rel.to)
                                return algoNode ? algoNode.name : rel.to
                            })

                            // Get Object relations (Contribution -> Object)
                            const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
                            const objectRels = db.relops.queryRelsByFromId(objectRelType.id, node.id)
                            result.objectIds = objectRels.map(rel => rel.to)
                            result.objectNames = objectRels.map(rel => {
                                const objectNode = db.nodeops.queryNodeById(rel.to)
                                return objectNode ? objectNode.name : rel.to
                            })

                            // Get SolutionTo relation (Contribution -> Definition) - Single relation
                            const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance
                            const solutionToRels = db.relops.queryRelsByFromId(solutionToRelType.id, node.id)
                            if (solutionToRels.length > 0) {
                                result.solutionToId = solutionToRels[0].to
                                const solutionToNode = db.nodeops.queryNodeById(solutionToRels[0].to)
                                result.solutionToName = solutionToNode ? solutionToNode.name : solutionToRels[0].to
                            }
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
                const allEntities = []

                // Get all Object entities
                const objectType = evolutionType.evoConcepts.EvoObject.instance
                const objectNodes = db.nodeops.queryNodesByType(objectType.id)
                objectNodes.forEach(node => {
                    allEntities.push({
                        id: node.id,
                        name: node.name,
                        type: 'object',
                        typeName: 'Research Object'
                    })
                })

                // Get all Algo entities
                const algoType = evolutionType.evoConcepts.EvoAlgo.instance
                const algoNodes = db.nodeops.queryNodesByType(algoType.id)
                algoNodes.forEach(node => {
                    allEntities.push({
                        id: node.id,
                        name: node.name,
                        type: 'algo',
                        typeName: 'Algorithm'
                    })
                })

                // Get all Improvement entities
                const improvementType = evolutionType.evoConcepts.EvoImprovement.instance
                const improvementNodes = db.nodeops.queryNodesByType(improvementType.id)
                improvementNodes.forEach(node => {
                    allEntities.push({
                        id: node.id,
                        name: node.name,
                        type: 'improvement',
                        typeName: 'Improvement'
                    })
                })

                // Get all Problem entities
                const problemType = evolutionType.evoConcepts.EvoProblem.instance
                const problemNodes = db.nodeops.queryNodesByType(problemType.id)
                problemNodes.forEach(node => {
                    allEntities.push({
                        id: node.id,
                        name: node.name,
                        type: 'problem',
                        typeName: 'Problem'
                    })
                })

                // Get all Definition entities
                const definitionType = evolutionType.evoConcepts.EvoDefinition.instance
                const definitionNodes = db.nodeops.queryNodesByType(definitionType.id)
                definitionNodes.forEach(node => {
                    allEntities.push({
                        id: node.id,
                        name: node.name,
                        type: 'definition',
                        typeName: 'Scenario'
                    })
                })

                // Get all Contribution entities
                const contribType = evolutionType.evoConcepts.EvoContrib.instance
                const contribNodes = db.nodeops.queryNodesByType(contribType.id)
                contribNodes.forEach(node => {
                    allEntities.push({
                        id: node.id,
                        name: node.name,
                        type: 'contrib',
                        typeName: 'Contribution'
                    })
                })

                return allEntities
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

    // Add entity (Improvement type)
    ipcMain.handle("entity:addImprovement", async (_ev, data) => {
        try {
            const { name, description, subjectId, metric, metricResultString, metricResultNumber, aliasIds, parentIds, relationIds, originIds, advanceIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Create EvoImprovement node with attributes
                    const improvementType = evolutionType.evoConcepts.EvoImprovement.instance

                    // Create attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        name || ""
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    const attributes = [nameAttr.id, descAttr.id]

                    // Store basic attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Add optional metric attributes if provided
                    if (metric) {
                        const metricAttr = new kg_interface.AttributeInstance(
                            evolutionType.evoAttributes.AttributeEvoMetric.instance.id,
                            metric
                        )
                        db.attrops.mergeAttr(metricAttr.toDb())
                        attributes.push(metricAttr.id)

                        if (metricResultString) {
                            const metricResultStringAttr = new kg_interface.AttributeInstance(
                                evolutionType.evoAttributes.AttributeEvoMetricResultString.instance.id,
                                metricResultString
                            )
                            db.attrops.mergeAttr(metricResultStringAttr.toDb())
                            attributes.push(metricResultStringAttr.id)
                        }

                        if (metricResultNumber !== undefined && metricResultNumber !== null) {
                            const metricResultNumberAttr = new kg_interface.AttributeInstance(
                                evolutionType.evoAttributes.AttributeEvoMetricResultNumber.instance.id,
                                metricResultNumber
                            )
                            db.attrops.mergeAttr(metricResultNumberAttr.toDb())
                            attributes.push(metricResultNumberAttr.id)
                        }
                    }

                    // Create Improvement node
                    const improvementNode = new kg_interface.Node(
                        improvementType.id,
                        attributes,
                        name
                    )
                    db.nodeops.mergeNode(improvementNode.toDb())

                    // 2. Create corresponding EvoEntity node with same name
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = new kg_interface.Node(
                        entityType.id,
                        [], // Entity has no attributes
                        name
                    )
                    db.nodeops.mergeNode(entityNode.toDb())

                    // 3. Create Entity relations (same as Object and Algo)
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

                    // 4. Create Improvement-specific relations
                    if (originIds && originIds.length > 0) {
                        const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                        for (const originId of originIds) {
                            const originRel = new kg_interface.Rel(
                                originRelType.id,
                                `${entityNode.id}_origin_${originId}`,
                                [],
                                entityNode.id,
                                originId
                            )
                            db.relops.mergeRel(originRel.toDb())
                        }
                    }

                    if (advanceIds && advanceIds.length > 0) {
                        const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance
                        for (const advanceId of advanceIds) {
                            const advanceRel = new kg_interface.Rel(
                                advanceRelType.id,
                                `${entityNode.id}_advance_${advanceId}`,
                                [],
                                entityNode.id,
                                advanceId
                            )
                            db.relops.mergeRel(advanceRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: improvementNode.id, entityId: entityNode.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add improvement:", e)
            return { success: false, error: e.message }
        }
    })

    // Update entity (Improvement type)
    ipcMain.handle("entity:updateImprovement", async (_ev, data) => {
        try {
            const { id, name, description, subjectId, metric, metricResultString, metricResultNumber, aliasIds, parentIds, relationIds, originIds, advanceIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Update EvoImprovement node
                    const existingImprovementNode = db.nodeops.queryNodeById(id)
                    if (!existingImprovementNode) {
                        throw new Error("Improvement not found")
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

                    const attributes = [nameAttr.id, descAttr.id]

                    // Delete old attributes
                    for (const attrId of existingImprovementNode.attributes) {
                        db.attrops.deleteAttr(attrId)
                    }

                    // Store new basic attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Add optional metric attributes if provided
                    if (metric) {
                        const metricAttr = new kg_interface.AttributeInstance(
                            evolutionType.evoAttributes.AttributeEvoMetric.instance.id,
                            metric
                        )
                        db.attrops.mergeAttr(metricAttr.toDb())
                        attributes.push(metricAttr.id)

                        if (metricResultString) {
                            const metricResultStringAttr = new kg_interface.AttributeInstance(
                                evolutionType.evoAttributes.AttributeEvoMetricResultString.instance.id,
                                metricResultString
                            )
                            db.attrops.mergeAttr(metricResultStringAttr.toDb())
                            attributes.push(metricResultStringAttr.id)
                        }

                        if (metricResultNumber !== undefined && metricResultNumber !== null) {
                            const metricResultNumberAttr = new kg_interface.AttributeInstance(
                                evolutionType.evoAttributes.AttributeEvoMetricResultNumber.instance.id,
                                metricResultNumber
                            )
                            db.attrops.mergeAttr(metricResultNumberAttr.toDb())
                            attributes.push(metricResultNumberAttr.id)
                        }
                    }

                    // Update Improvement node
                    const updatedImprovementNode = new kg_interface.Node(
                        existingImprovementNode.type,
                        attributes,
                        name
                    )
                    const improvementNodeDb = updatedImprovementNode.toDb()
                    improvementNodeDb.id = id
                    db.nodeops.mergeNode(improvementNodeDb)

                    // 2. Update corresponding EvoEntity node
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const oldEntityNode = db.nodeops.queryNodeByName(entityType.id, existingImprovementNode.name)

                    if (oldEntityNode) {
                        let entityNodeId

                        if (existingImprovementNode.name !== name) {
                            // Delete old Entity node and its relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                            const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                            const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(aliasRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(parentRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(relationRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(originRelType.id, oldEntityNode.id)
                            db.relops.deleteRelsByFromId(advanceRelType.id, oldEntityNode.id)
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
                            const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                            const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(aliasRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(parentRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(relationRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(originRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(advanceRelType.id, entityNodeId)
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

                        // 4. Create Improvement-specific relations
                        if (originIds && originIds.length > 0) {
                            const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                            for (const originId of originIds) {
                                const originRel = new kg_interface.Rel(
                                    originRelType.id,
                                    `${entityNodeId}_origin_${originId}`,
                                    [],
                                    entityNodeId,
                                    originId
                                )
                                db.relops.mergeRel(originRel.toDb())
                            }
                        }

                        if (advanceIds && advanceIds.length > 0) {
                            const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance
                            for (const advanceId of advanceIds) {
                                const advanceRel = new kg_interface.Rel(
                                    advanceRelType.id,
                                    `${entityNodeId}_advance_${advanceId}`,
                                    [],
                                    entityNodeId,
                                    advanceId
                                )
                                db.relops.mergeRel(advanceRel.toDb())
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
            console.error("Failed to update improvement:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete entity (Improvement type)
    ipcMain.handle("entity:deleteImprovement", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Get Improvement node
                    const improvementNode = db.nodeops.queryNodeById(id)
                    if (!improvementNode) {
                        throw new Error("Improvement not found")
                    }

                    // 2. Delete corresponding Entity node and its relations
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityType.id, improvementNode.name)

                    if (entityNode) {
                        // Delete all Entity relations
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                        const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance
                        const originRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                        const advanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance

                        db.relops.deleteRelsByFromId(subjectRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(aliasRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(parentRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(relationRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(originRelType.id, entityNode.id)
                        db.relops.deleteRelsByFromId(advanceRelType.id, entityNode.id)

                        // Also delete relations where this entity is the target
                        db.relops.deleteRelsByToId(aliasRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(parentRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(relationRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(originRelType.id, entityNode.id)
                        db.relops.deleteRelsByToId(advanceRelType.id, entityNode.id)

                        // Delete Entity node
                        db.nodeops.deleteNode(entityNode.id)
                    }

                    // 3. Delete Improvement node and its attributes
                    for (const attrId of improvementNode.attributes) {
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
            console.error("Failed to delete improvement:", e)
            return { success: false, error: e.message }
        }
    })

    // Add entity (Problem type)
    ipcMain.handle("entity:addProblem", async (_ev, data) => {
        try {
            const { name, description, subjectId, aliasIds, parentIds, relationIds, domainIds, evoIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Create EvoProblem node with attributes
                    const problemType = evolutionType.evoConcepts.EvoProblem.instance

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

                    // Create Problem node
                    const problemNode = new kg_interface.Node(
                        problemType.id,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    db.nodeops.mergeNode(problemNode.toDb())

                    // 2. Create corresponding EvoEntity node with same name
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = new kg_interface.Node(
                        entityType.id,
                        [], // Entity has no attributes
                        name
                    )
                    db.nodeops.mergeNode(entityNode.toDb())

                    // 3. Create Entity relations (same as Object, Algo, Improvement)
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

                    // 4. Create Problem-specific relations
                    if (domainIds && domainIds.length > 0) {
                        const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                        for (const domainId of domainIds) {
                            const domainRel = new kg_interface.Rel(
                                domainRelType.id,
                                `${problemNode.id}_domain_${domainId}`,
                                [],
                                problemNode.id,
                                domainId
                            )
                            db.relops.mergeRel(domainRel.toDb())
                        }
                    }

                    if (evoIds && evoIds.length > 0) {
                        const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
                        for (const evoId of evoIds) {
                            const evoRel = new kg_interface.Rel(
                                evoRelType.id,
                                `${problemNode.id}_evo_${evoId}`,
                                [],
                                problemNode.id,
                                evoId
                            )
                            db.relops.mergeRel(evoRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: problemNode.id, entityId: entityNode.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add problem:", e)
            return { success: false, error: e.message }
        }
    })

    // Update entity (Problem type)
    ipcMain.handle("entity:updateProblem", async (_ev, data) => {
        try {
            const { id, name, description, subjectId, aliasIds, parentIds, relationIds, domainIds, evoIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Update EvoProblem node
                    const existingProblemNode = db.nodeops.queryNodeById(id)
                    if (!existingProblemNode) {
                        throw new Error("Problem not found")
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
                    if (existingProblemNode.attributes[0]) {
                        db.attrops.deleteAttr(existingProblemNode.attributes[0])
                    }
                    if (existingProblemNode.attributes[1]) {
                        db.attrops.deleteAttr(existingProblemNode.attributes[1])
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update Problem node
                    const updatedProblemNode = new kg_interface.Node(
                        existingProblemNode.type,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    const problemNodeDb = updatedProblemNode.toDb()
                    problemNodeDb.id = id
                    db.nodeops.mergeNode(problemNodeDb)

                    // 2. Update corresponding EvoEntity node
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const oldEntityNode = db.nodeops.queryNodeByName(entityType.id, existingProblemNode.name)

                    if (oldEntityNode) {
                        let entityNodeId

                        if (existingProblemNode.name !== name) {
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
                            entityNodeId = newEntityNode.id
                        } else {
                            // Name unchanged, use existing entity node
                            entityNodeId = oldEntityNode.id

                            // Delete old Entity relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(aliasRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(parentRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(relationRelType.id, entityNodeId)
                        }

                        // Delete old Problem-specific relations (from EvoProblem node)
                        const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                        const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
                        db.relops.deleteRelsByFromId(domainRelType.id, id)
                        db.relops.deleteRelsByFromId(evoRelType.id, id)

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

                        // 4. Create Problem-specific relations
                        if (domainIds && domainIds.length > 0) {
                            const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                            for (const domainId of domainIds) {
                                const domainRel = new kg_interface.Rel(
                                    domainRelType.id,
                                    `${id}_domain_${domainId}`,
                                    [],
                                    id,
                                    domainId
                                )
                                db.relops.mergeRel(domainRel.toDb())
                            }
                        }

                        if (evoIds && evoIds.length > 0) {
                            const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance
                            for (const evoId of evoIds) {
                                const evoRel = new kg_interface.Rel(
                                    evoRelType.id,
                                    `${id}_evo_${evoId}`,
                                    [],
                                    id,
                                    evoId
                                )
                                db.relops.mergeRel(evoRel.toDb())
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
            console.error("Failed to update problem:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete entity (Problem type)
    ipcMain.handle("entity:deleteProblem", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Get Problem node
                    const problemNode = db.nodeops.queryNodeById(id)
                    if (!problemNode) {
                        throw new Error("Problem not found")
                    }

                    // 2. Delete corresponding Entity node and its relations
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityType.id, problemNode.name)

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

                    // Delete Problem-specific relations (from EvoProblem node)
                    const domainRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance
                    const evoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance

                    db.relops.deleteRelsByFromId(domainRelType.id, id)
                    db.relops.deleteRelsByFromId(evoRelType.id, id)

                    // Also delete relations where this problem is the target
                    db.relops.deleteRelsByToId(domainRelType.id, id)
                    db.relops.deleteRelsByToId(evoRelType.id, id)

                    // 3. Delete Problem node and its attributes
                    for (const attrId of problemNode.attributes) {
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
            console.error("Failed to delete problem:", e)
            return { success: false, error: e.message }
        }
    })

    // Add entity (Definition type)
    ipcMain.handle("entity:addDefinition", async (_ev, data) => {
        try {
            const { name, description, subjectId, aliasIds, parentIds, relationIds, refineIds, scenarioIds, evoIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Create EvoDefinition node with attributes
                    const definitionType = evolutionType.evoConcepts.EvoDefinition.instance

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

                    // Create Definition node
                    const definitionNode = new kg_interface.Node(
                        definitionType.id,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    db.nodeops.mergeNode(definitionNode.toDb())

                    // 2. Create corresponding EvoEntity node with same name
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = new kg_interface.Node(
                        entityType.id,
                        [], // Entity has no attributes
                        name
                    )
                    db.nodeops.mergeNode(entityNode.toDb())

                    // 3. Create Entity relations (same as Object, Algo, Improvement, Problem)
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

                    // 4. Create Definition-specific relations
                    if (refineIds && refineIds.length > 0) {
                        const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                        for (const refineId of refineIds) {
                            const refineRel = new kg_interface.Rel(
                                refineRelType.id,
                                `${definitionNode.id}_refine_${refineId}`,
                                [],
                                definitionNode.id,
                                refineId
                            )
                            db.relops.mergeRel(refineRel.toDb())
                        }
                    }

                    if (scenarioIds && scenarioIds.length > 0) {
                        const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                        for (const scenarioId of scenarioIds) {
                            const scenarioRel = new kg_interface.Rel(
                                scenarioRelType.id,
                                `${definitionNode.id}_scenario_${scenarioId}`,
                                [],
                                definitionNode.id,
                                scenarioId
                            )
                            db.relops.mergeRel(scenarioRel.toDb())
                        }
                    }

                    if (evoIds && evoIds.length > 0) {
                        const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance
                        for (const evoId of evoIds) {
                            const evoRel = new kg_interface.Rel(
                                evoRelType.id,
                                `${definitionNode.id}_evo_${evoId}`,
                                [],
                                definitionNode.id,
                                evoId
                            )
                            db.relops.mergeRel(evoRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: definitionNode.id, entityId: entityNode.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add definition:", e)
            return { success: false, error: e.message }
        }
    })

    // Update entity (Definition type)
    ipcMain.handle("entity:updateDefinition", async (_ev, data) => {
        try {
            const { id, name, description, subjectId, aliasIds, parentIds, relationIds, refineIds, scenarioIds, evoIds } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Update EvoDefinition node
                    const existingDefinitionNode = db.nodeops.queryNodeById(id)
                    if (!existingDefinitionNode) {
                        throw new Error("Definition not found")
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
                    if (existingDefinitionNode.attributes[0]) {
                        db.attrops.deleteAttr(existingDefinitionNode.attributes[0])
                    }
                    if (existingDefinitionNode.attributes[1]) {
                        db.attrops.deleteAttr(existingDefinitionNode.attributes[1])
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update Definition node
                    const updatedDefinitionNode = new kg_interface.Node(
                        existingDefinitionNode.type,
                        [nameAttr.id, descAttr.id],
                        name
                    )
                    const definitionNodeDb = updatedDefinitionNode.toDb()
                    definitionNodeDb.id = id
                    db.nodeops.mergeNode(definitionNodeDb)

                    // 2. Update corresponding EvoEntity node
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const oldEntityNode = db.nodeops.queryNodeByName(entityType.id, existingDefinitionNode.name)

                    if (oldEntityNode) {
                        let entityNodeId

                        if (existingDefinitionNode.name !== name) {
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
                            entityNodeId = newEntityNode.id
                        } else {
                            // Name unchanged, use existing entity node
                            entityNodeId = oldEntityNode.id

                            // Delete old Entity relations
                            const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                            const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                            const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                            const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                            db.relops.deleteRelsByFromId(subjectRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(aliasRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(parentRelType.id, entityNodeId)
                            db.relops.deleteRelsByFromId(relationRelType.id, entityNodeId)
                        }

                        // Delete old Definition-specific relations (from EvoDefinition node)
                        const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                        const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                        const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance
                        db.relops.deleteRelsByFromId(refineRelType.id, id)
                        db.relops.deleteRelsByFromId(scenarioRelType.id, id)
                        db.relops.deleteRelsByFromId(evoRelType.id, id)

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

                        // 4. Create Definition-specific relations
                        if (refineIds && refineIds.length > 0) {
                            const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                            for (const refineId of refineIds) {
                                const refineRel = new kg_interface.Rel(
                                    refineRelType.id,
                                    `${id}_refine_${refineId}`,
                                    [],
                                    id,
                                    refineId
                                )
                                db.relops.mergeRel(refineRel.toDb())
                            }
                        }

                        if (scenarioIds && scenarioIds.length > 0) {
                            const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                            for (const scenarioId of scenarioIds) {
                                const scenarioRel = new kg_interface.Rel(
                                    scenarioRelType.id,
                                    `${id}_scenario_${scenarioId}`,
                                    [],
                                    id,
                                    scenarioId
                                )
                                db.relops.mergeRel(scenarioRel.toDb())
                            }
                        }

                        if (evoIds && evoIds.length > 0) {
                            const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance
                            for (const evoId of evoIds) {
                                const evoRel = new kg_interface.Rel(
                                    evoRelType.id,
                                    `${id}_evo_${evoId}`,
                                    [],
                                    id,
                                    evoId
                                )
                                db.relops.mergeRel(evoRel.toDb())
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
            console.error("Failed to update definition:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete entity (Definition type)
    ipcMain.handle("entity:deleteDefinition", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Get Definition node
                    const definitionNode = db.nodeops.queryNodeById(id)
                    if (!definitionNode) {
                        throw new Error("Definition not found")
                    }

                    // 2. Delete corresponding Entity node and its relations
                    const entityType = evolutionType.evoConcepts.EvoEntity.instance
                    const entityNode = db.nodeops.queryNodeByName(entityType.id, definitionNode.name)

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

                    // Delete Definition-specific relations (from EvoDefinition node)
                    const refineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                    const scenarioRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance
                    const evoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance

                    db.relops.deleteRelsByFromId(refineRelType.id, id)
                    db.relops.deleteRelsByFromId(scenarioRelType.id, id)
                    db.relops.deleteRelsByFromId(evoRelType.id, id)

                    // Also delete relations where this definition is the target
                    db.relops.deleteRelsByToId(refineRelType.id, id)
                    db.relops.deleteRelsByToId(scenarioRelType.id, id)
                    db.relops.deleteRelsByToId(evoRelType.id, id)

                    // 3. Delete Definition node and its attributes
                    for (const attrId of definitionNode.attributes) {
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
            console.error("Failed to delete definition:", e)
            return { success: false, error: e.message }
        }
    })

    // Add entity (Contribution type)
    ipcMain.handle("entity:addContribution", async (_ev, data) => {
        try {
            const { description, subjectId, aliasIds, parentIds, relationIds, improvementIds, algoIds, objectIds, solutionToId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Generate name based on domain and incremental ID
                    const contribType = evolutionType.evoConcepts.EvoContrib.instance

                    // Get domain name for name generation
                    let domainName = "unknown"
                    if (subjectId) {
                        const domainNode = db.nodeops.queryNodeById(subjectId)
                        if (domainNode) {
                            domainName = domainNode.name.toLowerCase().replace(/\s+/g, '_')
                        }
                    }

                    // Find the next available ID for this domain
                    const existingContribs = db.nodeops.queryNodesByType(contribType.id)
                    const domainContribs = existingContribs.filter(node => {
                        const namePrefix = `${domainName}_contrib_`
                        return node.name.startsWith(namePrefix)
                    })

                    let nextId = 1
                    if (domainContribs.length > 0) {
                        const ids = domainContribs.map(node => {
                            const match = node.name.match(/_contrib_(\d+)$/)
                            return match ? parseInt(match[1], 10) : 0
                        })
                        nextId = Math.max(...ids) + 1
                    }

                    const generatedName = `${domainName}_contrib_${nextId}`

                    // 2. Create EvoContrib node with attributes
                    // Create attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        generatedName
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    // Store attributes first
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Create Contribution node
                    const contribNode = new kg_interface.Node(
                        contribType.id,
                        [nameAttr.id, descAttr.id],
                        generatedName
                    )
                    db.nodeops.mergeNode(contribNode.toDb())
                    const contribNodeId = contribNode.id

                    // 3. Create Entity relations (Subject, Alias, Parent, Relation)
                    if (subjectId) {
                        const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                        const subjectRel = new kg_interface.Rel(
                            subjectRelType.id,
                            `${contribNodeId}_subject_${subjectId}`,
                            [],
                            contribNodeId,
                            subjectId
                        )
                        db.relops.mergeRel(subjectRel.toDb())
                    }

                    if (aliasIds && aliasIds.length > 0) {
                        const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                        for (const aliasId of aliasIds) {
                            const aliasRel = new kg_interface.Rel(
                                aliasRelType.id,
                                `${contribNodeId}_alias_${aliasId}`,
                                [],
                                contribNodeId,
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
                                `${contribNodeId}_parent_${parentId}`,
                                [],
                                contribNodeId,
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
                                `${contribNodeId}_relation_${relationId}`,
                                [],
                                contribNodeId,
                                relationId
                            )
                            db.relops.mergeRel(relationRel.toDb())
                        }
                    }

                    // 3. Create Contribution-specific relations
                    // Improvement relations (required)
                    if (improvementIds && improvementIds.length > 0) {
                        const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
                        for (const improvementId of improvementIds) {
                            const improvementRel = new kg_interface.Rel(
                                improvementRelType.id,
                                `${contribNodeId}_improvement_${improvementId}`,
                                [],
                                contribNodeId,
                                improvementId
                            )
                            db.relops.mergeRel(improvementRel.toDb())
                        }
                    }

                    // Algo relations (optional)
                    if (algoIds && algoIds.length > 0) {
                        const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
                        for (const algoId of algoIds) {
                            const algoRel = new kg_interface.Rel(
                                algoRelType.id,
                                `${contribNodeId}_algo_${algoId}`,
                                [],
                                contribNodeId,
                                algoId
                            )
                            db.relops.mergeRel(algoRel.toDb())
                        }
                    }

                    // Object relations (optional)
                    if (objectIds && objectIds.length > 0) {
                        const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
                        for (const objectId of objectIds) {
                            const objectRel = new kg_interface.Rel(
                                objectRelType.id,
                                `${contribNodeId}_object_${objectId}`,
                                [],
                                contribNodeId,
                                objectId
                            )
                            db.relops.mergeRel(objectRel.toDb())
                        }
                    }

                    // SolutionTo relation (required, single)
                    if (solutionToId) {
                        const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance
                        const solutionToRel = new kg_interface.Rel(
                            solutionToRelType.id,
                            `${contribNodeId}_solutionTo_${solutionToId}`,
                            [],
                            contribNodeId,
                            solutionToId
                        )
                        db.relops.mergeRel(solutionToRel.toDb())
                    }

                    db.dbops.commit()
                    return { success: true, id: contribNodeId }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add contribution:", e)
            return { success: false, error: e.message }
        }
    })

    // Update entity (Contribution type)
    ipcMain.handle("entity:updateContribution", async (_ev, data) => {
        try {
            const { id, description, subjectId, aliasIds, parentIds, relationIds, improvementIds, algoIds, objectIds, solutionToId } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Update EvoContrib node
                    const existingContribNode = db.nodeops.queryNodeById(id)
                    if (!existingContribNode) {
                        throw new Error("Contribution not found")
                    }

                    // Keep the existing name (auto-generated, should not change)
                    const existingName = existingContribNode.name

                    // Create new attribute instances
                    const nameAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoName.instance.id,
                        existingName
                    )
                    const descAttr = new kg_interface.AttributeInstance(
                        evolutionType.evoAttributes.AttributeEvoDesc.instance.id,
                        description || ""
                    )

                    // Delete old attributes first
                    for (const attrId of existingContribNode.attributes) {
                        db.attrops.deleteAttr(attrId)
                    }

                    // Store new attributes
                    db.attrops.mergeAttr(nameAttr.toDb())
                    db.attrops.mergeAttr(descAttr.toDb())

                    // Update Contribution node
                    const contribType = evolutionType.evoConcepts.EvoContrib.instance
                    const contribNode = new kg_interface.Node(
                        contribType.id,
                        [nameAttr.id, descAttr.id],
                        existingName // Keep the existing auto-generated name
                    )

                    // Merge updated node
                    db.nodeops.mergeNode(contribNode.toDb())

                    // 2. Update Entity relations (Subject, Alias, Parent, Relation)
                    const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                    const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                    const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                    const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                    // Delete old Entity relations
                    db.relops.deleteRelsByFromId(subjectRelType.id, id)
                    db.relops.deleteRelsByFromId(aliasRelType.id, id)
                    db.relops.deleteRelsByFromId(parentRelType.id, id)
                    db.relops.deleteRelsByFromId(relationRelType.id, id)

                    // Create new Entity relations
                    if (subjectId) {
                        const subjectRel = new kg_interface.Rel(
                            subjectRelType.id,
                            `${id}_subject_${subjectId}`,
                            [],
                            id,
                            subjectId
                        )
                        db.relops.mergeRel(subjectRel.toDb())
                    }

                    if (aliasIds && aliasIds.length > 0) {
                        for (const aliasId of aliasIds) {
                            const aliasRel = new kg_interface.Rel(
                                aliasRelType.id,
                                `${id}_alias_${aliasId}`,
                                [],
                                id,
                                aliasId
                            )
                            db.relops.mergeRel(aliasRel.toDb())
                        }
                    }

                    if (parentIds && parentIds.length > 0) {
                        for (const parentId of parentIds) {
                            const parentRel = new kg_interface.Rel(
                                parentRelType.id,
                                `${id}_parent_${parentId}`,
                                [],
                                id,
                                parentId
                            )
                            db.relops.mergeRel(parentRel.toDb())
                        }
                    }

                    if (relationIds && relationIds.length > 0) {
                        for (const relationId of relationIds) {
                            const relationRel = new kg_interface.Rel(
                                relationRelType.id,
                                `${id}_relation_${relationId}`,
                                [],
                                id,
                                relationId
                            )
                            db.relops.mergeRel(relationRel.toDb())
                        }
                    }

                    // 3. Update Contribution-specific relations
                    // Delete old relations
                    const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
                    const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
                    const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
                    const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance

                    db.relops.deleteRelsByFromId(improvementRelType.id, id)
                    db.relops.deleteRelsByFromId(algoRelType.id, id)
                    db.relops.deleteRelsByFromId(objectRelType.id, id)
                    db.relops.deleteRelsByFromId(solutionToRelType.id, id)

                    // Create new relations
                    if (improvementIds && improvementIds.length > 0) {
                        for (const improvementId of improvementIds) {
                            const improvementRel = new kg_interface.Rel(
                                improvementRelType.id,
                                `${id}_improvement_${improvementId}`,
                                [],
                                id,
                                improvementId
                            )
                            db.relops.mergeRel(improvementRel.toDb())
                        }
                    }

                    if (algoIds && algoIds.length > 0) {
                        for (const algoId of algoIds) {
                            const algoRel = new kg_interface.Rel(
                                algoRelType.id,
                                `${id}_algo_${algoId}`,
                                [],
                                id,
                                algoId
                            )
                            db.relops.mergeRel(algoRel.toDb())
                        }
                    }

                    if (objectIds && objectIds.length > 0) {
                        for (const objectId of objectIds) {
                            const objectRel = new kg_interface.Rel(
                                objectRelType.id,
                                `${id}_object_${objectId}`,
                                [],
                                id,
                                objectId
                            )
                            db.relops.mergeRel(objectRel.toDb())
                        }
                    }

                    if (solutionToId) {
                        const solutionToRel = new kg_interface.Rel(
                            solutionToRelType.id,
                            `${id}_solutionTo_${solutionToId}`,
                            [],
                            id,
                            solutionToId
                        )
                        db.relops.mergeRel(solutionToRel.toDb())
                    }

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to update contribution:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete entity (Contribution type)
    ipcMain.handle("entity:deleteContribution", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // 1. Get Contribution node
                    const contribNode = db.nodeops.queryNodeById(id)
                    if (!contribNode) {
                        throw new Error("Contribution not found")
                    }

                    // 2. Delete all Entity relations
                    const subjectRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntitySubject.instance
                    const aliasRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance
                    const parentRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance
                    const relationRelType = evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance

                    db.relops.deleteRelsByFromId(subjectRelType.id, id)
                    db.relops.deleteRelsByFromId(aliasRelType.id, id)
                    db.relops.deleteRelsByFromId(parentRelType.id, id)
                    db.relops.deleteRelsByFromId(relationRelType.id, id)

                    // Also delete relations where this contribution is the target
                    db.relops.deleteRelsByToId(aliasRelType.id, id)
                    db.relops.deleteRelsByToId(parentRelType.id, id)
                    db.relops.deleteRelsByToId(relationRelType.id, id)

                    // 3. Delete all Contribution-specific relations
                    const improvementRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance
                    const algoRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance
                    const objectRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance
                    const solutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance

                    db.relops.deleteRelsByFromId(improvementRelType.id, id)
                    db.relops.deleteRelsByFromId(algoRelType.id, id)
                    db.relops.deleteRelsByFromId(objectRelType.id, id)
                    db.relops.deleteRelsByFromId(solutionToRelType.id, id)

                    // 4. Delete Contribution node and its attributes
                    for (const attrId of contribNode.attributes) {
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
            console.error("Failed to delete contribution:", e)
            return { success: false, error: e.message }
        }
    })
}

module.exports = {
    registerEntityHandlers
}

