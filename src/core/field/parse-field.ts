import Field from "./field"
import { PragmaResult, TypeMap } from "./types"


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
  field: PragmaResult
): {
  name: string,
  type: string
} {
  let [
    name,
    type
  ] = field.name.split("::") as [string, string | undefined]

  // an integer and primary key
  if (field.pk && field.type === "INTEGER") type = "number"

  if (type === undefined)
    type = Object.keys(TypeMap).find(type => TypeMap[type] == field.type) as string

  return { name, type }
}
