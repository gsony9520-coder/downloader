import { headers } from "next/headers";
import { db, ensureDb } from "@/lib/db";

const WORKER_URL = process.env.WORKER_URL;
const RATE_LIMIT = 30; // requests per hour per IP
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!WORKER_URL) {
    return Response.json({ error: "Server not configured" }, { status: 500 });
  }

  let url: string;
  try {
    url = (await request.json()).url;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof url !== "string" || !url.startsWith("http")) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await ensureDb();
    if (db) {
      const { rows } = await db.execute({
        sql: "SELECT COUNT(*) AS c FROM downloads WHERE ip = ? AND created_at > ?",
        args: [ip, Date.now() - WINDOW_MS],
      });
      if (Number(rows[0].c) >= RATE_LIMIT) {
        return Response.json(
          { error: "Rate limit reached. Try again later." },
          { status: 429 },
        );
      }
    }
  } catch {
    // DB down — don't block the user
  }

  const res = await fetch(`${WORKER_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(95_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return Response.json(
      { error: data.detail ?? "Could not fetch video info" },
      { status: res.status },
    );
  }

  if (db) {
    db.execute({
      sql: "INSERT INTO downloads (ip, url, title, platform, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [ip, url, data.title ?? null, data.platform ?? null, Date.now()],
    }).catch(() => {});
  }

  return Response.json({ ...data, worker: WORKER_URL });
}
