import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'bun:test';
import { Model } from './model';

import { createClient } from "@libsql/client";
const reusableDB = createClient({ url: `:memory:` })

let execute = async (query: string) => {
  let result = await reusableDB.execute(query)
  return result.rows
}

describe('typebox', () => {
  describe("model (libsql)", () => {
    it('inserts in a new collection', async () => {
      const schema = Type.Object({ test: Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      await model.insert({ test: 1 })

      let result: any = await execute(`SELECT * FROM test`)
      expect(result[0].test).toBe(1)
    })

    it('alters table with new fields', async () => {
      const schema = Type.Object({ test: Type.Number(), field: Type.String() })
      const model = new Model(reusableDB, "test", schema)

      await model.insert({ field: "success", test: 2 })

      let result: any = await execute(`SELECT * FROM test LIMIT 1 OFFSET 1`)

      expect(result[0].test).toBe(2)
      expect(result[0].field).toBe("success")
    })

    it('validates data inserted', async () => {
      const schema = Type.Object({ test: Type.Number() })
      const model = new Model(reusableDB, "test", schema)

    // @ts-ignore
      expect(async () => await model.insert({ test: "hola" })).toThrowError("Validation error")
    })

    it('retrieves the models', async () => {
      const schema = Type.Object({ test: Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      const result = await model.find()

      expect(() => Value.Assert(Type.Array(schema), result)).not.toThrow()
      expect(result.length).toBe(2)
      expect(() => Value.Assert(schema, result[0])).not.toThrow()

    })

    it('can search', async () => {
      const schema = Type.Object({ test: Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      let result = await model.find({ test: 1 })

      expect(() => Value.Assert(Type.Array(schema), result)).not.toThrow()
      expect(result.length).toBe(1)
      expect(() => Value.Assert(schema, result[0])).not.toThrow()
      expect(result[0].test).toEqual(1)
    })

    it('can search by id', async () => {
      const schema = Type.Object({ test: Type.Number(), id : Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      let result = await model.findById(2)

      expect(() => Value.Assert(schema, result)).not.toThrow()
      expect(result.id).toBe(2)
    })

    it('can search strings with wildcards', async () => {
      const schema = Type.Object({ test: Type.Number(), field: Type.String() })
      const model = new Model(reusableDB, "test", schema)
      let result = await model.find({ field: "%ess" })

      expect(() => Value.Assert(Type.Array(schema), result)).not.toThrow()
      expect(result.length).toBe(1)
      expect(() => Value.Assert(schema, result[0])).not.toThrow()
      expect(result[0].field).toEqual("success")
    })

    it('supports dates', async () => {
      const schema = Type.Object({ id: Type.Number(), test: Type.Number(), date: Type.Date() })
      const model = new Model(reusableDB, "test", schema)

      let date = new Date()
      let inserted = await model.insert({ date, test : 2 })

      expect(() => Value.Assert(schema, inserted)).not.toThrow()
      expect(inserted.date).toEqual(date)

      let result = await model.find({ id: inserted.id })
      expect(result[0].date).toEqual(date)
    })

    it('supports objects', async () => {
      const schema = Type.Object({
        id : Type.Number(),
        object: Type.Object({ hola: Type.String() })
      })
      const model = new Model(reusableDB, "test", schema)

      let object = { hola: "mundo" }
      let inserted = await model.insert({ object })

      expect(() => Value.Assert(schema, inserted)).not.toThrow()
      expect(inserted.object).toEqual(object)

      let found = await model.findById(inserted.id)
      expect(found.object).toEqual(object)
    })

    it('supports arrays', async () => {
      const schema = Type.Object({
        id : Type.Number(),
        list: Type.Array(Type.String())
      })
      const model = new Model(reusableDB, "test", schema)

      let list = ["list", "two", "three"]
      let inserted = await model.insert({ list })

      expect(() => Value.Assert(schema, inserted)).not.toThrow()
      expect(inserted.list).toEqual(list)

      let found = await model.findById(inserted.id)
      expect(found.list).toEqual(list)
    })

    it('supports updates', async () => {
      const schema = Type.Object({ test: Type.Number(), id : Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      const value = Date.now()
      const update = await model.update(3, { test: value })

      expect(() => Value.Assert(schema, update)).not.toThrow()
      expect(update.test).toEqual(value)

      let result = await model.findById(3)
      expect(result.test).toBe(value)
    })

    it('supports booleans', async () => {
      const schema = Type.Object({ success: Type.Boolean(), id: Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      const inserted = await model.insert({ success: true })
      expect(() => Value.Assert(schema, inserted)).not.toThrow()
      expect(inserted.success).toEqual(true)

      const found = await model.findById(inserted.id)
      expect(() => Value.Assert(schema, inserted)).not.toThrow()
      expect(found.success).toEqual(true)

      const updated = await model.update(inserted.id, { success: false })

      expect(() => Value.Assert(schema, updated)).not.toThrow()
      expect(updated.success).toEqual(false)

      const search  = await model.find({ success: false })
      expect(search.length).toBe(1)
    })
  })
})