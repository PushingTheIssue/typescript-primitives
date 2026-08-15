import { describe, expect, it } from 'vitest';
import { SqlDatabase } from '../index.js';

describe('SqlDatabase', () => {
  it('exposes the adapter selected by a concrete implementation', () => {
    class TestDatabase extends SqlDatabase {
      constructor() {
        super('test');
      }

      async query<T>(): Promise<readonly T[]> {
        return [];
      }

      async transaction<T>(): Promise<T> {
        throw new Error('not implemented');
      }
    }

    expect(new TestDatabase().adapter).toBe('test');
  });
});
