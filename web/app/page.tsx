"use client";

import { useEffect, useState } from "react";

type Quality = { height: number; label: string; size_mb: number | null };

type VideoInfo = {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  platform: string | null;
  qualities: Quality[];
};

type Settings = {
  siteTitle: string;
  logo: string;
  favicon: string;
  tagline: string;
};

const PLATFORMS = [
  {
    name: "YouTube",
    color: "bg-red-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23 7.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.6 3.5 12 3.5 12 3.5s-4.6 0-7.7.4c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.1.8 11v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 7.5.4 7.5.4s4.6 0 7.7-.4c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8zM9.7 15.1V8.4l6.2 3.4-6.2 3.3z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    color: "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.6 5.8a4.8 4.8 0 0 1-3.4-3.9V1h-3.5v13.7a2.9 2.9 0 1 1-2-2.7V8.3a6.4 6.4 0 1 0 5.5 6.4V8.6a8.2 8.2 0 0 0 4.6 1.4V6.5a4.8 4.8 0 0 1-1.2-.7z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    color: "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    color: "bg-blue-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M13.5 21v-7.9h2.7l.4-3.1h-3.1V8c0-.9.2-1.5 1.6-1.5h1.6V3.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H7.5v3.1h2.7V21h3.3z" />
      </svg>
    ),
  },
];

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
  const [settings, setSettings] = useState<Settings>({
    siteTitle: "SGM Downloader",
    logo: "↓",
    favicon: "",
    tagline: "Paste a link, pick a quality, download.",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setSettings((prev) => ({ ...prev, ...s }));
        if (s.siteTitle) document.title = s.siteTitle;
        if (s.favicon) {
          let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = s.favicon;
        }
      })
      .catch(() => {});
  }, []);

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
    return `/api/download?${q}`;
  }

  const isImage = settings.logo.startsWith("http");

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-emerald-600 text-sm text-white">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logo} alt="logo" className="h-full w-full object-cover" />
              ) : (
                settings.logo
              )}
            </span>
            {settings.siteTitle}
          </a>
          <a
            href="/admin"
            title="Admin"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
          </a>
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-14">
        <h1 className="text-center text-4xl font-bold tracking-tight">
          Download any video
        </h1>
        <p className="mt-3 text-center text-zinc-500 dark:text-zinc-400">
          {settings.tagline}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          {PLATFORMS.map((p) => (
            <span
              key={p.name}
              title={p.name}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${p.color}`}
            >
              {p.icon}
            </span>
          ))}
        </div>

        <form onSubmit={fetchInfo} className="mt-6 flex gap-2">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste video link here…"
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
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-xs text-white">
              {isImage ? "↓" : settings.logo}
            </span>
            {settings.siteTitle}
          </div>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
