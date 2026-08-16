import type { Pool, PoolClient } from 'pg';
import { SqlDatabase, type SqlValue } from '../../index.js';
import type { Telemetry } from '../../../telemetry/index.js';
import { observe } from '../../../../internal/telemetry.js';

export class PostgresDatabase extends SqlDatabase {
  constructor(private readonly pool: Pool, private readonly telemetry?: Telemetry) {
    super('postgres');
  }

  async query<T>(sql: string, parameters: readonly SqlValue[] = []): Promise<readonly T[]> {
    return observe(this.telemetry, 'sql', this.adapter, 'query', async () => {
      const result = await this.pool.query(sql, [...parameters]);
      return result.rows as T[];
    });
  }

  async transaction<T>(work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    return observe(this.telemetry, 'sql', this.adapter, 'transaction', async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(new PostgresClientDatabase(client, this.telemetry));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    });
  }
}

class PostgresClientDatabase extends SqlDatabase {
  constructor(private readonly client: PoolClient, private readonly telemetry?: Telemetry) {
    super('postgres');
  }

  async query<T>(sql: string, parameters: readonly SqlValue[] = []): Promise<readonly T[]> {
    return observe(this.telemetry, 'sql', this.adapter, 'query', async () => {
      const result = await this.client.query(sql, [...parameters]);
      return result.rows as T[];
    });
  }

  async transaction<T>(_work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    return observe(this.telemetry, 'sql', this.adapter, 'transaction', async () => {
      throw new Error('Nested transactions are not supported');
    });
  }
}
