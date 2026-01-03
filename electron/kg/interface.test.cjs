const kg_interface = require("./interface.cjs")
test('adjType', () => {
    class Par extends kg_interface.InstanceRel{constructor(){super("par", "parf", "part")}}
    class Sub1 extends Par{}
    class Sub2 extends Par{}
    class DeepSub extends Sub1{}
    let instdir = new kg_interface.InstanceRel("dir", "dirf", "dirt")
    let instpar = new Par()
    let instpar2 = new Par()
    let instsub1 = new Sub1()
    let instsub2 = new Sub2()
    let instdeep = new DeepSub()
    expect(kg_interface.InstanceRel.getTypeRel(kg_interface.InstanceRel)).toBe(kg_interface.TypeRel)
    expect(Par.getTypeRel(Par).prototype instanceof kg_interface.TypeRel).toBeTruthy()
    expect(instdir.getTypeRelInstance(kg_interface.InstanceRel) instanceof kg_interface.TypeRel).toBeTruthy()
})