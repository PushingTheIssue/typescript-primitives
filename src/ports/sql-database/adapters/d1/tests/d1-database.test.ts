import { describe, expect, it, vi } from 'vitest';
import { D1Database } from '../index.js';

describe('D1Database', () => {
  it('binds parameters and returns D1 query results', async () => {
    const all = vi.fn().mockResolvedValue({ results: [{ value: 'stored' }] });
    const bind = vi.fn().mockReturnValue({ all });
    const database = new D1Database({
      prepare: vi.fn().mockReturnValue({ bind }),
      batch: vi.fn(),
    });

    expect(database.adapter).toBe('d1');
    await expect(database.query<{ value: string }>('SELECT ? AS value', ['stored']))
      .resolves.toEqual([{ value: 'stored' }]);
    expect(bind).toHaveBeenCalledWith('stored');
    expect(all).toHaveBeenCalledOnce();
  });

  it('rejects interactive transactions', async () => {
    const database = new D1Database({ prepare: vi.fn(), batch: vi.fn() });

    await expect(database.transaction(async () => undefined))
      .rejects.toThrow('D1 does not support interactive transactions');
  });

  it('runs statements atomically through D1 batch', async () => {
    const batch = vi.fn().mockResolvedValue([{ success: true }]);
    const prepare = vi.fn((sql: string) => ({
      bind: (...parameters: unknown[]) => ({ sql, parameters }),
      all: async () => ({ results: [] }),
    }));
    const database = new D1Database({ prepare, batch } as never);

    await expect(database.batch([{ sql: 'INSERT INTO values_table VALUES (?)', parameters: [new Date('2026-01-01')] }]))
      .resolves.toEqual([{ success: true }]);

    expect(batch).toHaveBeenCalledWith([{ sql: 'INSERT INTO values_table VALUES (?)', parameters: ['2026-01-01T00:00:00.000Z'] }]);
  });
});
