const { TypeOps, NodeOps, RelOps, TypeRelOps, AttrOps } = require("../interface.cjs")
const kg_interface = require("../../kg/interface.cjs")

function reconstructType(record) {
    if (!record) return null

    const { typeclass, typename, supertype, args } = record

    // Create appropriate Type subclass based on typeclass
    let typeObj
    switch (typeclass) {
        case 'primitive':
            // Primitive types are singletons, shouldn't be reconstructed from DB
            typeObj = new kg_interface.Type(typeclass, typename, supertype, null)
            break
        case 'conceptType':
            typeObj = kg_interface.ConceptType.instance
            break
        case 'attributeType':
            typeObj = kg_interface.AttributeType.instance
            break
        case 'entityType':
            typeObj = kg_interface.EntityType.instance
            break
        case 'relType':
            typeObj = kg_interface.RelType.instance
            break
        case 'attribute':
            // Attribute needs to restore args first
            const attrArgs = args ? args.split("/") : [null, null]
            typeObj = new kg_interface.Attribute(attrArgs[0], typename, attrArgs[1])
            break
        case 'concept':
            // Concept args is array of attribute ids
            const conceptArgs = args ? args.split("/") : []
            typeObj = new kg_interface.Concept(conceptArgs, typename)
            break
        case 'entity':
            typeObj = new kg_interface.Entity(args, typename)
            break
        case 'typeRel':
            // TypeRel needs to parse args: "from/to!attr1@attr2@..."
            const typeRelArgs = parseRelArgs(args)
            typeObj = new kg_interface.TypeRel(typename, typeRelArgs.from, typeRelArgs.to, typeRelArgs.attributeIds)
            break
        case 'instanceRel':
            // InstanceRel needs to parse args: "from/to!attr1@attr2@..."
            const instRelArgs = parseRelArgs(args)
            typeObj = new kg_interface.InstanceRel(typename, instRelArgs.from, instRelArgs.to, instRelArgs.attributeIds)
            break
        default:
            // Generic Type
            typeObj = new kg_interface.Type(typeclass, typename, supertype, args)
    }

    return typeObj
}

function parseRelArgs(args) {
    if (!args) return { from: null, to: null, attributeIds: [] }

    const parts = args.split("/")
    const from = parts[0]
    const toAndAttrs = parts[1] ? parts[1].split("!") : ["", ""]
    const to = toAndAttrs[0]
    const attributeIds = toAndAttrs[1] && toAndAttrs[1] !== "" ? toAndAttrs[1].split("@") : []

    return { from, to, attributeIds }
}

class SqliteTypeOps extends TypeOps{
    constructor(dbops) {
        super(dbops.db)
    }

    mergeType(type){
        // type is a dict from Type.toDb(): {id, typeclass, typename, supertype, args}
        const stmt = this.db.prepare(`
            INSERT INTO type (id, typeclass, typename, supertype, args)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                typeclass = excluded.typeclass,
                typename = excluded.typename,
                supertype = excluded.supertype,
                args = excluded.args
        `)
        stmt.run(type.id, type.typeclass, type.typename, type.supertype, type.args)
    }

    deleteType(type){
        // type can be either a dict with id or just an id string
        const id = typeof type === 'string' ? type : type.id
        const stmt = this.db.prepare('DELETE FROM type WHERE id = ?')
        stmt.run(id)
    }

    queryTypeByName(typeclass, typename){
        const stmt = this.db.prepare('SELECT * FROM type WHERE typeclass = ? AND typename = ?')
        const record = stmt.get(typeclass, typename)
        return reconstructType(record)
    }

    queryTypeById(id){
        const stmt = this.db.prepare('SELECT * FROM type WHERE id = ?')
        const record = stmt.get(id)
        return reconstructType(record)
    }
}

class SqliteNodeOps extends NodeOps{
    constructor(dbops) {
        super(dbops.db)
    }

    mergeNode(node){
        // node is a dict from Node.toDb(): {type, id, name, attr}
        // attr is an array, need to serialize to JSON
        const attrJson = JSON.stringify(node.attr)
        const stmt = this.db.prepare(`
            INSERT INTO node (id, type, name, attr)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                type = excluded.type,
                name = excluded.name,
                attr = excluded.attr
        `)
        stmt.run(node.id, node.type, node.name, attrJson)
    }

    deleteNode(node){
        const id = typeof node === 'string' ? node : node.id
        const stmt = this.db.prepare('DELETE FROM node WHERE id = ?')
        stmt.run(id)
    }

    queryNodeByName(nodetype, nodename){
        const stmt = this.db.prepare('SELECT * FROM node WHERE type = ? AND name = ?')
        const result = stmt.get(nodetype, nodename)
        if(result){
            // Parse attr JSON back to array and create Node object
            result.attr = JSON.parse(result.attr)
            const node = new kg_interface.Node(result.type, result.attr)
            node.fromDb(result)
            return node
        }
        return null
    }

    queryNodeById(id){
        const stmt = this.db.prepare('SELECT * FROM node WHERE id = ?')
        const result = stmt.get(id)
        if(result){
            result.attr = JSON.parse(result.attr)
            const node = new kg_interface.Node(result.type, result.attr, result.name)
            node.fromDb(result)
            return node
        }
        return null
    }

    queryNodesByType(nodetype){
        const stmt = this.db.prepare('SELECT * FROM node WHERE type = ?')
        const results = stmt.all(nodetype)
        return results.map(result => {
            result.attr = JSON.parse(result.attr)
            const node = new kg_interface.Node(result.type, result.attr, result.name)
            node.fromDb(result)
            return node
        })
    }
}

class SqliteRelOps extends RelOps{
    constructor(dbops) {
        super(dbops.db)
    }

    mergeRel(rel){
        // rel is a dict from Rel.toDb(): {type, id, name, attr, from, to}
        // attr is an array, need to serialize to JSON
        const attrJson = JSON.stringify(rel.attr)
        const stmt = this.db.prepare(`
            INSERT INTO rel (id, type, name, attr, fromid, toid)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                type = excluded.type,
                name = excluded.name,
                attr = excluded.attr,
                fromid = excluded.fromid,
                toid = excluded.toid
        `)
        stmt.run(rel.id, rel.type, rel.name, attrJson, rel.from, rel.to)
    }

    deleteRel(rel){
        const id = typeof rel === 'string' ? rel : rel.id
        const stmt = this.db.prepare('DELETE FROM rel WHERE id = ?')
        stmt.run(id)
    }

    queryRelByName(reltype, relname){
        const stmt = this.db.prepare('SELECT * FROM rel WHERE type = ? AND name = ?')
        const result = stmt.get(reltype, relname)
        if(result){
            result.attr = JSON.parse(result.attr)
            // Map database fields to Rel object fields
            result.from = result.fromid
            result.to = result.toid
            const rel = new kg_interface.Rel(result.type, result.name, result.attr, result.fromid, result.toid)
            rel.fromDb(result)
            return rel
        }
        return null
    }

    queryRelById(id){
        const stmt = this.db.prepare('SELECT * FROM rel WHERE id = ?')
        const result = stmt.get(id)
        if(result){
            result.attr = JSON.parse(result.attr)
            // Map database fields to Rel object fields
            result.from = result.fromid
            result.to = result.toid
            const rel = new kg_interface.Rel(result.type, result.name, result.attr, result.fromid, result.toid)
            rel.fromDb(result)
            return rel
        }
        return null
    }

    queryRelsByType(reltype){
        const stmt = this.db.prepare('SELECT * FROM rel WHERE type = ?')
        const results = stmt.all(reltype)
        return results.map(result => {
            result.attr = JSON.parse(result.attr)
            // Map database fields to Rel object fields
            result.from = result.fromid
            result.to = result.toid
            const rel = new kg_interface.Rel(result.type, result.name, result.attr, result.fromid, result.toid)
            rel.fromDb(result)
            return rel
        })
    }

    queryRelsByFromId(reltype, fromid){
        const stmt = this.db.prepare('SELECT * FROM rel WHERE type = ? AND fromid = ?')
        const results = stmt.all(reltype, fromid)
        return results.map(result => {
            result.attr = JSON.parse(result.attr)
            // Map database fields to Rel object fields
            result.from = result.fromid
            result.to = result.toid
            const rel = new kg_interface.Rel(result.type, result.name, result.attr, result.fromid, result.toid)
            rel.fromDb(result)
            return rel
        })
    }

    queryRelsByToId(reltype, toid){
        const stmt = this.db.prepare('SELECT * FROM rel WHERE type = ? AND toid = ?')
        const results = stmt.all(reltype, toid)
        return results.map(result => {
            result.attr = JSON.parse(result.attr)
            // Map database fields to Rel object fields
            result.from = result.fromid
            result.to = result.toid
            const rel = new kg_interface.Rel(result.type, result.name, result.attr, result.fromid, result.toid)
            rel.fromDb(result)
            return rel
        })
    }

    deleteRelsByFromId(reltype, fromid){
        const stmt = this.db.prepare('DELETE FROM rel WHERE type = ? AND fromid = ?')
        stmt.run(reltype, fromid)
    }

    deleteRelsByToId(reltype, toid){
        const stmt = this.db.prepare('DELETE FROM rel WHERE type = ? AND toid = ?')
        stmt.run(reltype, toid)
    }
}

class SqliteTypeRelOps extends TypeRelOps{
    constructor(dbops) {
        super(dbops.db)
    }

    mergeTypeRel(typerel){
        // typerel is a dict with: {type, id, name, attr, from, to}
        // attr is an array, need to serialize to JSON
        const attrJson = JSON.stringify(typerel.attr)
        const stmt = this.db.prepare(`
            INSERT INTO typerel (id, type, name, attr, fromid, toid)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                type = excluded.type,
                name = excluded.name,
                attr = excluded.attr,
                fromid = excluded.fromid,
                toid = excluded.toid
        `)
        stmt.run(typerel.id, typerel.type, typerel.name, attrJson, typerel.from, typerel.to)
    }

    deleteTypeRel(typerel){
        const id = typeof typerel === 'string' ? typerel : typerel.id
        const stmt = this.db.prepare('DELETE FROM typerel WHERE id = ?')
        stmt.run(id)
    }

    queryTypeRelByName(typereltype, typerelname){
        const stmt = this.db.prepare('SELECT * FROM typerel WHERE type = ? AND name = ?')
        const result = stmt.get(typereltype, typerelname)
        if(result){
            result.attr = JSON.parse(result.attr)
            // Create a TypeRel object from the stored data
            // Note: We need to get the TypeRel type definition first
            const typeRelType = new kg_interface.TypeRel(result.name, result.fromid, result.toid, result.attr)
            return { ...result, typeRelType }
        }
        return null
    }

    queryTypeRelById(id){
        const stmt = this.db.prepare('SELECT * FROM typerel WHERE id = ?')
        const result = stmt.get(id)
        if(result){
            result.attr = JSON.parse(result.attr)
            // Create a TypeRel object from the stored data
            const typeRelType = new kg_interface.TypeRel(result.name, result.fromid, result.toid, result.attr)
            return { ...result, typeRelType }
        }
        return null
    }
}

class SqliteAttrOps extends AttrOps{
    constructor(dbops) {
        super(dbops.db)
    }

    mergeAttr(attr){
        // attr is a dict from AttributeInstance.toDb(): {type, id, raw}
        // raw is already encoded string value
        const stmt = this.db.prepare(`
            INSERT INTO attribute (id, type, raw)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                type = excluded.type,
                raw = excluded.raw
        `)
        stmt.run(attr.id, attr.type, attr.raw)
    }

    deleteAttr(attr){
        const id = typeof attr === 'string' ? attr : attr.id
        const stmt = this.db.prepare('DELETE FROM attribute WHERE id = ?')
        stmt.run(id)
    }

    queryAttrByName(attrtype, attrname){
        // AttributeInstance doesn't have a name field, this might not be applicable
        // Query by type instead and return array of AttributeInstance objects
        const stmt = this.db.prepare('SELECT * FROM attribute WHERE type = ?')
        const results = stmt.all(attrtype)
        return results.map(result => {
            const attrInst = new kg_interface.AttributeInstance(result.type, null)
            attrInst.fromDb({ ...result, decoded: result.raw })
            return attrInst
        })
    }

    queryAttrById(id){
        const stmt = this.db.prepare('SELECT * FROM attribute WHERE id = ?')
        const result = stmt.get(id)
        if(result){
            const attrInst = new kg_interface.AttributeInstance(result.type, null)
            attrInst.fromDb({ ...result, decoded: result.raw })
            return attrInst
        }
        return null
    }
}

module.exports = {
    SqliteTypeOps, SqliteNodeOps, SqliteRelOps, SqliteTypeRelOps, SqliteAttrOps
}