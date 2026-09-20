import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = url ? createClient({ url, authToken }) : null;

let initPromise: Promise<unknown> | null = null;

export function ensureDb() {
  if (!db) return Promise.resolve();
  if (!initPromise) {
    initPromise = db.execute(`
      CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        platform TEXT,
        created_at INTEGER NOT NULL
      )
    `);
  }
  return initPromise;
}
