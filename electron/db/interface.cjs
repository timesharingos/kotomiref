class DbOps{
    init(){}
    close(){}
    begin(){throw new TypeError("not implemented")}
    commit(){throw new TypeError("not implemented")}
    rollback(){throw new TypeError("not implemented")}
    prepare(stmt, args){throw new TypeError("not implemented")}
    backup(){throw new TypeError("not implemented")}

    constructor(db){
        this.db = db
        this.init()
    }
    exec(stmt, args){
        this.prepare(stmt, args)
    }
    transaction(stmt, args){
        this.begin()
        let result = this.exec(stmt, args)
        if(result == null && typeof(result) != 'undefined'){
            this.rollback()
            return null
        } else {
            this.commit()
            return result
        }
    }
}

//TODO
class TypeOps{
    mergeType(type){throw new TypeError("not implemented")}
    deleteType(type){throw new TypeError("not implemented")}
    queryTypeByName(typeclass, typename){throw new TypeError("not implemented")}
    queryTypeById(id){throw new TypeError("not implemented")}
    constructor(db){
        this.db = db
    }
}
//TODO
class NodeOps{
    mergeNode(node){throw new TypeError("not implemented")}
    deleteNode(node){throw new TypeError("not implemented")}
    queryNodeByName(nodetype, nodename){throw new TypeError("not implemented")}
    queryNodeById(id){throw new TypeError("not implemented")}
    constructor(db){
        this.db = db
    }
}
//TODO
class RelOps{
    mergeRel(rel){throw new TypeError("not implemented")}
    deleteRel(rel){throw new TypeError("not implemented")}
    queryRelByName(reltype, relname){throw new TypeError("not implemented")}
    queryRelById(id){throw new TypeError("not implemented")}
    constructor(db){
        this.db = db
    }
}
//TODO
class AttrOps{
    mergeAttr(attr){throw new TypeError("not implemented")}
    deleteAttr(attr){throw new TypeError("not implemented")}
    queryAttrByName(attrtype, attrname){throw new TypeError("not implemented")}
    queryAttrById(id){throw new TypeError("not implemented")}
    constructor(db){
        this.db = db
    }
}

class AbastractDb{
    //class def
    constructor(db, dbops, typeops, nodeops, relops, attrops){
        this.dbops = new dbops(db)
        this.typeops = new typeops(db)
        this.nodeops = new nodeops(db)
        this.relops = new relops(db)
        this.attrops = new attrops(db)
    }

    [Symbol.dispose](){
        this.dbops.close()
    }
}