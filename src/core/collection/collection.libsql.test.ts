import { describe } from 'bun:test';

import { createClient } from "@libsql/client";
import { testCollection } from './collection.bun.test';

const db = createClient({ url: `:memory:` })

async function execute(query: string) {
  const { rows: [result] } = await db.execute(query)
  return result
}

describe('collection', () => describe("libsql", () => testCollection(db, execute)))