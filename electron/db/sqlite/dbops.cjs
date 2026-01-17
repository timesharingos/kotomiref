const { DbOps } = require("../interface.cjs")

class SqliteDbOps extends DbOps{
    #inTransaction = false

    constructor(db){
        super(db)
    }

    close(){
        if(this.db && this.db.open){
            this.db.close()
        }
    }

    begin(){
        if(this.#inTransaction){
            throw new Error("Transaction already in progress")
        }
        this.db.prepare('BEGIN').run()
        this.#inTransaction = true
    }

    commit(){
        if(!this.#inTransaction){
            throw new Error("No transaction in progress")
        }
        this.db.prepare('COMMIT').run()
        this.#inTransaction = false
    }

    rollback(){
        if(!this.#inTransaction){
            throw new Error("No transaction in progress")
        }
        this.db.prepare('ROLLBACK').run()
        this.#inTransaction = false
    }

    prepare(stmt, args){
        try {
            const prepared = this.db.prepare(stmt)
            if(args && args.length > 0){
                return prepared.run(...args)
            } else {
                return prepared.run()
            }
        } catch(e){
            throw new Error(`Failed to execute statement: ${stmt}\nError: ${e.message}`)
        }
    }

    backup(filepath){
        if(!filepath){
            throw new Error("Backup filepath is required")
        }
        try {
            this.db.backup(filepath)
        } catch(e){
            throw new Error(`Failed to backup database to ${filepath}: ${e.message}`)
        }
    }
}

module.exports = {
    SqliteDbOps
}