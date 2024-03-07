import { describe, it, expect } from 'bun:test'
import Field from '../lib/field'
import { PragmaResult } from '../lib/field'

// test sqlite field defitions
const number  : PragmaResult = { name : "number",           type : "REAL",    pk : false }
const string  : PragmaResult = { name : "string",           type : "TEXT",    pk : false }
const boolean : PragmaResult = { name : "boolean::boolean", type : "INTEGER", pk : false }
const date    : PragmaResult = { name : "date::date",       type : "INTEGER", pk : false }

describe('field', () => {
  describe("deduces", () => {
    it("numbers", () => {
      const field : Field = Field.deduce("test", 1)
      expect(field.type).toBe("number")
      expect(field.dbName()).toBe("test")
      expect(field.definition()).toBe("'test' REAL")
    })

    it("strings",  () => {
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
  })


})