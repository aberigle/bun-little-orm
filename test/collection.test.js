import { describe, it, expect } from 'bun:test'
import { Database } from 'bun:sqlite';
import Collection from '../lib/collection';

const db = new Database()
const col = new Collection(db, "test")

describe('collection',() => {
  it('inserts in a new collection', () => {
    col.insert({ test: 1 })
    let result = db.query(`SELECT * FROM test`).get()
    expect(result.test).toBe(1)
  })

  it('alters table with new fields', () => {
    col.insert({ field: "success" })
    let result = db.query(`SELECT * FROM test LIMIT 1 OFFSET 1`).get()
    expect(result.test).toBe(null)
    expect(result.field).toBe("success")
  })

  it('retrieves the models', () => {
    let result = col.find()
    expect(result.length).toBe(2)
  })

  it('can search', () => {
    let result = col.find({ test : 1})
    expect(result.length).toBe(1)
  })

  it('cant search by id', () => {
    let result = col.findById(2)
    expect(result.field).toBe("success")
  })

  it('can search strings with wildcards', () => {
    let result = col.find({ field : "%ess"})
    expect(result.length).toBe(1)
  })

  it('supports dates', () => {
    let date = new Date()
    col.insert({ date })
    let result = col.find({ _id : 3})
    expect(result[0].date).toEqual(date)
  })
})