import { headers } from "next/headers";
import { db, ensureDb } from "@/lib/db";
import { getYtDlp } from "@/lib/ytdlp";

const RATE_LIMIT = 30; // requests per hour per IP
const WINDOW_MS = 60 * 60 * 1000;

export const maxDuration = 60;

type Format = {
  height?: number | null;
  vcodec?: string | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  tbr?: number | null;
};

function parseQualities(formats: Format[] | undefined, duration?: number | null) {
  const heights = new Map<number, number | null>();
  for (const f of formats ?? []) {
    if (!f.height || !f.vcodec || f.vcodec === "none") continue;
    const size =
      f.filesize ??
      f.filesize_approx ??
      (f.tbr && duration ? (f.tbr * duration * 125) : null);
    const cur = heights.get(f.height);
    if (cur === undefined || (size && size > (cur ?? 0))) heights.set(f.height, size);
  }
  return [...heights.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([height, size]) => ({
      height,
      label: `${height}p`,
      size_mb: size ? Math.round(size / 1e5) / 10 : null,
    }));
}

export async function POST(request: Request) {
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

  let meta;
  try {
    meta = await getYtDlp().getInfoAsync(url);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not fetch video info" },
      { status: 422 },
    );
  }

  if (db) {
    db.execute({
      sql: "INSERT INTO downloads (ip, url, title, platform, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [
        ip,
        url,
        meta.title ?? null,
        ("extractor_key" in meta ? meta.extractor_key : null) ?? null,
        Date.now(),
      ],
    }).catch(() => {});
  }

  return Response.json({
    title: meta.title,
    thumbnail: "thumbnail" in meta ? meta.thumbnail : null,
    duration: "duration" in meta ? meta.duration : null,
    uploader: "uploader" in meta ? (meta.uploader ?? meta.channel) : null,
    platform: "extractor_key" in meta ? meta.extractor_key : null,
    qualities: parseQualities(
      "formats" in meta ? (meta.formats as Format[]) : undefined,
      "duration" in meta ? meta.duration : null,
    ),
  });
}
