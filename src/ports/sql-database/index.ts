export type SqlValue = string | number | boolean | Date | Uint8Array | ArrayBuffer | null;

export interface D1DatabaseBinding {
  prepare(sql: string): D1PreparedStatementBinding;
  batch(statements: readonly D1PreparedStatementBinding[]): Promise<readonly unknown[]>;
}

export interface D1PreparedStatementBinding {
  bind(...parameters: SqlValue[]): D1PreparedStatementBinding;
  all<T>(): Promise<{ readonly results: readonly T[] }>;
}

export interface D1BatchStatement {
  readonly sql: string;
  readonly parameters?: readonly SqlValue[];
}

export type SqlDatabaseOptions =
   | { readonly adapter: 'sqlite'; readonly filename: string; readonly telemetry?: Telemetry }
   | { readonly adapter: 'postgres'; readonly connectionString?: string; readonly telemetry?: Telemetry }
   | { readonly adapter: 'd1'; readonly database: D1DatabaseBinding; readonly telemetry?: Telemetry };

export abstract class SqlDatabase {
  constructor(public readonly adapter: string) {}

  static create(options: Extract<SqlDatabaseOptions, { adapter: 'd1' }>): Promise<import('./adapters/d1/index.js').D1Database>;
  static create(options: Exclude<SqlDatabaseOptions, { adapter: 'd1' }>): Promise<SqlDatabase>;
  static async create(options: SqlDatabaseOptions): Promise<SqlDatabase> {
    if (options.adapter === 'sqlite') {
      const [{ default: Database }, { SqliteDatabase }] = await Promise.all([
        import('better-sqlite3'),
        import('./adapters/sqlite/index.js'),
      ]);
      return new SqliteDatabase(new Database(options.filename), options.telemetry);
    }

    if (options.adapter === 'postgres') {
      const [{ Pool }, { PostgresDatabase }] = await Promise.all([
        import('pg'),
        import('./adapters/postgres/index.js'),
      ]);
      const pool = options.connectionString
        ? new Pool({ connectionString: options.connectionString })
        : new Pool();
      return new PostgresDatabase(pool, options.telemetry);
    }

    if (options.adapter === 'd1') {
      const { D1Database } = await import('./adapters/d1/index.js');
       return new D1Database(options.database, options.telemetry);
    }

    throw new Error(`Unsupported SQL adapter: ${(options as { adapter: string }).adapter}`);
  }

  abstract query<T>(sql: string, parameters?: readonly SqlValue[]): Promise<readonly T[]>;
  abstract transaction<T>(work: (database: SqlDatabase) => Promise<T>): Promise<T>;
}
import type { Telemetry } from '../telemetry/index.js';
