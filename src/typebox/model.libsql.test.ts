import { describe } from 'bun:test';

import { createClient } from "@libsql/client";
import { testModel } from './model.test';
const reusableDB = createClient({ url: `:memory:` })

let execute = async (query: string) => {
  let result = await reusableDB.execute(query)
  return result.rows
}

describe('typebox', () => describe("model (libsql)", () => testModel(reusableDB)))