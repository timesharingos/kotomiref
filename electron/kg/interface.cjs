const sha256 = require("js-sha256").sha256
class ToDb{
    toDb(){return null}
    fromDb(obj){throw new TypeError("not implemented")}
    encode(data){return data}
    decode(data){return data}
}

class Type extends ToDb{
    #typeclass
    #typename
    #args
    #supertype
    #id
    #encoder
    #decoder
    constructor(typeclass, typename, supertype, args){
        super()
        this.#typeclass = typeclass
        this.#typename = typename
        this.#args = args
        this.#supertype = supertype;
        this.#id = `type_${sha256(`${sha256(`${this.supertype ?? ""}`)}_${sha256(`${this.typeclass}`)}${sha256(`${this.typename}`)}`)}`
    }
    set args(args){
        this.#args = args
    }
    get typeclass() { return this.#typeclass }
    get typename() { return this.#typename }
    get supertype() { return this.#supertype }
    get args() { return this.#args }
    get id() { return this.#id }
    set processor(processor){
        this.#encoder = processor.encoder
        this.#decoder = processor.decoder
    }

    resolveArgs(){return JSON.stringify(this.#args)}
    restoreArgs(args){return JSON.parse(args)}

    equal(other){
        if(this.id != other.id)
            return false
        return this.superclass == other.superclass && this.typeclass == other.typeclass && this.typename == other.typename
    }
    toDb(){
        let base = {
            id: this.#id,
            typeclass: this.#typeclass,
            typename: this.#typename,
            supertype: this.#supertype,
            args: JSON.stringify(this.#args)
        }
        base.args = this.resolveArgs()
        return base
    }
    fromDb(obj){
        this.#id = obj.id
        this.#typeclass = obj.typeclass,
        this.#typename = obj.typename,
        this.#supertype = obj.supertype,
        this.#args = obj.#args == null ? obj.#args : restoreArgs(obj.#args)
    }
    encode(data){
        return this.#encoder(data)
    }
    decode(data){
        return this.#decoder(data)
    }
}
class ConceptType extends Type{
    static #first_create = true
    static #instance = new ConceptType()
    constructor(){
        super("conceptType", "concept", null, null)
        if(!ConceptType.#first_create){
            throw new TypeError("ConceptType is not constructable, use ConceptType.instance instead")
        }
        ConceptType.#first_create = false
    }
    static get instance(){return ConceptType.#instance}
}

class AttributeType extends Type{
    static #first_create = true
    static #instance = new AttributeType()
    constructor(){
        super("attributeType", "attribute", null, null)
        if(!AttributeType.#first_create){
            throw new TypeError("AttributeType is not constructable, use AttributeType.instance instead")
        }
        AttributeType.#first_create = false
    }
    static get instance(){return AttributeType.#instance}
}

class EntityType extends Type{
    static #first_create = true
    static #instance = new EntityType()
    constructor(){
        super("entityType", "entity", null, null)
        if(!EntityType.#first_create){
            throw new TypeError("EntityType is not constructable, use EntityType.instance instead")
        }
        EntityType.#first_create = false
    }
    static get instance(){return EntityType.#instance}
}

class RelType extends Type{
    static #first_create = true
    static #instance = new RelType()
    constructor(){
        super("relType", "rel", null, null)
        if(!RelType.#first_create){
            throw new TypeError("RelType is not constructable, use RelType.instance instead")
        }
        RelType.#first_create = false
    }
    static get instance(){return RelType.#instance}
}

class Attribute extends Type{
    constructor(req, name, typeid){
        super("attribute", name, AttributeType.instance.id, {req: req, typeid: typeid})
    }

    get req(){return this.args.req}
    get typeid(){return this.args.typeid}

    resolveArgs(){
        return `${this.args.req}/${this.args.typeid}`
    }
    restoreArgs(args){
        let split_args = args.split("/")
        return {req: split_args[0], typeid: split_args[1]}
    }
}

class Concept extends Type{
    constructor(attributeIds, name){
        super("concept", name, ConceptType.instance.id, attributeIds)
    }
    get attributes(){return this.args}
    resolveArgs(){
        return this.args.join("/")
    }
    restoreArgs(args){
        return args.split("/")
    }
}

class Entity extends Type{
    constructor(conceptId, name){
        super("entity", name, EntityType.instance.id, conceptId)
    }
    get concept(){return this.args}
}

/*
 * TypeRel: only used between concepts, such as subclassof/parentof.
 * InstanceRel: used for instance, and an "adjugate" TypeRel is created implicitly.
 */
class TypeRel extends Type{
    constructor(name, from, to){
        super("typeRel", name, RelType.instance.id, {from: from, to: to})
    }
    get from(){return this.args.from}
    get to(){return this.args.to}

    resolveArgs(){
        return `${this.from}/${this.to}`
    }
    restoreArgs(args){
        let split_args = args.split("/")
        return {from: split_args[0], to: split_args[1]}
    }
}

class InstanceRel extends Type{
    static #relTypeMap = new WeakMap()
    #relInstance
    constructor(name, from, to){
        super("instanceRel", name, RelType.instance.id, {from: from, to: to})
    }
    get from(){return this.args.from}
    get to(){return this.args.to}

    static getTypeRel(selfType){
        let type
        if(!InstanceRel.#relTypeMap.has(selfType)){
            if(selfType === InstanceRel){
                type = TypeRel
            } else {
                type = class extends InstanceRel.getTypeRel(Object.getPrototypeOf(selfType)) {
                    constructor(name, from, to){
                        super(name, from, to)
                    }
                }
            }
            InstanceRel.#relTypeMap.set(selfType, type)
        } else {
            type = InstanceRel.#relTypeMap.get(selfType)
        }
        return type
    }
    getTypeRelInstance(selfType){
        if(!this.#relInstance){
            let typerel = InstanceRel.getTypeRel(selfType)
            this.#relInstance = new typerel(this.typename, this.args.from, this.args.to)
        }
        return this.#relInstance
    }

    resolveArgs(){
        return `${this.from}/${this.to}`
    }
    restoreArgs(args){
        let split_args = args.split("/")
        return {from: split_args[0], to: split_args[1]}
    }
}

class AttributeInstance extends ToDb{
    #typeid
    #attrid
    #value
    constructor(typeid, value){
        this.#typeid = typeid
        this.#value = value
        this.#attrid = `attr_${sha256(`${this.#typeid}_${Date.now()}`)}`
    }

    get type(){return this.#typeid}
    get id(){return this.#attrid}
    get value(){return this.#value}

    toDb(){
        return {
            type: this.#typeid,
            id: this.#attrid,
            raw: this.#value
        }
    }

    fromDb(obj){
        this.#typeid = obj.type
        this.#attrid = obj.id
        this.#value = obj.decoded
    }
}

class Node extends ToDb{
    #typeid
    #nodeid
    #attributes
    #name
    constructor(typeid, attributes){
        this.#typeid = typeid
        this.#attributes = attributes
        this.#nodeid = `node_${sha256(`${this.#typeid}_${this.#name}`)}`
        this.#name = name
    }

    get type(){return this.#typeid}
    get id(){return this.#nodeid}
    get name(){return this.#name}
    get attributes(){return this.#attributes}
    set attributes(attr){this.#attributes = attr}

    addAttr(attr){this.#attributes.push(attr)}
    removeAttr(id){
        this.#attributes = this.#attributes.filter((attr) => attr.id != id)
    }

    toDb(){
        return {
            type: this.#typeid,
            id: this.#nodeid,
            attr: this.#attributes,
            name: this.#name
        }
    }
    fromDb(obj){
        this.#typeid = obj.type
        this.#nodeid = obj.id
        this.#attributes = obj.attr
        this.#name = obj.name
    }
}

class Rel extends ToDb {
    #typeid
    #relid
    #name
    #attributes
    #fromid
    #toid

    constructor(typeid, name, attributes, fromid, toid){
        this.#typeid = typeid
        this.#attributes = attributes
        this.#name = name
        this.#fromid = fromid
        this.#toid = toid
        this.#relid = `rel_${sha256(`${this.#typeid}_${this.#name}`)}`
    }

    get type(){return this.#typeid}
    get id(){return this.#relid}
    get name(){return this.#name}
    get attributes(){return this.#attributes}
    set attributes(attr){this.#attributes = attr}
    get from(){return this.#fromid}
    get to(){return this.#toid}

    addAttr(attr){this.#attributes.push(attr)}
    removeAttr(id){
        this.#attributes = this.#attributes.filter((attr) => attr.id != id)
    }

    toDb(){
        return {
            type: this.#typeid,
            id: this.#relid,
            name: this.#name,
            attr: this.#attributes,
            from: this.#fromid,
            to: this.#toid
        }
    }
    fromDb(obj){
        this.#typeid = obj.type
        this.#relid = obj.id
        this.#attributes = obj.attr
        this.#name = obj.name
        this.#fromid = obj.from
        this.#toid = obj.to
    }
}

module.exports = {
    ToDb,
    Type,
    ConceptType,
    RelType,
    AttributeType,
    EntityType,
    Concept,
    Attribute,
    Entity,
    InstanceRel,
    TypeRel,
    AttributeInstance,
    Node,
    Rel
}