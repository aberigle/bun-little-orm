import { Model } from "@/typebox"
import { FieldType } from "./types"

export default class Field {
  ref: Model<any>

  constructor(
    public type     : FieldType,
    public required : boolean = true
  ) {}

  reference(model: Model<any>) {
    this.ref = model
    return this
  }
  /**
   * Reads a value from the db a returns is as javascript
   *
   * @param {Object} value - Any value
   */
  parse(value: any): any {
    if (!this.required && value == null) return undefined

    switch(this.type) {
      case 'date'    : return new Date(value)
      case 'boolean' : return value === 1
      case 'array'   : return value !== null
        ? JSON.parse(value)
        : []
      case 'object'  : return value !== null
        ? JSON.parse(value)
        : {}
      case 'id'      :
        if (!this.ref) return value

        const model = this.ref
        if (typeof value === "string" && value.startsWith("{"))
          value = JSON.parse(value)
        return typeof value !== "number"
          ? model.cast(model.transform(value))
          : { id: value }

      default: return value
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
      case 'id'     : return typeof value === "object" ? value.id : value
      default : return value
    }

  }

}

