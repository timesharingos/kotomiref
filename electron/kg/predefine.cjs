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
    number: NumberType.instance,
    string: StringType.instance,
    bool: BooleanType.instance,
    void: VoidType.instance
}

module.exports = {
    primitive: primitiveType
}