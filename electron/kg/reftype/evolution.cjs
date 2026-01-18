const kg_interface = require("../interface.cjs")
const { AttrReq, primitive, constraints } = require("../predefine.cjs")
const kg_subject = require("./subject.cjs")

// Entity -> object/algo/improvement/contribution/problem/definition
class AttributeEvoName extends kg_interface.Attribute{
    static #first_create = true
    static #instance = new AttributeEvoName()
    constructor(){
        if(!AttributeEvoName.#first_create){
            throw new TypeError("AttributeEvoName is not constructable, use AttributeEvoName.instance instead.")
        }
        AttributeEvoName.#first_create = false
        super(AttrReq.required.value, "evoName", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeEvoName.#instance}
}

class AttributeEvoDesc extends kg_interface.Attribute{
    static #first_create = true
    static #instance = new AttributeEvoDesc()
    constructor(){
        if(!AttributeEvoDesc.#first_create){
            throw new TypeError("AttributeEvoDesc is not constructable, use AttributeEvoDesc.instance instead.")
        }
        AttributeEvoDesc.#first_create = false
        super(AttrReq.optional.value, "evoDesc", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeEvoDesc.#instance}
}

class AttributeEvoMetric extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeEvoMetric()
    constructor(){
        if(!AttributeEvoMetric.#first_create){
            throw new TypeError("AttributeEvoMetric is not constructable, use AttributeEvoMetric.instance instead.")
        }
        AttributeEvoMetric.#first_create = false
        super(AttrReq.optional.value, "evoMetric", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeEvoMetric.#instance}
}

class AttributeEvoMetricResultString extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeEvoMetricResultString()
    constructor(){
        if(!AttributeEvoMetricResultString.#first_create){
            throw new TypeError("AttributeEvoMetricResultString is not constructable, use AttributeEvoMetricResultString.instance instead.")
        }
        AttributeEvoMetricResultString.#first_create = false
        super(AttrReq.conditionChild.value, "evoMetricResultString", primitive.StringType.instance.id)
    }
    static get instance(){return AttributeEvoMetricResultString.#instance}
}

class AttributeEvoMetricResultNumber extends kg_interface.Attribute {
    static #first_create = true
    static #instance = new AttributeEvoMetricResultNumber()
    constructor(){
        if(!AttributeEvoMetricResultNumber.#first_create){
            throw new TypeError("AttributeEvoMetricResultNumber is not constructable, use AttributeEvoMetricResultNumber.instance instead.")
        }
        AttributeEvoMetricResultNumber.#first_create = false
        super(AttrReq.conditionSib.value, "evoMetricResultNumber", primitive.NumberType.instance.id)
    }
    static get instance(){return AttributeEvoMetricResultNumber.#instance}
}

const evoAttributes = { AttributeEvoName, AttributeEvoDesc, AttributeEvoMetric, AttributeEvoMetricResultString, AttributeEvoMetricResultNumber }

class EvoEntity extends kg_interface.Concept{
    static #first_create = true
    static #instance = new EvoEntity()
    constructor(){
        if(!EvoEntity.#first_create){
            throw new TypeError("EvoEntity is not constructable, use EvoEntity.instance instead.")
        }
        EvoEntity.#first_create = false
        super([], "evoEntity")
    }
    static get instance(){return EvoEntity.#instance}
}

class EvoObject extends kg_interface.Concept{
    static #first_create = true
    static #instance = new EvoObject()
    constructor(){
        if(!EvoObject.#first_create){
            throw new TypeError("EvoObject is not constructable, use EvoObject.instance instead.")
        }
        EvoObject.#first_create = false
        super([AttributeEvoName.instance.id, AttributeEvoDesc.instance.id], "evoObject")
    }
    static get instance(){return EvoObject.#instance}
}

class EvoAlgo extends kg_interface.Concept{
    static #first_create = true
    static #instance = new EvoAlgo()
    constructor(){
        if(!EvoAlgo.#first_create){
            throw new TypeError("EvoAlgo is not constructable, use EvoAlgo.instance instead.")
        }
        EvoAlgo.#first_create = false
        super([AttributeEvoName.instance.id, AttributeEvoDesc.instance.id], "evoAlgo")
    }
    static get instance(){return EvoAlgo.#instance}
}

class EvoImprovement extends kg_interface.Concept{
    static #first_create = true
    static #instance = new EvoImprovement()
    constructor(){
        if(!EvoImprovement.#first_create){
            throw new TypeError("EvoImprovement is not constructable, use EvoImprovement.instance instead.")
        }
        EvoImprovement.#first_create = false
        super(
            [
                AttributeEvoName.instance.id, AttributeEvoDesc.instance.id,
                AttributeEvoMetric.instance.id, AttributeEvoMetricResultString.instance.id, AttributeEvoMetricResultNumber.instance.id
            ],
            "evoImprovement"
        )
    }
    static get instance(){return EvoImprovement.#instance}
}

class EvoContrib extends kg_interface.Concept {
    static #first_create = true
    static #instance = new EvoContrib()
    constructor(){
        if(!EvoContrib.#first_create){
            throw new TypeError("EvoContrib is not constructable, use EvoContrib.instance instead.")
        }
        EvoContrib.#first_create = false
        super([AttributeEvoDesc.instance.id], "evoContrib")
    }
    static get instance(){return EvoContrib.#instance}
}

class EvoProblem extends kg_interface.Concept{
    static #first_create = true
    static #instance = new EvoProblem()
    constructor(){
        if(!EvoProblem.#first_create){
            throw new TypeError("EvoProblem is not constructable, use EvoProblem.instance instead.")
        }
        EvoProblem.#first_create = false
        super([AttributeEvoName.instance.id, AttributeEvoDesc.instance.id], "evoProblem")
    }
    static get instance(){return EvoProblem.#instance}
}

class EvoDefinition extends kg_interface.Concept{
    static #first_create = true
    static #instance = new EvoDefinition()
    constructor(){
        if(!EvoDefinition.#first_create){
            throw new TypeError("EvoDefinition is not constructable, use EvoDefinition.instance instead.")
        }
        EvoDefinition.#first_create = false
        super([AttributeEvoName.instance.id, AttributeEvoDesc.instance.id], "evoDefinition")
    }
    static get instance(){return EvoDefinition.#instance}
}

const evoConcepts = { EvoEntity, EvoObject, EvoAlgo, EvoImprovement, EvoContrib, EvoProblem, EvoDefinition }

const evoConstraints = {
    subObject: new constraints.SubConceptOf(EvoObject.instance.id, EvoEntity.instance.id),
    subAlgo: new constraints.SubConceptOf(EvoAlgo.instance.id, EvoEntity.instance.id),
    subImprovement: new constraints.SubConceptOf(EvoImprovement.instance.id, EvoEntity.instance.id),
    subContrib: new constraints.SubConceptOf(EvoContrib.instance.id, EvoEntity.instance.id),
    subProblem: new constraints.SubConceptOf(EvoProblem.instance.id, EvoEntity.instance.id),
    subDefinition: new constraints.SubConceptOf(EvoDefinition.instance.id, EvoEntity.instance.id),
}

// InstanceRel
// Entity
// subject/alias/parent/relation
class EntitySubject extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new EntitySubject()
    constructor(){
        if(!EntitySubject.#first_create){
            throw new TypeError("EntitySubject is not constructable, use EntitySubject.instance instead.")
        }
        EntitySubject.#first_create = false
        // SubConceptOf allows transitive relation
        super("entitySubject", EvoEntity.instance.id, kg_subject.SubSubject.instance.id)
    }
    static get instance(){return EntitySubject.#instance}
}
class EntityAlias extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new EntityAlias()
    constructor(){
        if(!EntityAlias.#first_create){
            throw new TypeError("EntityAlias is not constructable, use EntityAlias.instance instead.")
        }
        EntityAlias.#first_create = false
        super("entityAlias", EvoEntity.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return EntityAlias.#instance}
}

class EntityParent extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new EntityParent()
    constructor(){
        if(!EntityParent.#first_create){
            throw new TypeError("EntityParent is not constructable, use EntityParent.instance instead.")
        }
        EntityParent.#first_create = false
        super("entityParent", EvoEntity.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return EntityParent.#instance}
}

class EntityRelation extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new EntityRelation()
    constructor(){
        if(!EntityRelation.#first_create){
            throw new TypeError("EntityRelation is not constructable, use EntityRelation.instance instead.")
        }
        EntityRelation.#first_create = false
        super("entityRelation", EvoEntity.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return EntityRelation.#instance}
}

const evoEntityInstanceRel = { EntitySubject, EntityAlias, EntityParent, EntityRelation }

// Object
// No special InstanceRel currently
const evoObjectInstanceRel = {}

// Algo
// target/expectation/transformation
class AlgoTarget extends kg_interface.InstanceRel{
    static #first_create = true
    static #instance = new AlgoTarget()
    constructor(){
        if(!AlgoTarget.#first_create){
            throw new TypeError("AlgoTarget is not constructable, use AlgoTarget.instance instead.")
        }
        AlgoTarget.#first_create = false
        super("algoTarget", EvoAlgo.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return AlgoTarget.#instance}
}

class AlgoExpectation extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new AlgoExpectation()
    constructor(){
        if(!AlgoExpectation.#first_create){
            throw new TypeError("AlgoExpectation is not constructable, use AlgoExpectation.instance instead.")
        }
        AlgoExpectation.#first_create = false
        super("algoExpectation", EvoAlgo.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return AlgoExpectation.#instance}
}

class AlgoTransformation extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new AlgoTransformation()
    constructor(){
        if(!AlgoTransformation.#first_create){
            throw new TypeError("AlgoTransformation is not constructable, use AlgoTransformation.instance instead.")
        }
        AlgoTransformation.#first_create = false
        super("algoTransformation", EvoAlgo.instance.id, EvoEntity.instance.id)        
    }
    static get instance(){return AlgoTransformation.#instance}
}

const evoAlgoInstaceRel = { AlgoTarget, AlgoExpectation, AlgoTransformation }

// Improvement
// origin/advance
class ImprovementOrigin extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ImprovementOrigin()
    constructor(){
        if(!ImprovementOrigin.#first_create){
            throw new TypeError("ImprovementOrigin is not constructable, use ImprovementOrigin.instance instead.")
        }
        ImprovementOrigin.#first_create = false
        super("improvementOrigin", EvoImprovement.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return ImprovementOrigin.#instance}
}
class ImprovementAdvance extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ImprovementAdvance()
    constructor(){
        if(!ImprovementAdvance.#first_create){
            throw new TypeError("ImprovementAdvance is not constructable, use ImprovementAdvance.instance instead.")
        }
        ImprovementAdvance.#first_create = false
        super("improvementAdvance", EvoImprovement.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return ImprovementAdvance.#instance}
}

const evoImprovementInstanceRel = { ImprovementOrigin, ImprovementAdvance }

// Contrib
// improvement/algo/object/solutionTo
class ContribImprovement extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ContribImprovement()
    constructor(){
        if(!ContribImprovement.#first_create){
            throw new TypeError("ContribImprovement is not constructable, use ContribImprovement.instance instead.")
        }
        ContribImprovement.#first_create = false
        super("contribImprovement", EvoContrib.instance.id, EvoImprovement.instance.id)
    }
    static get instance(){return ContribImprovement.#instance}
}

class ContribAlgo extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ContribAlgo()
    constructor(){
        if(!ContribAlgo.#first_create){
            throw new TypeError("ContribAlgo is not constructable, use ContribAlgo.instance instead.")
        }
        ContribAlgo.#first_create = false
        super("contribAlgo", EvoContrib.instance.id, EvoAlgo.instance.id)
    }
    static get instance(){return ContribAlgo.#instance}
}

class ContribObject extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ContribObject()
    constructor(){
        if(!ContribObject.#first_create){
            throw new TypeError("ContribObject is not constructable, use ContribObject.instance instead.")
        }
        ContribObject.#first_create = false
        super("contribObject", EvoContrib.instance.id, EvoObject.instance.id)
    }
    static get instance(){return ContribObject.#instance}
}

class ContribSolutionTo extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ContribSolutionTo()
    constructor(){
        if(!ContribSolutionTo.#first_create){
            throw new TypeError("ContribSolutionTo is not constructable, use ContribSolutionTo.instance instead.")
        }
        ContribSolutionTo.#first_create = false
        super("contribSolutionTo", EvoContrib.instance.id, EvoDefinition.instance.id)
    }
    static get instance(){return ContribSolutionTo.#instance}
}

const evoContribInstanceRel = { ContribImprovement, ContribAlgo, ContribObject, ContribSolutionTo }

// problem
// domain
class ProblemDomain extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new ProblemDomain()
    constructor(){
        if(!ProblemDomain.#first_create){
            throw new TypeError("ProblemDomain is not constructable, use ProblemDomain.instance instead.")
        }
        ProblemDomain.#first_create = false
        super("problemDomain", EvoProblem.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return ProblemDomain.#instance}
}

const evoProblemInstanceRel = { ProblemDomain }

// definition
// refine/scenario
class DefinitionRefine extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new DefinitionRefine()
    constructor(){
        if(!DefinitionRefine.#first_create){
            throw new TypeError("DefinitionRefine is not constructable, use DefinitionRefine.instance instead.")
        }
        DefinitionRefine.#first_create = false
        super("definitionRefine", EvoDefinition.instance.id, EvoProblem.instance.id)
    }
    static get instance(){return DefinitionRefine.#instance}
}

class DefinitionScenario extends kg_interface.InstanceRel {
    static #first_create = true
    static #instance = new DefinitionScenario()
    constructor(){
        if(!DefinitionScenario.#first_create){
            throw new TypeError("DefinitionScenario is not constructable, use DefinitionScenario.instance instead.")
        }
        DefinitionScenario.#first_create = false
        super("definitionScenario", EvoDefinition.instance.id, EvoEntity.instance.id)
    }
    static get instance(){return DefinitionScenario.#instance}
}

const evoDefinitionInstanceRel = { DefinitionRefine, DefinitionScenario }

const evoInstanceRel = { evoEntityInstanceRel, evoObjectInstanceRel, evoAlgoInstaceRel, evoImprovementInstanceRel, evoContribInstanceRel, evoProblemInstanceRel, evoDefinitionInstanceRel }

module.exports = {
    evoAttributes, evoConcepts, evoConstraints, evoInstanceRel
}