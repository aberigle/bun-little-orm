import Field from "./field"
import { FieldType, PragmaResult, TypeMap } from "./types"


/**
 * Returns a list of fields based on the tables current status
 *
 * @param {Array<PragmaResult>} list of fields in the table
 */
export function parseFieldListFromDb(
  list: Array<PragmaResult>
): Record<string, Field> {
  return list
  .reduce((result, current) => {
    const field = parseFieldFromDb(current)
    result[field.name] = new Field(field.type)
    return result
  }, {})
}

export function parseFieldFromDb(
  pragma: PragmaResult
): {
  name: string,
  type: FieldType
} {
  let [
    name,
    type
  ] = pragma.name.split("::") as [string, FieldType | undefined]

  // an integer and primary key
  if (!type && pragma.type === "INTEGER") type = "id"

  if (type === undefined)
    type = Object.keys(TypeMap).find((type) => TypeMap[type] == pragma.type) as FieldType

  return { name, type }
}
