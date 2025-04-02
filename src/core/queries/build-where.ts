import { Field } from "../field";
import { getFieldName } from "../field/serialize";

export function buildWhere(
  fields: Record<string, Field>,
  filter : Record<string, any>,
  table: string = ""
) : {
    sql: string, args: any[], joins : Record<string, Field>
} {
  const keys = Object.keys(filter)

  if (!keys.length) return { sql: '', args: [], joins: {} }

  const values     : any[] = []
  const conditions : string[] = []
  const joins: Record<string, Field> = {}

  for (const name of keys) if (fields[name]) {
    const field = fields[name]
    // TODO mejorar esto (cambiar lo de extra)
    if (field.type === "id" && field.extra?.table) {
      joins[name] = field
      continue
    }

    let action = "="
    const value = filter[name]

    if (typeof value == 'string' && value.includes("%"))
      action = "LIKE"

    values.push(field.cast(value))
    conditions.push(`${table ? table + "." : ''}"${getFieldName(name, field)}" ${action} ?`)
  }

  return {
    sql : `${conditions.join(" AND ")}`,
    args : values,
    joins
  }
}