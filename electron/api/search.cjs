const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const evolutionType = require("../kg/reftype/evolution.cjs")

/**
 * Register search IPC handlers
 */
function registerSearchHandlers() {
    // Search for problem evolution chain
    // Logic: From the query node (e.g., s3), follow ONLY outgoing evo edges
    // Example: s3 → s1 → s4 (only follow outgoing direction)
    // Handle cycles: if we encounter a visited node, add the edge but don't recurse
    ipcMain.handle("search:problemEvolutionChain", async (_ev, problemId) => {
        try {
            return invokeDb((db) => {
                const nodes = []
                const edges = []
                const visited = new Set()

                const problemEvoRelType = evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance

                function addNode(nodeId) {
                    if (visited.has(nodeId)) return false // Already added
                    visited.add(nodeId)

                    const node = db.nodeops.queryNodeById(nodeId)
                    if (!node) return false

                    const nameAttr = node.attributes[0] ? db.attrops.queryAttrById(node.attributes[0]) : null
                    const descAttr = node.attributes[1] ? db.attrops.queryAttrById(node.attributes[1]) : null

                    nodes.push({
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        description: descAttr ? descAttr.value : '',
                        type: 'problem'
                    })
                    return true // Successfully added
                }

                function traverseEvolutionChain(nodeId) {
                    addNode(nodeId)

                    // Find ONLY outgoing evo edges (nodeId → target)
                    const evoRelsFrom = db.relops.queryRelsByFromId(problemEvoRelType.id, nodeId)

                    evoRelsFrom.forEach(rel => {
                        // Always add the edge
                        edges.push({ from: rel.from, to: rel.to, type: 'evolution' })

                        // Only recurse if the target node hasn't been visited (to handle cycles)
                        if (!visited.has(rel.to)) {
                            traverseEvolutionChain(rel.to)
                        }
                    })
                }

                traverseEvolutionChain(problemId)
                return { nodes, edges }
            })
        } catch (e) {
            console.error("Failed to search problem evolution chain:", e)
            return { nodes: [], edges: [] }
        }
    })

    // Search for definition evolution chain
    // Logic: Same as problem evolution - from the query node, follow ONLY outgoing evo edges
    // Example: s3 → s1 → s4 (only follow outgoing direction)
    // Handle cycles: if we encounter a visited node, add the edge but don't recurse
    ipcMain.handle("search:definitionEvolutionChain", async (_ev, definitionId) => {
        try {
            return invokeDb((db) => {
                const nodes = []
                const edges = []
                const visited = new Set()

                const definitionEvoRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance

                function addNode(nodeId) {
                    if (visited.has(nodeId)) return false // Already added
                    visited.add(nodeId)

                    const node = db.nodeops.queryNodeById(nodeId)
                    if (!node) return false

                    const nameAttr = node.attributes[0] ? db.attrops.queryAttrById(node.attributes[0]) : null
                    const descAttr = node.attributes[1] ? db.attrops.queryAttrById(node.attributes[1]) : null

                    nodes.push({
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        description: descAttr ? descAttr.value : '',
                        type: 'definition'
                    })
                    return true // Successfully added
                }

                function traverseEvolutionChain(nodeId) {
                    addNode(nodeId)

                    // Find ONLY outgoing evo edges (nodeId → target)
                    const evoRelsFrom = db.relops.queryRelsByFromId(definitionEvoRelType.id, nodeId)

                    evoRelsFrom.forEach(rel => {
                        // Always add the edge
                        edges.push({ from: rel.from, to: rel.to, type: 'evolution' })

                        // Only recurse if the target node hasn't been visited (to handle cycles)
                        if (!visited.has(rel.to)) {
                            traverseEvolutionChain(rel.to)
                        }
                    })
                }

                traverseEvolutionChain(definitionId)
                return { nodes, edges }
            })
        } catch (e) {
            console.error("Failed to search definition evolution chain:", e)
            return { nodes: [], edges: [] }
        }
    })

    // Search for entity improvement path
    // Logic:
    // 1. Given a real entity (e.g., a1 algo), find its abstract entity (e1) by name matching
    // 2. Find all improvements where advance = e1 (incoming edges to e1)
    // 3. For each improvement, get its origin entities (e2, e3)
    // 4. For each origin entity, find its corresponding real entities by name matching
    // 5. Recursively process origin entities (handle cycles)
    // Output: Show a1-e1-(i1)->e2/e3-(ix)->... and e2/e3->o1/a2
    ipcMain.handle("search:entityImprovementPath", async (_ev, entityId) => {
        try {
            return invokeDb((db) => {
                const nodes = []
                const edges = []
                const visitedAbstractEntities = new Set() // Track abstract entities to handle cycles
                const visitedNodes = new Set() // Track all nodes added

                const improvementOriginRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance
                const improvementAdvanceRelType = evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance

                const entityType = evolutionType.evoConcepts.EvoEntity.instance
                const objectType = evolutionType.evoConcepts.EvoObject.instance
                const algoType = evolutionType.evoConcepts.EvoAlgo.instance
                const improvementType = evolutionType.evoConcepts.EvoImprovement.instance

                // Helper function to get entity type name
                function getEntityTypeName(nodeTypeId) {
                    const contribType = evolutionType.evoConcepts.EvoContrib.instance
                    const problemType = evolutionType.evoConcepts.EvoProblem.instance
                    const definitionType = evolutionType.evoConcepts.EvoDefinition.instance

                    if (nodeTypeId === objectType.id) return 'object'
                    if (nodeTypeId === algoType.id) return 'algo'
                    if (nodeTypeId === improvementType.id) return 'improvement'
                    if (nodeTypeId === contribType.id) return 'contribution'
                    if (nodeTypeId === problemType.id) return 'problem'
                    if (nodeTypeId === definitionType.id) return 'definition'
                    if (nodeTypeId === entityType.id) return 'entity'
                    return 'entity'
                }

                function addNode(nodeId) {
                    if (visitedNodes.has(nodeId)) return
                    visitedNodes.add(nodeId)

                    const node = db.nodeops.queryNodeById(nodeId)
                    if (!node) return

                    const nameAttr = node.attributes[0] ? db.attrops.queryAttrById(node.attributes[0]) : null
                    const descAttr = node.attributes[1] ? db.attrops.queryAttrById(node.attributes[1]) : null
                    const entityTypeName = getEntityTypeName(node.type)

                    nodes.push({
                        id: node.id,
                        name: nameAttr ? nameAttr.value : node.name,
                        description: descAttr ? descAttr.value : '',
                        type: entityTypeName
                    })
                }

                // Find abstract entity by name matching
                function findAbstractEntityByName(realEntityId) {
                    const realEntity = db.nodeops.queryNodeById(realEntityId)
                    if (!realEntity) return null

                    const nameAttr = realEntity.attributes[0] ? db.attrops.queryAttrById(realEntity.attributes[0]) : null
                    const entityName = nameAttr ? nameAttr.value : realEntity.name

                    // Find all abstract entities with the same name
                    const allAbstractEntities = db.nodeops.queryNodesByType(entityType.id)
                    for (const abstractEntity of allAbstractEntities) {
                        const abstractNameAttr = abstractEntity.attributes[0] ? db.attrops.queryAttrById(abstractEntity.attributes[0]) : null
                        const abstractName = abstractNameAttr ? abstractNameAttr.value : abstractEntity.name

                        if (abstractName === entityName) {
                            return abstractEntity.id
                        }
                    }
                    return null
                }

                // Find real entities by name matching with abstract entity
                function findRealEntitiesByAbstractEntity(abstractEntityId) {
                    const abstractEntity = db.nodeops.queryNodeById(abstractEntityId)
                    if (!abstractEntity) return []

                    const nameAttr = abstractEntity.attributes[0] ? db.attrops.queryAttrById(abstractEntity.attributes[0]) : null
                    const entityName = nameAttr ? nameAttr.value : abstractEntity.name

                    const realEntities = []

                    // Search in objects
                    const allObjects = db.nodeops.queryNodesByType(objectType.id)
                    for (const obj of allObjects) {
                        const objNameAttr = obj.attributes[0] ? db.attrops.queryAttrById(obj.attributes[0]) : null
                        const objName = objNameAttr ? objNameAttr.value : obj.name
                        if (objName === entityName) {
                            realEntities.push(obj.id)
                        }
                    }

                    // Search in algos
                    const allAlgos = db.nodeops.queryNodesByType(algoType.id)
                    for (const algo of allAlgos) {
                        const algoNameAttr = algo.attributes[0] ? db.attrops.queryAttrById(algo.attributes[0]) : null
                        const algoName = algoNameAttr ? algoNameAttr.value : algo.name
                        if (algoName === entityName) {
                            realEntities.push(algo.id)
                        }
                    }

                    return realEntities
                }

                // Recursively process abstract entity
                function processAbstractEntity(abstractEntityId) {
                    if (visitedAbstractEntities.has(abstractEntityId)) return // Handle cycles
                    visitedAbstractEntities.add(abstractEntityId)

                    // Add the abstract entity node
                    addNode(abstractEntityId)

                    // Find all improvements where advance = abstractEntityId (incoming edges)
                    const improvementRels = db.relops.queryRelsByToId(improvementAdvanceRelType.id, abstractEntityId)

                    improvementRels.forEach(rel => {
                        const improvementId = rel.from

                        // Add improvement node
                        addNode(improvementId)

                        // Add edge: improvement → advance (abstract entity)
                        edges.push({ from: improvementId, to: abstractEntityId, type: 'advance' })

                        // Find origin entities for this improvement
                        const originRels = db.relops.queryRelsByFromId(improvementOriginRelType.id, improvementId)

                        originRels.forEach(originRel => {
                            const originEntityId = originRel.to

                            // Add origin entity node
                            addNode(originEntityId)

                            // Add edge: origin → improvement
                            edges.push({ from: originEntityId, to: improvementId, type: 'origin' })

                            // Find real entities corresponding to this origin
                            const realEntities = findRealEntitiesByAbstractEntity(originEntityId)
                            realEntities.forEach(realEntityId => {
                                addNode(realEntityId)
                                // Add edge: real entity → abstract entity (visual connection)
                                edges.push({ from: realEntityId, to: originEntityId, type: 'instanceOf' })
                            })

                            // Recursively process the origin entity
                            processAbstractEntity(originEntityId)
                        })
                    })
                }

                // Start: Add the starting real entity
                addNode(entityId)

                // Find its abstract entity
                const abstractEntityId = findAbstractEntityByName(entityId)
                if (abstractEntityId) {
                    addNode(abstractEntityId)
                    // Add edge: real entity → abstract entity
                    edges.push({ from: entityId, to: abstractEntityId, type: 'instanceOf' })

                    // Process the abstract entity
                    processAbstractEntity(abstractEntityId)
                }

                return { nodes, edges }
            })
        } catch (e) {
            console.error("Failed to search entity improvement path:", e)
            return { nodes: [], edges: [] }
        }
    })

    // Search for problem definitions and solution paths
    // Logic:
    // 1. Given a Problem (e.g., p1), find all its Definitions (e.g., s1, s2) via DefinitionRefine
    // 2. For each Definition, find all Contributions that solve it via ContribSolutionTo (incoming edges)
    // Note: Scenario is completely irrelevant to this search!
    ipcMain.handle("search:problemDefinitionsAndSolutions", async (_ev, problemId) => {
        try {
            return invokeDb((db) => {
                const nodes = []
                const edges = []
                const visited = new Set()

                // Add the problem node
                const problemNode = db.nodeops.queryNodeById(problemId)
                if (!problemNode) {
                    return { nodes: [], edges: [] }
                }

                const problemNameAttr = problemNode.attributes[0] ? db.attrops.queryAttrById(problemNode.attributes[0]) : null
                const problemDescAttr = problemNode.attributes[1] ? db.attrops.queryAttrById(problemNode.attributes[1]) : null

                nodes.push({
                    id: problemNode.id,
                    name: problemNameAttr ? problemNameAttr.value : problemNode.name,
                    description: problemDescAttr ? problemDescAttr.value : '',
                    type: 'problem'
                })
                visited.add(problemId)

                const definitionRefineRelType = evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance
                const contribSolutionToRelType = evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance

                // Step 1: Find all definitions that refine this problem
                // Edge direction: definition → (refine) → problem
                // So we need to find incoming edges to the problem
                const refineRels = db.relops.queryRelsByToId(definitionRefineRelType.id, problemId)

                refineRels.forEach(rel => {
                    const definitionNode = db.nodeops.queryNodeById(rel.from)
                    if (!definitionNode || visited.has(rel.from)) return

                    const nameAttr = definitionNode.attributes[0] ? db.attrops.queryAttrById(definitionNode.attributes[0]) : null
                    const descAttr = definitionNode.attributes[1] ? db.attrops.queryAttrById(definitionNode.attributes[1]) : null

                    nodes.push({
                        id: definitionNode.id,
                        name: nameAttr ? nameAttr.value : definitionNode.name,
                        description: descAttr ? descAttr.value : '',
                        type: 'definition'
                    })
                    visited.add(rel.from)

                    edges.push({ from: rel.from, to: rel.to, type: 'refine' })

                    // Step 2: For each definition, find all contributions that solve it
                    // Edge direction: contribution → (solutionTo) → definition
                    // So we need to find incoming edges to the definition
                    const solutionRels = db.relops.queryRelsByToId(contribSolutionToRelType.id, rel.from)

                    solutionRels.forEach(solutionRel => {
                        const contribNode = db.nodeops.queryNodeById(solutionRel.from)
                        if (!contribNode) return

                        // Add contribution node if not already added
                        if (!visited.has(solutionRel.from)) {
                            const contribDescAttr = contribNode.attributes[0] ? db.attrops.queryAttrById(contribNode.attributes[0]) : null

                            nodes.push({
                                id: contribNode.id,
                                name: contribNode.name,
                                description: contribDescAttr ? contribDescAttr.value : '',
                                type: 'contribution'
                            })
                            visited.add(solutionRel.from)
                        }

                        edges.push({ from: solutionRel.from, to: solutionRel.to, type: 'solution' })
                    })
                })

                return { nodes, edges }
            })
        } catch (e) {
            console.error("Failed to search problem definitions and solutions:", e)
            return { nodes: [], edges: [] }
        }
    })

    // Search for one-hop neighbors of a node
    ipcMain.handle("search:oneHopNeighbors", async (_ev, nodeId) => {
        try {
            return invokeDb((db) => {
                const nodes = []
                const edges = []
                const visited = new Set()

                // Add the center node
                const centerNode = db.nodeops.queryNodeById(nodeId)
                if (!centerNode) {
                    return { nodes: [], edges: [] }
                }

                const centerNameAttr = centerNode.attributes[0] ? db.attrops.queryAttrById(centerNode.attributes[0]) : null
                const centerDescAttr = centerNode.attributes[1] ? db.attrops.queryAttrById(centerNode.attributes[1]) : null

                nodes.push({
                    id: centerNode.id,
                    name: centerNameAttr ? centerNameAttr.value : centerNode.name,
                    description: centerDescAttr ? centerDescAttr.value : '',
                    type: 'center'
                })
                visited.add(nodeId)

                // Get all relation types
                const allRelTypes = [
                    // Base entity relations
                    evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityAlias.instance,
                    evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityParent.instance,
                    evolutionType.evoInstanceRel.evoEntityInstanceRel.EntityRelation.instance,
                    // Algo relations
                    evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTarget.instance,
                    evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoExpectation.instance,
                    evolutionType.evoInstanceRel.evoAlgoInstaceRel.AlgoTransformation.instance,
                    // Improvement relations
                    evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementOrigin.instance,
                    evolutionType.evoInstanceRel.evoImprovementInstanceRel.ImprovementAdvance.instance,
                    // Problem relations
                    evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemDomain.instance,
                    evolutionType.evoInstanceRel.evoProblemInstanceRel.ProblemEvo.instance,
                    // Definition relations
                    evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionRefine.instance,
                    evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionScenario.instance,
                    evolutionType.evoInstanceRel.evoDefinitionInstanceRel.DefinitionEvo.instance,
                    // Contribution relations
                    evolutionType.evoInstanceRel.evoContribInstanceRel.ContribImprovement.instance,
                    evolutionType.evoInstanceRel.evoContribInstanceRel.ContribAlgo.instance,
                    evolutionType.evoInstanceRel.evoContribInstanceRel.ContribObject.instance,
                    evolutionType.evoInstanceRel.evoContribInstanceRel.ContribSolutionTo.instance
                ]

                // Find all outgoing and incoming relations
                allRelTypes.forEach(relType => {
                    // Outgoing relations
                    const outgoingRels = db.relops.queryRelsByFromId(relType.id, nodeId)
                    outgoingRels.forEach(rel => {
                        const targetNode = db.nodeops.queryNodeById(rel.to)
                        if (!targetNode || visited.has(rel.to)) return

                        const nameAttr = targetNode.attributes[0] ? db.attrops.queryAttrById(targetNode.attributes[0]) : null
                        const descAttr = targetNode.attributes[1] ? db.attrops.queryAttrById(targetNode.attributes[1]) : null

                        nodes.push({
                            id: targetNode.id,
                            name: nameAttr ? nameAttr.value : targetNode.name,
                            description: descAttr ? descAttr.value : '',
                            type: 'neighbor'
                        })
                        visited.add(rel.to)

                        edges.push({ from: rel.from, to: rel.to, type: relType.typename })
                    })

                    // Incoming relations
                    const incomingRels = db.relops.queryRelsByToId(relType.id, nodeId)
                    incomingRels.forEach(rel => {
                        const sourceNode = db.nodeops.queryNodeById(rel.from)
                        if (!sourceNode || visited.has(rel.from)) return

                        const nameAttr = sourceNode.attributes[0] ? db.attrops.queryAttrById(sourceNode.attributes[0]) : null
                        const descAttr = sourceNode.attributes[1] ? db.attrops.queryAttrById(sourceNode.attributes[1]) : null

                        nodes.push({
                            id: sourceNode.id,
                            name: nameAttr ? nameAttr.value : sourceNode.name,
                            description: descAttr ? descAttr.value : '',
                            type: 'neighbor'
                        })
                        visited.add(rel.from)

                        edges.push({ from: rel.from, to: rel.to, type: relType.typename })
                    })
                })

                return { nodes, edges }
            })
        } catch (e) {
            console.error("Failed to search one-hop neighbors:", e)
            return { nodes: [], edges: [] }
        }
    })
}

module.exports = { registerSearchHandlers }

