import Field from "./field"

const ID_FIELD = "id"

export default class Collection {
  db     : any
  table  : string
  fields : Array<Field> | null

  constructor(db: any, name: string) {
    this.db     = db
    this.table  = name
    this.fields = null
  }

  async run(query: string) {
    if (this.db.query) return this.db.query(query).run()

    let result = await this.db.execute(query)
    return result.rows
  }

  async execute(query: string, params: Array<any> = []) {
    if (this.db.query) return this.db.query(query).all(params)

    let result = await this.db.execute({
      sql: query, args: params
    })
    return result.rows
  }

  async insert(model: any) {
    let clone = Object.assign({}, model)
    let fields = deduceFields(clone)

    await this.ensure(fields)

    let values = fields.map(field => field.cast(clone[field.name]))
    let names  = fields.map(field => `'${field.dbName()}'`)

    let query = `INSERT INTO ${this.table} `
    query +=  `(${names.join(",")})`
    query += `VALUES (${values.map(_ => '?').join(",")}) `
    query += `RETURNING ${ID_FIELD}`

    let result = await this.execute(query, values)
    return result[0]
  }

  async findById(query : any) {
    if (typeof query === 'object') query = query[ID_FIELD]

    if (isNaN(query)) return

    let result = await this.find({ [ID_FIELD]: query })
    return result[0]
  }

  async find(search={}) {
    let fields = await this.ensure([])
    if (!fields.length) return []

    let query = `SELECT * FROM ${this.table}`
    let keys = Object.keys(search)

    let values: Array<string> = []

    if (keys.length) {
      let clone   = Object.assign({}, search)
      let filters = deduceFields(clone)
      .map(filter => {
        let action = "="
        let value: any = clone[filter.name]

        values.push(filter.cast(value))

        if (value.includes && value.includes("%")) action = "LIKE"

        return `"${filter.dbName()}" ${action} ?`
      })

      query += ` WHERE ${filters.join(" AND ")}`
    }

    let result = await this.execute(query, values)
    return result.map(item => fields.reduce((item, field) => field.transform(item), item))
  }

  async update(id : any, model={}) {
    let clone = Object.assign({}, model)
    let fields = deduceFields(clone)

    await this.ensure(fields)

    let names  = fields.map(field => `'${field.dbName()}'`)
    let values = fields.map(field => field.cast(clone[field.name]))

    let query = `UPDATE ${this.table} SET `
    query +=  names.map(field => `${field} = ?`).join(",")
    query += ` WHERE ${ID_FIELD} = ${id}`

    return this.execute(query, values)
  }

  async ensure(fields: Array<Field> = []): Promise<Array<Field>> {
    if (this.fields === null) this.fields = Field.load(await this.execute(`PRAGMA table_info(${this.table})`))

    // check if we are missing any required field
    let missing = fields.filter(value => !this.fields!.find(field => field.name === value.name))
    if (!missing.length) return this.fields

    let result
    // the table doesn't exist yet
    if (!this.fields.length) result = await this.create(fields)
    // the table exists but is missing some field
    else result = await this.alter(missing)

    // refresh the existing fields
    this.fields = null

    return this.ensure(fields)
  }

  // creates a table with the defined fields
  create(fields: Array<Field>) {
    let query = `CREATE TABLE ${this.table} (${ID_FIELD} INTEGER PRIMARY KEY AUTOINCREMENT, `
    query +=     fields.map(field => field.definition()).join(",")
    query +=    ")"

    return this.run(query)
  }

  // alters a table to add some fields
  async alter(fields: Array<Field>) {
    for (let field of fields) {
      let query = `ALTER TABLE ${this.table} ADD COLUMN ${field.definition()}`
      await this.run(query)
    }

    return true //?
  }
}

// private

let deduceFields = model => {
  return Object.keys(model)
  .map(name => Field.deduce(name, model[name]))
  .filter(field => field)
}