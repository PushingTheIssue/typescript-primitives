import { describe, expect, it, vi } from 'vitest';
import { PostgresDatabase } from '../index.js';

describe('PostgresDatabase', () => {
  it('queries through the pool and returns rows', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ value: 'stored' }] });
    const database = new PostgresDatabase({ query } as never);

    expect(database.adapter).toBe('postgres');
    await expect(database.query<{ value: string }>('SELECT $1 AS value', ['stored']))
      .resolves.toEqual([{ value: 'stored' }]);
    expect(query).toHaveBeenCalledWith('SELECT $1 AS value', ['stored']);
  });

  it('commits successful work and releases the client', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ value: 'stored' }] })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    const pool = { connect: vi.fn().mockResolvedValue(client) };
    const database = new PostgresDatabase(pool as never);

    await expect(database.transaction(async (transaction) => {
      expect(transaction.adapter).toBe('postgres');
      return transaction.query<{ value: string }>('SELECT value');
    })).resolves.toEqual([{ value: 'stored' }]);
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'SELECT value', 'COMMIT']);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rolls back failed work and releases the client', async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() };
    const pool = { connect: vi.fn().mockResolvedValue(client) };
    const database = new PostgresDatabase(pool as never);

    await expect(database.transaction(async () => { throw new Error('stop'); })).rejects.toThrow('stop');
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'ROLLBACK']);
    expect(client.release).toHaveBeenCalledOnce();
  });
});
