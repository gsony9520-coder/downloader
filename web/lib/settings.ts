import { db } from "./db";

export type Settings = {
  siteTitle: string;
  logo: string;
  favicon: string;
  tagline: string;
};

export const DEFAULT_SETTINGS: Settings = {
  siteTitle: "SGM Downloader",
  logo: "↓",
  favicon: "",
  tagline: "Paste a link, pick a quality, download.",
};

let tableReady: Promise<unknown> | null = null;

async function ensureTable() {
  if (!db) return;
  if (!tableReady) {
    tableReady = db.execute(
      "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );
  }
  await tableReady;
}

export async function getSettings(): Promise<Settings> {
  if (!db) {
    console.warn("Database not configured, using default settings");
    return DEFAULT_SETTINGS;
  }
  try {
    await ensureTable();
    const { rows } = await db.execute("SELECT key, value FROM settings");
    const map: Record<string, string> = {};
    for (const r of rows) map[String(r.key)] = String(r.value);
    return { ...DEFAULT_SETTINGS, ...map };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<Settings>) {
  if (!db) {
    throw new Error("Database not configured. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.");
  }
  await ensureTable();
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    await db.execute({
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [key, String(value)],
    });
  }
}
