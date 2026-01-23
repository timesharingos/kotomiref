const collectTypes = require("./init.cjs").collectTypes
const refType = require("./reftype.cjs")
const kg_interface = require("./interface.cjs")
const predefine = require("./predefine.cjs")

test('collectCommon', () => {
    const { types, typeRels } = collectTypes(refType.articleType)
    expect(types.length).toBe(20)
    expect(typeRels.length).toBe(0)
    const { types: types2, typeRels: typeRels2 } = collectTypes(kg_interface)
    expect(types2.length).toBe(4)
    expect(typeRels2.length).toBe(0)
})

test('collectEvolution', () => {
    const { types, typeRels } = collectTypes(refType.evolutionType) 
    expect(types.length).toBe(29)
    expect(typeRels.length).toBe(6)
    expect(typeRels.every((rel) => rel instanceof predefine.constraints.SubConceptOf)).toBeTruthy()
})