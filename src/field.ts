enum TypeMap {
  "number"  = "REAL",
  "string"  = "TEXT",
  "boolean" = "INTEGER",
  "date"    = "INTEGER",
  "object"  = "TEXT",
  "array"   = "TEXT"
}

const COMPLES_TYPES = [
  Date,
  Object,
  Array
]

export type PragmaResult = {
  pk         : boolean
  // cid        : number,
  name       : string,
  type       : string
  // notnull    : boolean,
  // dflt_value : number | string | null
}


export default class Field {

  /**
   * Returns a list of fields based on the tables current status
   *
   * @param {Array} list of fields in the table
   */
  static load(list: Array<PragmaResult>) : Array<Field> {
    return list.map(item => {
      let field = parseField(item)
      return new Field(field.name, field.type)
    })
  }

  /**
   * Deduces the type for a given value.
   * Returns a {Field} instance
   *
   * @param {String} name
   * @param {Object} value
   */
  static deduce(name: string = "", value : any) : Field {
    let type : string = typeof value

    if (!TypeMap[type] || type === 'object') type = findSpecialType(value)

    return new Field(name, type)
  }

  constructor(
    public name : string,
    public type : string,
    // private definition : string
  ) { }

  /**
   * Substitutes the db value for a parsed one
   *
   * @param {Object} result - from the db
   *
   * @returns {Object} the transformed object
   */
  transform(object: any): any {
    let result = Object.assign({},object)
    let field = this.dbName()
    let value = result[field]

    if (this.name !== field) delete result[field]
    if (value === null) return result

    result[this.name] = this.parse(value)

    return result
  }

  /**
   * Reads a value from the db a returns is as javascript
   *
   * @param {Object} value - Any value
   */
  parse(value: any): any {
    switch(this.type) {
      case 'date'    : return new Date(value)
      case 'boolean' : return value === 1
      case 'array'   :
      case 'object'  : return JSON.parse(value)
      default        : return value
    }
  }

  /**
   * Cast a javascript value to a sqlite ready one based on the type
   *
   * @param {Object} value - Any value
   */
  cast(value: any): any {
    switch(this.type) {
      case 'date'   : return value.getTime()
      case 'string' : return value
      case 'boolean': return Number(value)
      case 'array'  :
      case 'object' : return JSON.stringify(value)
      default : return value
    }

  }

  /**
   * Returns the field name in the db
   *
   * @returns {String} The field name
   */
  dbName(): string {
    if ([
      "date",
      "boolean",
      "object",
      "array"
    ].includes(this.type)) return this.name + "::" + this.type

    return this.name
  }

  /**
   * Returns the field definition for create/alter a table
   *
   * @returns {String} the field definition
   */
  definition(): string {
    return `'${this.dbName()}' ${TypeMap[this.type]}`
  }

}

// private

let parseField = (field: PragmaResult) => {
  let [name, type] = field.name.split("::")

  // an integer and primary key
  if (field.pk && field.type === "INTEGER") type = "number"

  if (!type) type = Object.keys(TypeMap).find(type => TypeMap[type] == field.type)

  return { name, type }
}

let findSpecialType = (value: any): string => {
  const type = COMPLES_TYPES.find(type => value.constructor.name === type.name)

  if (!type) throw new Error(`Unsupported type for ${value}!`)

  return type.name.toLowerCase()
}