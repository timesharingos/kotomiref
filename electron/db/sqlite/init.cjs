const { SqliteDbOps } = require("./dbops.cjs")
const { SqliteTypeOps, SqliteNodeOps, SqliteRelOps, SqliteAttrOps } = require("./actualops.cjs")
const { AbastractDb } = require("../interface.cjs")
const path = require("path")
const fs = require("fs")

function createTables(db){
    // Type table: stores all Type definitions (Concept, Attribute, TypeRel, InstanceRel, etc.)
    // Fields from Type.toDb(): id, typeclass, typename, supertype, args
    db.prepare(`
        CREATE TABLE IF NOT EXISTS type (
            id TEXT PRIMARY KEY NOT NULL,
            typeclass TEXT NOT NULL,
            typename TEXT NOT NULL,
            supertype TEXT,
            args TEXT,
            UNIQUE(typeclass, typename)
        )
    `).run()

    // Create index for faster queries
    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_type_typeclass ON type(typeclass)
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_type_supertype ON type(supertype)
    `).run()

    // AttributeInstance table: stores attribute instances with their values
    // Fields from AttributeInstance.toDb(): type (typeid), id (attrid), raw (value)
    // Note: raw stores the encoded string value, decode is needed when reading
    db.prepare(`
        CREATE TABLE IF NOT EXISTS attribute (
            id TEXT PRIMARY KEY NOT NULL,
            type TEXT NOT NULL,
            raw TEXT NOT NULL,
            FOREIGN KEY(type) REFERENCES type(id) ON DELETE CASCADE
        )
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_attribute_type ON attribute(type)
    `).run()

    // Node table: stores all nodes (instances of Concepts)
    // Fields from Node.toDb(): type (typeid), id (nodeid), name, attr (attributes array)
    // attr is stored as JSON array of attribute ids
    db.prepare(`
        CREATE TABLE IF NOT EXISTS node (
            id TEXT PRIMARY KEY NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            attr TEXT NOT NULL,
            FOREIGN KEY(type) REFERENCES type(id) ON DELETE CASCADE,
            UNIQUE(type, name)
        )
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_node_type ON node(type)
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_node_name ON node(name)
    `).run()

    // Rel table: stores all relationships (both TypeRel and InstanceRel instances)
    // Fields from Rel.toDb(): type (typeid), id (relid), name, attr (attributes), from (fromid), to (toid)
    // attr is stored as JSON array of attribute ids
    db.prepare(`
        CREATE TABLE IF NOT EXISTS rel (
            id TEXT PRIMARY KEY NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            attr TEXT NOT NULL,
            fromid TEXT NOT NULL,
            toid TEXT NOT NULL,
            FOREIGN KEY(type) REFERENCES type(id) ON DELETE CASCADE,
            FOREIGN KEY(fromid) REFERENCES node(id) ON DELETE CASCADE,
            FOREIGN KEY(toid) REFERENCES node(id) ON DELETE CASCADE
        )
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_rel_type ON rel(type)
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_rel_from ON rel("from")
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_rel_to ON rel("to")
    `).run()

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_rel_from_to ON rel("from", "to")
    `).run()
}

function init_db(){
    const { app } = require("electron")
    const db_path = path.join(app.getPath("userData"), "kotomiref.db")
    const is_new = !fs.existsSync(db_path)

    const db = require("better-sqlite3")(db_path)

    if(is_new){
        db.prepare('set foreign_keys = ON').run()
        db.prepare('set journal_mode = WAL').run()
        createTables(db)
    }

    return db
}

class SqliteDb extends AbastractDb{
    constructor(){
        super(init_db(), SqliteDbOps, SqliteTypeOps, SqliteNodeOps, SqliteRelOps, SqliteAttrOps)
    }
}

module.exports = {
    SqliteDb
}