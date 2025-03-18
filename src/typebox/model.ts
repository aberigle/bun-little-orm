import { Collection, Field } from "@/core";
import { isEmpty } from "@/utils/objects";
import { Static, TSchema, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { parseSchema } from "./transform/schema";
import { ValidationException } from "./validation-exception";

export class Model<T extends TSchema> extends Collection {

  constructor(
    db     : any,
    name   : string,
    public schema : T
  ) {
    super(db, name)
  }

  async ensure(
    fields?: Record<string, Field>
  ): Promise<Record<string, Field>> {
    if (isEmpty(this.fields))
      await super.ensure(parseSchema(this.schema))

    return this.fields
  }

  validate(
    model: Static<T>,
    partial = false
  ) {
    if (Value.Check(this.schema, model)) return true

    const errors = [
      ...Value.Errors(
        partial
        ? Type.Partial(this.schema)
        : this.schema,
        model)
      ]
    .filter(({ path }) => path !== "/id")

    if (errors.length) throw new ValidationException(errors)
  }

  cast(value: any): Static<T> {
    return Value.Clean(this.schema, { ...value })
  }

  async sql(
    query : string,
    params : Array<any>
  ): Promise<Array<Static<T>>> {

    const result: Array<any> = await this.execute(query, params)
    return result
    .map(item => this.cast(this.transform(item)))
  }

  async insert(
    model: Omit<Static<T>, "id">
  ): Promise<Static<T>> {
    this.validate(model)
    const result = await super.insert(model)
    return this.cast(result)
  }

  async find(
    search: Partial<Static<T>> = {}
  ): Promise<Array<Static<T>>> {
    const result = await super.find(search)
    return result.map(item => this.cast(item))
  }

  async findById(query: any): Promise<Static<T>> {
    const result = await super.findById(query)
    return this.cast(result)
  }

  async update(
    id    : any,
    model : Partial<Static<T>>
  ): Promise<Static<T>> {
    this.validate(model, true)

    const result = await super.update(id, model)
    return this.cast(result)
  }
}