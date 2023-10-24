import Field from "./field"

const ID_FIELD = "id"

export default class Collection {

  constructor(db, name) {
    this.db     = db
    this.table  = name
  }

  async get(db, name) {
    return new this(db, name)
  }

  insert(model) {
    let clone = Object.assign({}, model)
    let fields = dedudeFields(clone)

    this.ensure(fields)

    let query = `INSERT INTO ${this.table} `
    query += `(${fields.map(field => `'${field.dbName()}'`).join(",")}) `
    query += `VALUES (${fields.map(field => field.cast(clone[field.name])).join(",")}) `
    query += `RETURNING ${ID_FIELD}`

    return this.db.query(query).get()
  }

  findById(query) {
    if (typeof query === 'object') query = query[ID_FIELD]

    if (isNaN(query)) return

    let result = this.find({ [ID_FIELD]: query })
    return result[0]
  }

  find(search={}) {
    let fields = this.ensure([])
    if (!fields.length) return []

    let query = `SELECT * FROM ${this.table}`
    let keys = Object.keys(search)
    if (keys.length) {
      let clone  = Object.assign({}, search)
      let filters = dedudeFields(clone)

      query += ` WHERE ${filters.map(filter => {
        let action = "="
        let value = clone[filter.name]

        if (value.includes && value.includes("%")) action = "LIKE"

        return `"${filter.dbName()}" ${action} ${filter.cast(value)}`
      }).join(" AND ")}`
    }

    let result = this.db.query(query).all()
    return result.map(item => fields.reduce((item, field) => field.transform(item), item))
  }

  update(id, model={}) {
    let clone = Object.assign({}, model)
    let fields = dedudeFields(clone)

    this.ensure(fields)

    let query = `UPDATE ${this.table} SET `
    query +=  fields.map(field => `'${field.dbName()}' = ${field.cast(clone[field.name])}`).join(",")
    query += ` WHERE ${ID_FIELD} = ${id}`

    return this.db.query(query).get()
  }

  ensure(fields=[]) {
    if (!this.fields) this.fields = Field.load(this.db.query(`PRAGMA table_info(${this.table})`).all())

    // check if we are missing any required field
    let missing = fields.filter(value => !this.fields.find(field => field.name === value.name))
    if (!missing.length) return this.fields

    let result
    // the table doesn't exist yet
    if (!this.fields.length) result = this.create(fields)

    // the table exists but is missing some field
    else result = this.alter(fields)

    // refresh the existing fields
    this.fields = null

    return this.ensure(fields)
  }

  run(statement) {
    return this.db.query(statement).run()
  }

  // creates a table with the defined fields
  create(fields) {
    let query = `CREATE TABLE ${this.table} (${ID_FIELD} INTEGER PRIMARY KEY AUTOINCREMENT, `
    query += fields.map(field => field.definition()).join(",")
    query += ")"

    return this.run(query)
  }

  // alters a table to add some fields
  alter(fields) {
    for (let field of fields) {
      let query = `ALTER TABLE ${this.table} ADD COLUMN ${field.definition()}`
      this.run(query)
    }

    return true //?
  }
}

// private

let dedudeFields = model => {
  return Object.keys(model)
  .map(name => Field.deduce(name, model[name]))
  .filter(field => field)
}