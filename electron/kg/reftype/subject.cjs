const kg_interface = require("../interface.cjs")
const { primitive, AttrReq } = require("../predefine.cjs")

//Subject Concept
class AttributeSubjectName extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeSubjectName()
    constructor(){
        if(!AttributeSubjectName.#first_create){
            throw new TypeError("AttributeSubjectName is not constructable, use AttributeSubjectName.instance instead.")
        }
        super(AttrReq.required.value, "subjectName", primitive.StringType.instance.id)
        AttributeSubjectName.#first_create = false
    }
    static get instance(){return AttributeSubjectName.#instance}
}
class AttributeSubjectDesc extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeSubjectDesc()
    constructor(){
        if(!AttributeSubjectDesc.#first_create){
            throw new TypeError("AttributeSubjectDesc is not constructable, use AttributeSubjectDesc.instance instead.")
        }
        AttributeSubjectDesc.#first_create = false
        super(AttrReq.optional.value, "subjectDesc", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeSubjectDesc.#instance}
}

class Subject extends kg_interface.Concept {
    static #first_create = true
    static #instance = new Subject()
    constructor(){
        super([AttributeSubjectName.instance.id, AttributeSubjectDesc.instance.id], "subject")
        if(!Subject.#first_create){
            throw new TypeError("Subject is not constructable, use Subject.instance instead.")
        }
        Subject.#first_create = false
    }
    static get instance(){return Subject.#instance} 
}

class SubSubject extends kg_interface.Concept {
    static #first_create = true
    static #instance = new SubSubject()
    constructor(){
        if(!SubSubject.#first_create){
            throw new TypeError("SubSubject is not constructable, use SubSubject.instance instead.")
        }
        SubSubject.#first_create = false
        super([AttributeSubjectName.instance.id, AttributeSubjectDesc.instance.id], "subSubject")
    }
    static get instance(){return SubSubject.#instance}
}

class SubSubjectRel extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new SubSubjectRel()
    constructor(){
        if(!SubSubjectRel.#first_create){
            throw new TypeError("SubSubjectRel is not constructable, use SubSubjectRel.instance instead.")
        }
        SubSubjectRel.#first_create = false
        super("subSubjectRel", SubSubject.instance.id, Subject.instance.id)
    }
    static get instance(){return SubSubjectRel.#instance}
}

module.exports = {
    AttributeSubjectName,
    AttributeSubjectDesc,
    Subject,
    SubSubject,
    SubSubjectRel
}