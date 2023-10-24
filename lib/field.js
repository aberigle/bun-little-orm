const TYPE_MAP = {
  "number"  : "REAL",
  "string"  : "TEXT",
  "boolean" : "INTEGER",
  "date"    : "INTEGER"
}

const SPECIAL_TYPES = [Date]

export default class Field {

  /**
   * Returns a list of fields based on the tables current status
   *
   * @param {Array} list of fields in the table
   */
  static load(list=[]) {
    return list.map(item => {
      let field = parseField(item)
      return new Field(field.name, field.type, item)
    })
  }

  /**
   * Deduces the type for a given value.
   * Returns a {Field} instance
   *
   * @param {String} name
   * @param {Object} value
   */
  static deduce(name="", value) {
    if (value === null) return null

    let type = typeof value

    if (!TYPE_MAP[type]) type = findSpecialType(value)

    return new Field(name, type)
  }

  constructor(name, type, definition) {
    this.name = name
    this.type = type
    this.def  = definition
  }


  /**
   * Reads a value from the db a returns is as javascript
   *
   * @param {Object} value - Any value
   */
  parse(value) {
    switch(this.type) {
      case 'date'    : return new Date(value)
      case 'boolean' : return value === 1
      default        : return value
    }
  }

  /**
   * Cast a javascript value to a sqlite ready one based on the type
   *
   * @param {Objeect} value - Any value
   */
  cast(value) {
    switch(this.type) {
      case 'date'   : return value.getTime()
      case 'string' : return `'${value}'`
      case 'boolean': return Number(value)
      default : return value
    }

  }

  /**
   * Returns the field name in the db
   *
   * @returns {String} The field name
   */
  dbName() {
    switch(this.type) {
      case 'date'    : return this.name + "::date"
      case 'boolean' : return this.name + "::boolean"
      default        : return this.name
    }
  }

  /**
   * Returns the field definition for create/alter a table
   *
   * @returns {String} the field definition
   */
  definition() {
    return `'${this.dbName()}' ${TYPE_MAP[this.type]}`
  }

}

// private

let parseField = field => {
  let [name, type] = field.name.split("::")

  // an integer and primary key
  if (field.pk && field.type === "INTEGER") type = "number"

  if (!type) type = Object.keys(TYPE_MAP).find(type => TYPE_MAP[type] == field.type)

  return { name, type }
}

let findSpecialType = value => {
  let type = SPECIAL_TYPES.find(type => value instanceof type)
  if (!type) throw new Error(`Unsupported type for ${value}!`)
  return type.name.toLowerCase()
}