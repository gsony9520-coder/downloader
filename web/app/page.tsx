"use client";

import { useState } from "react";

type Quality = { height: number; label: string; size_mb: number | null };

type VideoInfo = {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  platform: string | null;
  qualities: Quality[];
  worker: string;
};

function fmtDuration(s: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);

  async function fetchInfo(e?: React.FormEvent) {
    e?.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch video");
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function downloadUrl(params: Record<string, string | number>) {
    const q = new URLSearchParams({
      url: url.trim(),
      title: info?.title ?? "video",
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });
    return `${info?.worker}/download?${q}`;
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-center text-4xl font-bold tracking-tight">
          Video Downloader
        </h1>
        <p className="mt-3 text-center text-zinc-500 dark:text-zinc-400">
          YouTube, TikTok, Instagram aur Facebook — link paste karo, download karo.
        </p>

        <form onSubmit={fetchInfo} className="mt-8 flex gap-2">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "…" : "Download"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {info && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {info.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.thumbnail}
                alt={info.title}
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="font-semibold leading-snug">{info.title}</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {[info.platform, info.uploader, fmtDuration(info.duration)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {info.qualities.map((q) => (
                  <a
                    key={q.height}
                    href={downloadUrl({ height: q.height })}
                    className="rounded-lg border border-zinc-300 px-3 py-2.5 text-center text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {q.label}
                    {q.size_mb && (
                      <span className="block text-xs font-normal text-zinc-500">
                        ~{q.size_mb} MB
                      </span>
                    )}
                  </a>
                ))}
                <a
                  href={downloadUrl({ audio: 1 })}
                  className="rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-500"
                >
                  MP3
                  <span className="block text-xs font-normal text-emerald-100">
                    Audio only
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-zinc-400">
          Sirf wo content download karein jiska haq aapko hai.
        </p>
      </div>
    </main>
  );
}
