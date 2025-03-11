
export type PragmaResult = {
  pk         : boolean
  name       : string
  type       : string
  cid        : number
  notnull    : boolean,
  dflt_value? :  number | string | null
}

export enum TypeMap {
  "number"  = "REAL",
  "string"  = "TEXT",
  "boolean" = "INTEGER",
  "date"    = "INTEGER",
  "object"  = "TEXT",
  "array"   = "TEXT"
}
