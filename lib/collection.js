const TYPE_MAP = {
  "number" : "REAL",
  "string" : "TEXT",
  "date"   : "INTEGER"
}

const SPECIAL_TYPES = [Date]

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
    let values = this._deduceTypes(clone)

    this._ensureFields(values)

    let query = `INSERT INTO ${this.table} `
    query += `(${values.map(v => `'${v.name}'`).join(",")}) `
    query += `VALUES (${values.map(value => value.value).join(",")})`

    return this.db.query(query).run()
  }

  findById(id) {
    let result = this.find({ _id: id })
    return result[0]
  }

  find(search={}) {
    let fields = this._ensureFields([])
    if (!fields.length) return []

    let query = `SELECT * FROM ${this.table}`
    let keys = Object.keys(search)
    if (keys.length) {
      let clone  = Object.assign({}, search)
      let filters = this._deduceTypes(clone)

      query += ` WHERE ${filters.map(filter => {
        let action = "="

        if (filter.value.includes && filter.value.includes("%")) action = "LIKE"

        return `"${filter.name}" ${action} ${filter.value}`
      }).join(" AND ")}`
    }
    console.log(query)
    let result = this.db.query(query).all()
    return this._read(result)
  }


  _read(items) {
    let casteable = this.fields.filter(field => field.name.includes("::"))
    return items.map(item => {
      casteable.forEach(field => this._readValue(field, item))
      return item
    })
  }

  _readValue(field, item) {
    let value = item[field.name]
    delete item[field.name]

    if (!value) return item

    let type = field.name.split("::").find(type => TYPE_MAP[type])

    if (type === "date") value = new Date(value)

    item[field.name.replace(`::${type}`, "")] = value
    return item
  }

  _ensureFields(values=[]) {
    if (!this.fields) this.fields = this.db.query(`PRAGMA table_info(${this.table})`).all()

    // check if we are missing any required field
    let missing = values.filter(value => !this.fields.find(field => field.name === value.name))
    if (!missing.length) return this.fields

    debugger
    console.log(missing.length + " fields missing")

    let result
    // the table doesn't exists yet
    if (!this.fields.length) result = this._create(values)
    // the table exists but is missing some field
    else result = this._alter(values)

    // refresh the existing fields
    this.fields = null

    return this._ensureFields(values)
  }

  _run(statement) {
    return this.db.query(statement).run()
  }

  // creates a table with the defined fields
  _create(values) {
    let query = `CREATE TABLE ${this.table} (_id INTEGER PRIMARY KEY AUTOINCREMENT, `
    query += values.map(value => `'${value.name}' ${TYPE_MAP[value.type]}`).join(",")
    query += ")"

    return this._run(query)
  }

  // alters a table to add some fields
  _alter(values) {
    for (let value of values) {
      let query = `ALTER TABLE ${this.table} ADD COLUMN '${value.name}' ${TYPE_MAP[value.type]}`
      this._run(query)
    }

    return true //?
  }

  _deduceTypes(model) {
    return Object.keys(model)
    .map(name => {
      let value = model[name]

      if (!value) return null

      let type = typeof value

      if (!TYPE_MAP[type]) type = this._findSpecialtype(value)

      return {
        type,
        name : this._castName(name, type),
        value: this._castValue(value, type)
      }
    }).filter(type => type)
  }

  _castName(name, type) {
    if (!type) {
      let fields = this._ensureFields([])
      let field = fields.find(field => field.name.startsWith(name))
      if (field) return field.name
      return ""
    }
    name = name.replaceAll("::", "")
    switch(type) {
      case 'date' : return name + "::date"
    }
    return name
  }

  _castValue(value, type) {
    switch(type) {
      case 'date'   : return value.getTime()
      case 'string' : return `'${value}'`
    }
    return value
  }

  _findSpecialtype(value) {
    let type = SPECIAL_TYPES.find(type => value instanceof type)
    if (!type) throw new Error(`Unsupported type for ${value}!`)
    return type.name.toLowerCase()
  }

}