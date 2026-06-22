import { createClient, Client, ResultSet, InValue } from '@libsql/client';

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL environment variable is not set');
  _client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return _client;
}

export function toRows<T = Record<string, unknown>>(rs: ResultSet): T[] {
  return rs.rows.map(r => ({ ...r }) as T);
}

export function firstRow<T = Record<string, unknown>>(rs: ResultSet): T | null {
  return rs.rows.length > 0 ? ({ ...rs.rows[0] } as T) : null;
}

export type { InValue };
export default getDb;
