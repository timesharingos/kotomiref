const kg_interface = require("../interface.cjs")
const { primitive, AttrReq } = require("../predefine.cjs")

//Authors
class AttributeSigName extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeSigName()
    constructor(){
        if(!AttributeSigName.#first_create){
            throw new TypeError("AttributeSigName is not constructable, use AttributeSigName.instance instead.")
        }
        AttributeSigName.#first_create = false
        super(AttrReq.required.value, "AuthorName", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeSigName.#instance}
}

class Author extends kg_interface.Concept{
    static #first_create = true
    static #instance = new Author()
    constructor(){
        if(!Author.#first_create){
            throw new TypeError("Author is not constructable, use Author.instance instead.")
        }
        Author.#first_create = false
        super([AttributeSigName.instance.id], "author")
    }
    static get instance(){return Author.#instance}
}

class Affiliation extends kg_interface.Concept {
    static #first_create = true
    static #instance = new Affiliation()
    constructor(){
        if(!Affiliation.#first_create){
            throw new TypeError("Affiliation is not constructable, use Affiliation.instance instead.")
        }
        Affiliation.#first_create = false
        super([AttributeSigName.instance.id], "affiliation")
    }
    static get instance(){return Affiliation.#instance}
}

class Signature extends kg_interface.Concept{
    static #first_create = true
    static #instance = new Signature()
    constructor(){
        if(!Signature.#first_create){
            throw new TypeError("Signature is not constructable, use Signature.instance instead.")
        }
        Signature.#first_create = false
        super([AttributeSigName.instance.id], "signature")
    }
    static get instance(){return Signature.#instance}
}

class AuthorBelongTo extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new AuthorBelongTo()
    constructor(){
        if(!AuthorBelongTo.#first_create){
            throw new TypeError("AuthorBelongTo is not constructable, use AuthorBelongTo.instance instead.")
        }
        AuthorBelongTo.#first_create = false
        super("authorBelongTo", Author.instance.id, Affiliation.instance.id)
    }
    static get instance(){return AuthorBelongTo.#instance}
}

class AffiliationBelongTo extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new AffiliationBelongTo()
    constructor(){
        if(!AffiliationBelongTo.#first_create){
            throw new TypeError("AffiliationBelongTo is not constructable, use AffiliationBelongTo.instance instead.")
        }
        AffiliationBelongTo.#first_create = false
        super("affiliationBelongTo", Affiliation.instance.id, Affiliation.instance.id)
    }
    static get instance(){return AffiliationBelongTo.#instance}
}

class SignatureAuthor extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new SignatureAuthor()
    constructor(){
        if(!SignatureAuthor.#first_create){
            throw new TypeError("SignatureAuthor is not constructable, use SignatureAuthor.instance instead.")
        }
        SignatureAuthor.#first_create = false
        super("signatureAuthor", Signature.instance.id, Author.instance.id)
    }
    static get instance(){return SignatureAuthor.#instance}
}

class SignatureAffiliation extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new SignatureAffiliation()
    constructor(){
        if(!SignatureAffiliation.#first_create){
            throw new TypeError("SignatureAffiliation is not constructable, use SignatureAffiliation.instance instead.")
        }
        SignatureAffiliation.#first_create = false
        super("signatureAffiliation", Signature.instance.id, Affiliation.instance.id)
    }
    static get instance(){return SignatureAffiliation.#instance}
}

module.exports = {
    AttributeSigName,
    Author,
    Signature,
    Affiliation,
    AuthorBelongTo,
    AffiliationBelongTo,
    SignatureAuthor,
    SignatureAffiliation
}