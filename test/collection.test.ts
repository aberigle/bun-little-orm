import { describe, it, expect } from 'bun:test'
// import { Database } from 'bun:sqlite';
// import * as SQL from 'sqlite3'
import Collection from '../lib/collection';
import Database from 'bun:sqlite';

// const Database = SQL.verbose().Database

const db  = new Database()
const col = new Collection(db, "test")

describe('collection', () => {
  it('inserts in a new collection', async () => {
    await col.insert({ test: 1 })
    let result: any = db.query(`SELECT * FROM test`).get()
    expect(result.test).toBe(1)
  })

  it('alters table with new fields', async () => {
    await col.insert({ field: "success", test : 2 })
    let result: any = db.query(`SELECT * FROM test LIMIT 1 OFFSET 1`).get()
    expect(result.test).toBe(2)
    expect(result.field).toBe("success")
  })

  it('retrieves the models', async () => {
    let result = await col.find()
    expect(result.length).toBe(2)
  })

  it('can search', async () => {
    let result = await col.find({ test : 1})
    expect(result.length).toBe(1)
  })

  it('cant search by id', async () => {
    let result = await col.findById(2)
    expect(result.field).toBe("success")
  })

  it('can search strings with wildcards', async () => {
    let result = await col.find({ field : "%ess"})
    expect(result.length).toBe(1)
  })

  it('supports dates', async () => {
    let date = new Date()
    await col.insert({ date })
    let result = await col.find({ id : 3})
    expect(result[0].date).toEqual(date)
  })

  it('supports updates', async () => {
    await col.update(3, { test : 3})
    let result = await col.findById(3)
    expect(result.test).toBe(3)
  })

  it('returns id on insert', async () => {
    let result = await col.insert({ text : "id test"})
    expect(result.id).toBe(4)
  })

  it('supports booleans', async () => {
    let result = await col.insert({ success : true})
    result = await col.findById(result)
    expect(result.success).toBe(true)

    await col.update(result.id, { success: false })
    result = await  col.findById(result)
    expect(result.success).toBe(false)

    result = await col.find({ success: false })
    expect(result.length).toBe(1)
  })
})