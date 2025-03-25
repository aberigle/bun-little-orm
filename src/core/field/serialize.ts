import Field from "./field"
import { TypeMap } from "./types"

/**
 * Returns the field name in the db
 *
 * @returns {String} The field name
 */
export function getFieldName(
  name: string,
  field: Field
) {
  if ([
    "date",
    "boolean",
    "object",
    "array"
  ].includes(field.type)) return name + "::" + field.type

  return name
}

/**
* Returns the field definition for create/alter a table
*
* @returns {String} the field definition
*/
export function getFieldDefinition(
  name: string,
  field: Field
) {
  return `'${getFieldName(name, field)}' ${TypeMap[field.type]}`
}

