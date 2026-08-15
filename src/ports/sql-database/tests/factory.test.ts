import { describe, expect, it } from 'vitest';
import { SqlDatabase } from '../index.js';

describe('SqlDatabase.create', () => {
  it('creates the selected SQLite adapter from package-level options', async () => {
    const database = await SqlDatabase.create({ adapter: 'sqlite', filename: ':memory:' });

    expect(database.adapter).toBe('sqlite');
    await database.query('CREATE TABLE values_table (value TEXT NOT NULL)');
    await database.query('INSERT INTO values_table (value) VALUES (?)', ['created']);

    await expect(database.query<{ value: string }>('SELECT value FROM values_table')).resolves.toEqual([
      { value: 'created' },
    ]);
  });

  it('creates the selected PostgreSQL adapter without opening a connection', async () => {
    const database = await SqlDatabase.create({
      adapter: 'postgres',
      connectionString: 'postgres://localhost/test',
    });

    expect(database.adapter).toBe('postgres');
    await (database as { pool?: { end(): Promise<void> } }).pool?.end();
  });

  it('rejects unsupported runtime adapter values', async () => {
    await expect(SqlDatabase.create({ adapter: 'mysql' } as never))
      .rejects.toThrow('Unsupported SQL adapter: mysql');
  });

  it('creates the selected D1 adapter from a Cloudflare binding', async () => {
    const database = await SqlDatabase.create({
      adapter: 'd1',
      database: {
        prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }),
        batch: async () => [],
      } as never,
    });

    expect(database.adapter).toBe('d1');
  });
});
