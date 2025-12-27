const kg_interface = require("./interface.cjs")

class NumberType extends kg_interface.Type{
    static #instance = new NumberType()
    static #first_create = true

    constructor(){
        super("primitive", "number", null, null)
        if(!NumberType.#first_create){
            throw new TypeError("NumberType is not constructable, use NumberType.instance instead")
        }
        NumberType.#first_create = false
    }

    static get instance(){return NumberType.#instance}

    encode(data){
        return String(data)
    }
    decode(data){
        return Number(data)
    }
}

class StringType extends kg_interface.Type{
    static #instance = new StringType()
    static #first_create = true

    constructor(){
        super("primitive", "number", null, null)
        if(!StringType.#first_create){
            throw new TypeError("StringType is not constructable, use StringType.instance instead")
        }
        StringType.#first_create = false
    }

    static get instance(){return StringType.#instance}

    encode(data){
        return data
    }
    decode(data){
        return data
    }
}

class BooleanType extends kg_interface.Type{
    static #instance = new BooleanType()
    static #first_create = true

    constructor(){
        super("primitive", "number", null, null)
        if(!BooleanType.#first_create){
            throw new TypeError("BooleanType is not constructable, use BooleanType.instance instead")
        }
        BooleanType.#first_create = false
    }

    static get instance(){return BooleanType.#instance}

    encode(data){
        return data ? "true" : "false"
    }
    decode(data){
        return data === "true"
    }
}

class VoidType extends kg_interface.Type{
    static #instance = new VoidType()
    static #first_create = true

    constructor(){
        super("primitive", "number", null, null)
        if(!VoidType.#first_create){
            throw new TypeError("VoidType is not constructable, use VoidType.instance instead")
        }
        VoidType.#first_create = false
    }

    static get instance(){return VoidType.#instance}

    encode(data){
        return ""
    }
    decode(data){
        return null
    }
}

const primitiveType = {
    NumberType,
    StringType,
    BooleanType,
    VoidType
}

const AttrReq = class Req {
    static #required = new Req("required", true)
    static #optional = new Req("optional", true)
    static #multiple = new Req("multiple", true)
    // condition Level, describing the relationship between the current attr and the previous one
    // Sib = depends on what the previous one depends on (common parent)
    // Child = depends on the previous one (exact parent)
    // Par = depends on the what the parent of the preivous one depends on (common grandparent)
    static #conditionSib = new Req("conditionSib", true)
    static #conditionChild = new Req("conditionChild", true)
    static #conditionPar = new Req("conditionPar", true)
    #value
    constructor(value, bypass = false){
        if(!bypass){
            throw new TypeError("AttrReq is an enumuration, use AttrReq.[value] instead")
        }
        this.#value = value 
    }
    get value(){return this.#value}
    static get required(){return Req.#required}
    static get optional(){return Req.#optional}
    static get multiple(){return Req.#multiple}
    static get conditionSib(){return Req.#conditionSib}
    static get conditionChild(){return Req.#conditionChild}
    static get conditionPar(){return Req.#conditionPar}
}

module.exports = {
    primitive: primitiveType,
    AttrReq,
}