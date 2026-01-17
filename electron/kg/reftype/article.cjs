const kg_interface = require("../interface.cjs")
const { AttrReq, primitive, constraints } = require("../predefine.cjs")
const kg_evolution = require("./evolution.cjs")
const kg_signature = require("./signature.cjs")

// Article/Refentry
class AttributeArtTitle extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeArtTitle()
    constructor(){
        if(!AttributeArtTitle.#first_create){
            throw new TypeError("AttributeArtTitle is not constructable, use AttributeArtTitle.instance instead.")
        }
        AttributeArtTitle.#first_create = false
        super(AttrReq.required.value, "artTitle", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeArtTitle.#instance}
}
class AttributeArtPrimaryRefEntry extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeArtPrimaryRefEntry()
    constructor(){
        if(!AttributeArtPrimaryRefEntry.#first_create){
            throw new TypeError("AttributeArtPrimaryRefEntry is not constructable, use AttributeArtPrimaryRefEntry.instance instead.")
        }
        AttributeArtPrimaryRefEntry.#first_create = false
        super(AttrReq.optional.value, "artPrimaryRefEntry", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeArtPrimaryRefEntry.#instance}
}
class AttributeArtPath extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeArtPath()
    constructor(){
        if(!AttributeArtPath.#first_create){
            throw new TypeError("AttributeArtPath is not constructable, use AttributeArtPath.instance instead.")
        }
        AttributeArtPath.#first_create = false
        super(AttrReq.required.value, "artPath", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeArtPath.#instance}
}

class AttributeRefNo extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefNo()
    constructor(){
        if(!AttributeRefNo.#first_create){
            throw new TypeError("AttributeRefNo is not constructable, use AttributeRefNo.instance instead.")
        }
        AttributeRefNo.#first_create = false
        super(AttrReq.required.value, "refNo", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeRefNo.#instance}
}
class AttributeRefTitle extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefTitle()
    constructor(){
        if(!AttributeRefTitle.#first_create){
            throw new TypeError("AttributeRefTitle is not constructable, use AttributeRefTitle.instance instead.")
        }
        AttributeRefTitle.#first_create = false
        super(AttrReq.optional.value, "refTitle", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeRefTitle.#instance}
}
class AttributeRefYear extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefYear()
    constructor(){
        if(!AttributeRefYear.#first_create){
            throw new TypeError("AttributeRefYear is not constructable, use AttributeRefYear.instance instead.")
        }
        AttributeRefYear.#first_create = false
        super(AttrReq.optional.value, "refYear", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeRefYear.#instance}
}
class AttributeRefPublication extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefPublication()
    constructor(){
        if(!AttributeRefPublication.#first_create){
            throw new TypeError("AttributeRefPublication is not constructable, use AttributeRefPublication.instance instead.")
        }
        AttributeRefPublication.#first_create = false
        super(AttrReq.required.value, "refPublication", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeRefPublication.#instance}
}
class AttributeRefIndex extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefIndex()
    constructor(){
        if(!AttributeRefIndex.#first_create){
            throw new TypeError("AttributeRefIndex is not constructable, use AttributeRefIndex.instance instead.")
        }
        AttributeRefIndex.#first_create = false
        super(AttrReq.optional.value, "refIndex", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeRefIndex.#instance}
}
class AttributeRefVolume extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefVolume()
    constructor(){
        if(!AttributeRefVolume.#first_create){
            throw new TypeError("AttributeRefVolume is not constructable, use AttributeRefVolume.instance instead.")
        }
        AttributeRefVolume.#first_create = false
        super(AttrReq.optional.value, "refVolume", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeRefVolume.#instance}
}
class AttributeRefIssue extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefIssue()
    constructor(){
        if(!AttributeRefIssue.#first_create){
            throw new TypeError("AttributeRefIssue is not constructable, use AttributeRefIssue.instance instead.")
        }
        AttributeRefIssue.#first_create = false
        super(AttrReq.conditionChild.value, "refIssue", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeRefIssue.#instance}
}
class AttributeRefStartPage extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefStartPage()
    constructor(){
        if(!AttributeRefStartPage.#first_create){
            throw new TypeError("AttributeRefStartPage is not constructable, use AttributeRefStartPage.instance instead.")
        }
        AttributeRefStartPage.#first_create = false
        super(AttrReq.optional.value, "refStartPage", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeRefStartPage.#instance}
}
class AttributeRefEndPage extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefEndPage()
    constructor(){
        if(!AttributeRefEndPage.#first_create){
            throw new TypeError("AttributeRefEndPage is not constructable, use AttributeRefEndPage.instance instead.")
        }
        AttributeRefEndPage.#first_create = false
        super(AttrReq.required.value, "refEndPage", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeRefEndPage.#instance}
}
class AttributeRefDoi extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefDoi()
    constructor(){
        if(!AttributeRefDoi.#first_create){
            throw new TypeError("AttributeRefDoi is not constructable, use AttributeRefDoi.instance instead.")
        }
        AttributeRefDoi.#first_create = false
        super(AttrReq.optional.value, "refDoi", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeRefDoi.#instance}
}
class AttributeRefAbstract extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeRefAbstract()
    constructor(){
        if(!AttributeRefAbstract.#first_create){
            throw new TypeError("AttributeRefAbstract is not constructable, use AttributeRefAbstract.instance instead.")
        }
        AttributeRefAbstract.#first_create = false
        super(AttrReq.required.value, "refAbs", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeRefAbstract.#instance}
}

class Article extends kg_interface.Concept{
    static #first_create = true
    static #instance = new Article()
    constructor(){
        if(!Article.#first_create){
            throw new TypeError("Article is not constructable, use Article.instance instead.")
        }
        Article.#first_create = false
        super([AttributeArtTitle.instance.id, AttributeArtPrimaryRefEntry.instance.id, AttributeArtPath.instance.id], "article")
    }
    static get instance(){return Article.#instance}
}
class Reference extends kg_interface.Concept{
    static #first_create = true
    static #instance = new Reference()
    constructor(){
        if(!Reference.#first_create){
            throw new TypeError("Reference is not constructable, use Reference.instance instead.")
        }
        Reference.#first_create = false
        super(
            [
                AttributeRefNo.instance.id, AttributeRefIndex.instance.id, AttributeRefTitle.instance.id,
                AttributeRefPublication.instance.id, AttributeRefYear.instance.id, AttributeRefVolume.instance.id, AttributeRefIssue.instance.id,
                AttributeRefStartPage.instance.id, AttributeRefEndPage.instance.id, AttributeRefDoi.instance.id,
                AttributeRefAbstract.instance.id
            ],
            "reference"
        )
    }
    static get instance(){return Reference.#instance}
}

// atricle -> ref
// atricle -> EvoEntity
// ref -> author
// atricle -> contribution
class ArticleRefEntry extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new ArticleRefEntry()
    constructor(){
        if(!ArticleRefEntry.#first_create){
            throw new TypeError("ArticleRefEntry is not constructable, use ArticleRefEntry.instance instead.")
        }
        ArticleRefEntry.#first_create = false
        super("articleRefEntry", Article.instance.id, Reference.instance.id)
    }
    static get instance(){return ArticleRefEntry.#instance}
}
class ArticleTag extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new ArticleTag()
    constructor(){
        if(!ArticleTag.#first_create){
            throw new TypeError("ArticleTag is not constructable, use ArticleTag.instance instead.")
        }
        ArticleTag.#first_create = false
        super("articleTag", Article.instance.id, kg_evolution.evoConcepts.EvoEntity.instance.id)
    }
    static get instance(){return ArticleTag.#instance}
}
class RefAuthor extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new RefAuthor()
    constructor(){
        if(!RefAuthor.#first_create){
            throw new TypeError("RefAuthor is not constructable, use RefAuthor.instance instead.")
        }
        RefAuthor.#first_create = false
        super("refAuthor", Reference.instance.id, kg_signature.Author.instance.id)
    }
    static get instance(){return RefAuthor.#instance}
}
class ArticleContrib extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new ArticleContrib()
    constructor(){
        if(!ArticleContrib.#first_create){
            throw new TypeError("ArticleContrib is not constructable, use ArticleContrib.instance instead.")
        }
        ArticleContrib.#first_create = false
        super("articleContrib", Article.instance.id, kg_evolution.evoConcepts.EvoContrib.instance.id)
    }
    static get instance(){return ArticleContrib.#instance}
}

module.exports = {
    AttributeArtTitle, AttributeArtPrimaryRefEntry, AttributeArtPath,
    AttributeRefNo, AttributeRefIndex, AttributeRefTitle,
    AttributeRefPublication, AttributeRefYear, AttributeRefVolume, AttributeRefIssue,
    AttributeRefStartPage, AttributeRefEndPage, AttributeRefDoi,
    AttributeRefAbstract,
    Article, Reference,
    ArticleRefEntry, ArticleContrib, ArticleTag, RefAuthor
}