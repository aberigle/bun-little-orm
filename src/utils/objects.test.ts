import { describe, expect, it } from 'bun:test';
import { isEmpty } from './objects';

describe("objects", () => {

  describe("isEmpty", () => {
    it("checks empty object", () => expect(isEmpty({})).toBe(true))
    it("checks non empty", () => expect(isEmpty({ not: "empty" })).toBe(false))
  })
})
