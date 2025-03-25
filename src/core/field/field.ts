import { Model } from "@/typebox"
import { FieldType } from "./types"

export default class Field {
  public required : boolean

  constructor(
    public type: FieldType,
    private extra: any = {}

  ) {}

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
      case 'id'      :
        const model = this.extra as Model<any>
        return typeof value == "string" ? model.cast(model.transform(JSON.parse(value))) : value
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
      case 'id'     : return typeof value === "object" ? value.id : value
      default : return value
    }

  }

}

