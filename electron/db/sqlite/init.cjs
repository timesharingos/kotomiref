const { Dbops } = require("./dbops.cjs")
const { AbastractDb } = require("../interface.cjs")
const path = require("path")
const fs = require("fs")

function init_db(){
    const { app } = require("electron")
    const db_path = path.join(app.getPath("userData"), "kotomiref.db")
    let db
    if(!fs.existsSync(db_path)){
        db = require("better-sqlite3")(db_path)
        db.pragma("journal_mode=WAL")
    } else {
        db = require("better-sqlite3")(db_path)
    }
    return db
}

// class SqliteDb extends db_interface.AbastractDb{
    //TODO
class SqliteDb{
}

module.exports = {
    SqliteDb
}