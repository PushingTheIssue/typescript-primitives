import { AsyncLocalStorage } from 'node:async_hooks';
import Database from 'better-sqlite3';
import { SqlDatabase, type SqlValue } from '../../index.js';

export class SqliteDatabase extends SqlDatabase {
  private transactionQueue = Promise.resolve();
  private readonly transactionContext = new AsyncLocalStorage<true>();

  constructor(private readonly database: Database.Database) {
    super('sqlite');
  }

  async query<T>(sql: string, parameters: readonly SqlValue[] = []): Promise<readonly T[]> {
    const statement = this.database.prepare(sql);
    if (!statement.reader) {
      statement.run(...parameters);
      return [];
    }
    return statement.all(...parameters) as T[];
  }

  async transaction<T>(work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    if (this.transactionContext.getStore() !== undefined) {
      throw new Error('Nested transactions are not supported');
    }

    const previous = this.transactionQueue;
    let release!: () => void;
    this.transactionQueue = new Promise<void>((resolve) => { release = resolve; });
    await previous;

    let begun = false;
    try {
      this.database.exec('BEGIN');
      begun = true;
      const result = await this.transactionContext.run(true, () => work(this));
      this.database.exec('COMMIT');
      return result;
    } catch (error) {
      if (begun) this.database.exec('ROLLBACK');
      throw error;
    } finally {
      release();
    }
  }
}
