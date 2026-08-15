import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { SqliteDatabase } from '../index.js';

const databases: Database.Database[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

describe('SqliteDatabase', () => {
  it('queries and commits work inside a transaction', async () => {
    const database = new Database(':memory:');
    databases.push(database);
    const sql = new SqliteDatabase(database);
    expect(sql.adapter).toBe('sqlite');

    await sql.query('CREATE TABLE values_table (value TEXT NOT NULL)');
    await sql.transaction(async (transaction) => {
      await transaction.query('INSERT INTO values_table (value) VALUES (?)', ['stored']);
    });

    await expect(sql.query<{ value: string }>('SELECT value FROM values_table')).resolves.toEqual([
      { value: 'stored' },
    ]);
  });

  it('rolls back when the transaction work fails', async () => {
    const database = new Database(':memory:');
    databases.push(database);
    const sql = new SqliteDatabase(database);
    await sql.query('CREATE TABLE values_table (value TEXT NOT NULL)');

    await expect(sql.transaction(async (transaction) => {
      await transaction.query('INSERT INTO values_table (value) VALUES (?)', ['discarded']);
      throw new Error('stop');
    })).rejects.toThrow('stop');

    await expect(sql.query('SELECT value FROM values_table')).resolves.toEqual([]);
  });

  it('rejects nested transactions without blocking', async () => {
    const database = new Database(':memory:');
    databases.push(database);
    const sql = new SqliteDatabase(database);

    await expect(sql.transaction(async () => sql.transaction(async () => undefined)))
      .rejects.toThrow('Nested transactions are not supported');
  });
});
