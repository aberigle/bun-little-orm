import { describe, it, expect } from 'bun:test'
import Field from '../src/field'
import { PragmaResult } from '../src/field'

// test sqlite field defitions
const number  : PragmaResult = { name: "number",           type: "REAL",    pk: false }
const string  : PragmaResult = { name: "string",           type: "TEXT",    pk: false }
const boolean : PragmaResult = { name: "boolean::boolean", type: "INTEGER", pk: false }
const date    : PragmaResult = { name: "date::date",       type: "INTEGER", pk: false }
const object  : PragmaResult = { name: "object::object",   type: "TEXT",    pk: false }
const array   : PragmaResult = { name: "array::array",     type: "TEXT",    pk: false }

describe('field', () => {
  describe("deduces", () => {
    it("numbers", () => {
      const field: Field = Field.deduce("test", 1)
      expect(field.type).toBe("number")
      expect(field.dbName()).toBe("test")
      expect(field.definition()).toBe("'test' REAL")
    })

    it("strings", () => {
      let field = Field.deduce("test", "text")
      expect(field.name).toBe("test")
      expect(field.type).toBe("string")
      expect(field.dbName()).toBe("test")
      expect(field.definition()).toBe("'test' TEXT")
    })

    it("dates", () => {
      let field = Field.deduce("test", new Date)
      expect(field.type).toBe("date")
      expect(field.dbName()).toBe("test::date")
      expect(field.definition()).toBe("'test::date' INTEGER")
    })

    it("booleans", () => {
      let field = Field.deduce("test", false)
      expect(field.type).toBe("boolean")
      expect(field.dbName()).toBe("test::boolean")
      expect(field.definition()).toBe("'test::boolean' INTEGER")
    })

    it("objects", () => {
      let field = Field.deduce("test", { hola: "mundo" })
      expect(field.type).toBe("object")
      expect(field.dbName()).toBe("test::object")
      expect(field.definition()).toBe("'test::object' TEXT")
    })

    it("arrays", () => {
      let field = Field.deduce("test", ["test"])
      expect(field.type).toBe("array")
      expect(field.dbName()).toBe("test::array")
      expect(field.definition()).toBe("'test::array' TEXT")
    })
  })

  describe("loads from db", () => {
    it("numbers", () => {
      let field = Field.load([number])[0]
      expect(field.name).toBe("number")
      expect(field.type).toBe("number")
    })

    it("strings", () => {
      let field = Field.load([string])[0]
      expect(field.name).toBe("string")
      expect(field.type).toBe("string")
    })

    it("booleans", () => {
      let field = Field.load([boolean])[0]
      expect(field.name).toBe("boolean")
      expect(field.type).toBe("boolean")
    })

    it("dates", () => {
      let field = Field.load([date])[0]
      expect(field.name).toBe("date")
      expect(field.type).toBe("date")
    })

    it("objects", () => {
      let field = Field.load([object])[0]
      expect(field.name).toBe("object")
      expect(field.type).toBe("object")
    })

    it("arrays", () => {
      let field = Field.load([array])[0]
      expect(field.name).toBe("array")
      expect(field.type).toBe("array")
    })
  })

  describe("casts to db", () => {
    it("numbers", () => {
      let field = Field.load([number])[0]
      expect(field.cast(2)).toBe(2)
    })

    it("strings", () => {
      let field = Field.load([string])[0]
      expect(field.cast("test")).toBe("test")
    })

    it("booleans", () => {
      let field = Field.load([boolean])[0]
      expect(field.cast(true)).toBe(1)
    })

    it("dates", () => {
      let field = Field.load([date])[0]
      let value = new Date("2023-01-01")
      expect(field.cast(value)).toBe(1672531200000)
    })

    it("objects", () => {
      let field = Field.load([object])[0]
      let value = { hola: "mundo" }
      expect(field.cast(value)).toBe(JSON.stringify(value))
    })

    it("arrays", () => {
      let field = Field.load([array])[0]
      let value = ["list"]
      expect(field.cast(value)).toBe(JSON.stringify(value))
    })
  })

  describe("parses from db", () => {
    it("numbers", () => {
      let field = Field.load([number])[0]
      expect(field.parse(2)).toBe(2)
    })

    it("strings", () => {
      let field = Field.load([string])[0]
      expect(field.parse("test")).toBe("test")
    })

    it("booleans", () => {
      let field = Field.load([boolean])[0]
      expect(field.parse(1)).toBe(true)
    })

    it("dates", () => {
      let field = Field.load([date])[0]
      let value = new Date("2023-01-01")
      expect(field.parse(1672531200000)).toEqual(value)
    })

    it("objects", () => {
      let field = Field.load([object])[0]
      let value = { hola: "mundo" }
      expect(field.parse(JSON.stringify(value))).toEqual(value)
    })

    it("arrays", () => {
      let field = Field.load([array])[0]
      let value = ["list"]
      expect(field.parse(JSON.stringify(value))).toEqual(value)
    })
  })

})