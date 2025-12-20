const db = null

module.exports = {
    invokeDb: (func) => {return func(db)},
}