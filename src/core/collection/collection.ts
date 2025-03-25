import { isEmpty } from "@/utils/objects"

import { Field } from "../field"
import { deduceFields } from "../field/deduce-field"
import { parseFieldListFromDb } from "../field/parse-field"
import { getFieldDefinition, getFieldName } from "../field/serialize"

const ID_FIELD = "id"

export default class Collection {
  db     : any
  table  : string
  fields : Record<string, Field>

  constructor(
    db: any,
    name: string
  ) {
    this.db     = db
    this.table  = name
    this.fields = {}
  }

  toJSON_OBJECT(
    alias: string = this.table
  ) {
    let fields: string[] = [`'id', One.id`]

    for (let [
      name,
      field
    ] of Object.entries(this.fields)) {
      const fieldName = getFieldName(name, field)
      fields.push(`'${fieldName}',${alias}.'${fieldName}'`)
    }

    return `JSON_OBJECT(${fields.join(",")})`
  }

  async run(
    query: string
  ) {
    if (this.db.query) return this.db.query(query).run()

    let result = await this.db.execute(query)
    return result.rows
  }

  async execute(
    query: string,
    params: Array<any> = []
  ) {
    try {
      if (this.db.query) return this.db.query(query).all(params)

      let result = await this.db.execute({
        sql: query, args: params
      })
      return result.rows
    } catch (error) {
      console.log(query, params, error)
      return []
    }
  }

  transform(item) {
    return Object.entries(this.fields)
    .reduce((result, [name, field]) => {
      result[name] = field.parse(result[getFieldName(name, field)])
      return result
    }, item)
  }

  async insert(
    model: any
  ) {
    const clone  = Object.assign({}, model)
    const fields = await this.ensure(deduceFields(clone))

    const values: Array<any> = []
    const names: string[] = []
    for (let [
      name,
      field
    ] of Object.entries(fields)) if (clone[name]) {
      values.push(field.cast(clone[name]))
      names.push("'" + getFieldName(name, field) + "'")
    }

    let query = `INSERT INTO ${this.table} `
    query +=  `(${names.join(",")})`
    query += `VALUES (${values.map(_ => '?').join(",")}) `
    query += `RETURNING *`

    let result = await this.execute(query, values)
    return this.transform(result[0])
  }

  async findById(query : any) {
    if (typeof query === 'object') query = query[ID_FIELD]

    if (isNaN(query)) return

    let result = await this.find({ [ID_FIELD]: query })
    return result[0]
  }

  async find(search={}) {
    let fields = await this.ensure({})
    if (isEmpty(fields)) return []

    let query = `SELECT * FROM ${this.table}`
    let keys = Object.keys(search)

    let values: Array<string> = []

    if (keys.length) {
      let clone   = Object.assign({}, search)
      const fields = deduceFields(clone)
      let filters = Object.entries(fields)
      .map(([name, field]) => {
        let action = "="
        let value: any = clone[name]

        values.push(field.cast(value))

        if (value.includes && value.includes("%")) action = "LIKE"

        return `"${getFieldName(name, field)}" ${action} ?`
      })

      query += ` WHERE ${filters.join(" AND ")}`
    }

    let result = await this.execute(query, values)
    return result.map(item => this.transform(item))
  }

  async update(
    id : any,
    model={}
  ) {
    let clone = Object.assign({}, model)
    let fields = deduceFields(clone)

    await this.ensure(fields)

    const values: Array<any> = []
    const names: string[] = []
    for (let [name, field] of Object.entries(fields)) {
      values.push(field.cast(clone[name]))
      names.push("'" + getFieldName(name, field) + "'")
    }

    let query = `UPDATE ${this.table} SET `
    query +=  names.map(field => `${field} = ?`).join(",")
    query += ` WHERE ${ID_FIELD} = ${id} `
    query += `RETURNING *`

    const result = await this.execute(query, values)

    return this.transform(result[0])
  }

  async ensure(
    fields: Record<string, Field> = {}
  ): Promise<Record<string, Field>> {
    if (isEmpty(this.fields))
      this.fields = parseFieldListFromDb(await this.execute(`PRAGMA table_info(${this.table})`))

    // check if we are missing any required field
    let missing = Object.keys(fields)
    .filter(value => !(value in this.fields))
    .reduce((result, key) => {
      result[key] = fields[key]
      return result
    }, {})

    if (isEmpty(missing)) return this.fields

    let result
    // the table doesn't exist yet
    if (isEmpty(this.fields)) result = await this.create(fields)
    // the table exists but is missing some field
    else result = await this.alter(missing)

    // refresh the existing fields
    this.fields = {}

    return this.ensure(fields)
  }

  // creates a table with the defined fields
  create(
    fields: Record<string, Field>
  ) {
    let query = `CREATE TABLE ${this.table} (${ID_FIELD} INTEGER PRIMARY KEY AUTOINCREMENT, `
    query += Object.entries(fields)
    .map(([name, field]) => getFieldDefinition(name, field)).join(",")
    query +=    ")"

    return this.run(query)
  }

  // alters a table to add some fields
  async alter(
    fields: Record<string, Field>
  ) {
    for (let key of Object.keys(fields)) {
      let query = `ALTER TABLE ${this.table} ADD COLUMN ${getFieldDefinition(key, fields[key])}`
      await this.run(query)
    }

    return true
  }
}