import { Static, TObject, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import Database, { Statement } from 'bun:sqlite';
import { describe, expect, it } from 'bun:test';
import { Model } from './model';
import { ModelReference } from './model-reference';

const reusableDB = new Database()
const TestSchema = Type.Object({
  text   : Type.String(),
  digit  : Type.Number(),
  date   : Type.Date(),
  object : Type.Object({ nested: Type.String() }),
  list   : Type.Array(Type.Object({ nested: Type.String() })),
  flag   : Type.Boolean()
})

function getModel(
  schema: TObject = TestSchema,
  db: Database = new Database()
) {
  return new Model(db, "test", schema)
}
describe('typebox', () => {
  describe("model (bun)", () => {
    it('inserts in a new collection', async () => {
      const schema = Type.Object({ id : Type.Number(), test: Type.Number() })
      const model = new Model(reusableDB, "test", schema)

      await model.insert({ test: 1 })

      let result: any = reusableDB.query(`SELECT * FROM test`).get()
      expect(result.test).toBe(1)
    })

    it('alters table with new fields', async () => {
      const schema = Type.Object({ test: Type.Number(), field: Type.String() })
      const model = new Model(reusableDB, "test", schema)

      await model.insert({ field: "success", test: 2 })

      let result: any = reusableDB.query(`SELECT * FROM test LIMIT 1 OFFSET 1`).get()
      expect(result.test).toBe(2)
      expect(result.field).toBe("success")
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


    describe("relations", () => {
      const OneSchema = Type.Object({
        id: Type.Number(),
        date : Type.Date(),
        test: Type.String()
      }, { $id: "One" })
      const One = new Model(reusableDB, <string>OneSchema.$id, OneSchema)

      const TwoSchema = Type.Object({
        id    : Type.Number(),
        field : Type.String(),
        one   : ModelReference(One)
      }, { $id: "Two" })
      const Two = new Model(reusableDB, <string>TwoSchema.$id, TwoSchema)

      const ThreeSchema = Type.Object({
        id    : Type.Number(),
        field : Type.String(),
        two   : ModelReference(Two)//Type.Union([Type.Number(), TwoSchema])
      }, { $id: "Three" })
      const Three = new Model(reusableDB, <string>ThreeSchema.$id, ThreeSchema)

      it("creates relations", async () => {
        const oneInserted = await One.insert({ test: "references", date : new Date("2025-02-01") })
        const twoInserted = await Two.insert({ field: "adios",     one: oneInserted })

        expect(twoInserted.one.id).toEqual(oneInserted.id)

      })

      it("filters nested relations recursively", async () => {
        const [result] = await Two.findAndJoin({ "one": { id: 1 } })

        expect(result.one).toBeObject()
        const oneResult = result.one as Static<typeof OneSchema>

        expect(oneResult.date).toEqual(new Date("2025-02-01"))
        expect(oneResult.id).toBe(1)

        const threeInserted = await Three.insert({ field: "three", two: result })
        expect(threeInserted.field).toBe("three")

        const [three] = await Three.findAndJoin({ two: { one: { id: 1 } } })
        expect(three.field).toBe("three")

        const two = three.two as Static<typeof TwoSchema>
        expect("field" in two).toBe(true)

        const one = two.one as Static<typeof OneSchema>
        expect("date" in one).toBe(true)
        expect(one.id).toBe(1)
        expect(one.date).toEqual(new Date("2025-02-01"))

      })

    })


  })
})