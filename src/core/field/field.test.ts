import { describe, expect, it } from 'bun:test'
import Field from './field'

describe('field', () => {

  describe("casts to db", () => {
    it("numbers", () => {
      let field = new Field("number")
      expect(field.cast(2)).toBe(2)
    })

    it("strings", () => {
      let field = new Field("string")
      expect(field.cast("test")).toBe("test")
    })

    it("booleans", () => {
      let field = new Field("boolean")
      expect(field.cast(true)).toBe(1)
    })

    it("dates", () => {
      let field = new Field("date")
      let value = new Date("2023-01-01")
      expect(field.cast(value)).toBe(1672531200000)
    })

    it("objects", () => {
      let field = new Field("object")
      let value = { hola: "mundo" }
      expect(field.cast(value)).toBe(JSON.stringify(value))
    })

    it("arrays", () => {
      let field = new Field("array")
      let value = ["list"]
      expect(field.cast(value)).toBe(JSON.stringify(value))
    })
  })

  describe("parses from db", () => {
    it("numbers", () => {
      let field = new Field("number")
      expect(field.parse(2)).toBe(2)
    })

    it("strings", () => {
      let field = new Field("string")
      expect(field.parse("test")).toBe("test")
    })

    it("booleans", () => {
      let field = new Field("boolean")
      expect(field.parse(1)).toBe(true)
    })

    it("dates", () => {
      let field = new Field("date")
      let value = new Date("2023-01-01")
      expect(field.parse(1672531200000)).toEqual(value)
    })

    it("objects", () => {
      let field = new Field("object")
      let value = { hola: "mundo" }
      expect(field.parse(JSON.stringify(value))).toEqual(value)
    })

    it("arrays", () => {
      let field = new Field("array")
      let value = ["list"]
      expect(field.parse(JSON.stringify(value))).toEqual(value)
    })
  })

})