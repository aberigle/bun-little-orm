import { describe } from 'bun:test';

import { createClient } from '@libsql/client';
import { testModel } from './model.test';


describe('typebox', () => describe("model (libsql)", () => testModel(createClient({ url: `:memory:` }))))