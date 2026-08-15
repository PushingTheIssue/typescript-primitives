import type { Pool, PoolClient } from 'pg';
import { SqlDatabase, type SqlValue } from '../../index.js';

export class PostgresDatabase extends SqlDatabase {
  constructor(private readonly pool: Pool) {
    super('postgres');
  }

  async query<T>(sql: string, parameters: readonly SqlValue[] = []): Promise<readonly T[]> {
    const result = await this.pool.query(sql, [...parameters]);
    return result.rows as T[];
  }

  async transaction<T>(work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(new PostgresClientDatabase(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}

class PostgresClientDatabase extends SqlDatabase {
  constructor(private readonly client: PoolClient) {
    super('postgres');
  }

  async query<T>(sql: string, parameters: readonly SqlValue[] = []): Promise<readonly T[]> {
    const result = await this.client.query(sql, [...parameters]);
    return result.rows as T[];
  }

  async transaction<T>(): Promise<T> {
    throw new Error('Nested transactions are not supported');
  }
}
