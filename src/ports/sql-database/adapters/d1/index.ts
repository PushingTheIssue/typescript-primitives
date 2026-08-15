import { SqlDatabase, type D1BatchStatement, type D1DatabaseBinding, type SqlValue } from '../../index.js';

export class D1Database extends SqlDatabase {
  constructor(private readonly database: D1DatabaseBinding) {
    super('d1');
  }

  async query<T>(sql: string, parameters: readonly SqlValue[] = []): Promise<readonly T[]> {
    const statement = this.database.prepare(sql).bind(...parameters.map(toD1Value));
    const result = await statement.all<T>();
    return result.results;
  }

  async transaction<T>(_work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    throw new Error('D1 does not support interactive transactions; use D1 batch operations instead');
  }

  async batch(statements: readonly D1BatchStatement[]): Promise<readonly unknown[]> {
    return this.database.batch(statements.map(({ sql, parameters = [] }) => (
      this.database.prepare(sql).bind(...parameters.map(toD1Value))
    )));
  }
}

function toD1Value(value: SqlValue): string | number | boolean | Uint8Array | ArrayBuffer | null {
  return value instanceof Date ? value.toISOString() : value;
}
