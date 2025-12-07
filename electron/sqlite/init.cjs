const path = require("path")
const db_path = path.join(__dirname, "../../kotomiref.db")
const fs = require("fs")

function init_db(){
    let db
    if(!fs.existsSync(db_path)){
        db = require("better-sqlite3")(db_path)
        db.pragma("journal_mode=WAL")
    } else {
        db = require("better-sqlite3")(db_path)
    }
    return db
}

module.exports = init_db