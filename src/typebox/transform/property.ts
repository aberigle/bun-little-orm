import { Field } from "@/core";
import { TObject, TSchema, TUnion } from "@sinclair/typebox";
import { Model } from "../model";

function parseUnionProperty(
  field : TUnion,
  references : Model<TSchema>[] = []
) : Field {

  // add support for dates as string or number
  const date: TSchema | undefined = field.anyOf.find(({ type }) => type == "Date")
  if (date !== undefined) return parseProperty(date)

  // const schema = field.anyOf.find(({ $id }) => $id)
  // if (schema && field.anyOf.length == 2) {
  //   const model = references.find(({ schema: { $id } }) => $id == schema.$id)
  //   return new Field("id", model)
  // }

  throw new Error("Type not supported: Union")
}

export function parseObjectProperty(
  field      : TObject,
  references : Model<TSchema>[] = [],
  options: { required: boolean }
): Field {
  if (!field.$id?.includes("ref")) return new Field("object", options.required)

  const name = field.$id.split("@").pop()
  const model = references.find(({ schema: { $id } }) => $id == name)
  if (model) return new Field("id", options.required).reference(model)

  throw new Error(`${model} model not found!`)
}

export function parseProperty(
  field : TSchema,
  references: Model<TSchema>[] = []
) : Field {

  let options = {
    required: !(Symbol.for("TypeBox.Optional") in field)
  }

  switch (field.type) {
    case 'string': return new Field("string", options.required)
    case 'number'  :
    case 'integer' : return new Field("number", options.required)
    case 'boolean' : return new Field("boolean", options.required)
    case 'Date'    : return new Field("date", options.required)
    case 'object'  : return parseObjectProperty(<TObject>field, references, options)
    case 'array'   : return new Field("array", options.required)
  }

  const key    = Symbol.for("TypeBox.Kind")
  const symbol = key in field? field[key] : ''

  switch(symbol) {
    // case 'Ref'   : {
    //   const model = references.find(ref => ref.schema.$id == field.$ref)
    //   if (!model) throw new Error("Reference for non existing model: " + field.$ref)

    //   return new Field("number", true)
    // }
    case 'Any'   : return new Field("object", options.required)
    case 'Union' : return parseUnionProperty(<TUnion>field, references)
    // case 'Union' :
    //   let ref = field.anyOf.find((item: TSchema) => key in item && item[key] === 'Ref')
    //   if (ref) return parseProperty(ref)
    //   return {
    //     ...def,
    //     type : String,
    //     enum : field.anyOf.map(value => value.const)
    //   }
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}