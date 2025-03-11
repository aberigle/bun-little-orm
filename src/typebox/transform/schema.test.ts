import { Type } from '@sinclair/typebox'
import { describe, expect, it } from 'bun:test'
import { parseSchema } from './schema'


describe('typebox',() => {
  describe("parseSchema", () => {
    it("parses objects", () => {
      const fields = parseSchema(Type.Object({
        string  : Type.String(),
        number  : Type.Number(),
        boolean : Type.Boolean(),
        object  : Type.Object({}),
        any     : Type.Any(),
        array   : Type.Array(Type.Number()),
        date    : Type.Date()
      }))

      expect(fields.string.type).toBe("string")
      expect(fields.number.type).toBe("number")
      expect(fields.boolean.type).toBe("boolean")
      expect(fields.object.type).toBe("object")
      expect(fields.array.type).toBe("array")
      expect(fields.date.type).toBe("date")
      expect(fields.any.type).toBe("object")
    })
  })

})