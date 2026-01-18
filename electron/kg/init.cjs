const refType = require("./reftype.cjs")
const predefine = require("./predefine.cjs")
const kg_interface = require("./interface.cjs")
const invokeDb = require("../config/default.cjs").invokeDb

function collectTypes(obj) {
    const types = []
    const typeRels = []

    for (const key in obj) {
        const value = obj[key]
        if (value instanceof kg_interface.TypeRel) {
            // TypeRel instance (e.g., SubConceptOf instances in evoConstraints)
            typeRels.push(value)
        } else if (value instanceof kg_interface.Type) {
            // Other Type instances
            types.push(value)
        } else if (typeof value === 'function' && value.instance instanceof kg_interface.TypeRel) {
            // Singleton class with TypeRel instance (class is typeof 'function')
            types.push(value.instance)
        } else if (typeof value === 'function' && value.instance instanceof kg_interface.Type) {
            // Singleton class with Type instance (class is typeof 'function')
            types.push(value.instance)
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively collect from nested objects
            const nested = collectTypes(value)
            types.push(...nested.types)
            typeRels.push(...nested.typeRels)
        }
    }
    return { types, typeRels }
}

function init_kg() {
    invokeDb((db) => {
        db.dbops.begin()
        try {
            // Layer 2: MetaConcepts
            const metaConcepts = [
                kg_interface.ConceptType.instance,
                kg_interface.AttributeType.instance,
                kg_interface.EntityType.instance,
                kg_interface.RelType.instance
            ]
            for (const type of metaConcepts) {
                db.typeops.mergeType(type.toDb())
            }

            // Primitive types
            const primitiveTypes = [
                predefine.primitive.NumberType.instance,
                predefine.primitive.StringType.instance,
                predefine.primitive.BooleanType.instance,
                predefine.primitive.VoidType.instance
            ]
            for (const type of primitiveTypes) {
                db.typeops.mergeType(type.toDb())
            }

            // Layer 3: RefTypes (subject, signature, evolution, article)
            const collected = {
                subject: collectTypes(refType.subjectType),
                signature: collectTypes(refType.signatureType),
                evolution: collectTypes(refType.evolutionType),
                article: collectTypes(refType.articleType)
            }

            // Merge all Types
            for (const key in collected) {
                for (const type of collected[key].types) {
                    db.typeops.mergeType(type.toDb())
                }
            }

            // Merge all TypeRels
            for (const key in collected) {
                for (const typeRel of collected[key].typeRels) {
                    // Create TypeRelInstance for the actual relationship between types
                    const typeRelInst = new kg_interface.TypeRelInstance(
                        typeRel.supertype,    // type: the TypeRel itself
                        typeRel.typename,     // name: relationship name
                        typeRel.attributes,   // attributes
                        typeRel.from,         // from: source type id
                        typeRel.to            // to: target type id
                    )
                    db.typerelops.mergeTypeRel(typeRelInst.toDb())
                }
            }

            db.dbops.commit()
        } catch (e) {
            db.dbops.rollback()
            throw e
        }
    })
}

module.exports = {
    init_kg,
    collectTypes
}