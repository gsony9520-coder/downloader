"use client";

import { useEffect, useState } from "react";

type Settings = {
  siteTitle: string;
  logo: string;
  favicon: string;
  tagline: string;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (r.ok) {
          setSettings(await r.json());
          setAuthed(true);
        } else setAuthed(false);
      })
      .catch(() => setAuthed(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (r.ok) {
      const s = await fetch("/api/admin/settings").then((x) => x.json());
      setSettings(s);
      setAuthed(true);
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(d.error || "Login failed");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setBusy(false);
    if (r.ok) {
      setSettings(await r.json());
      setMsg("Saved. Refresh the site to see changes.");
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(d.error || "Save failed");
    }
  }

  async function uploadFile(file: File, type: "logo" | "favicon") {
    setUploading(type);
    setMsg("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const r = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(null);

    if (r.ok) {
      const { dataUrl } = await r.json();
      setSettings((s) => s ? { ...s, [type]: dataUrl } : s);
      setMsg(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully!`);
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(d.error || "Upload failed");
    }
  }

  const field = (
    label: string,
    key: keyof Settings,
    hint: string,
    isImage: boolean = false,
  ) => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {isImage ? (
        <div className="mt-1 space-y-2">
          <div className="flex gap-2">
            <input
              value={settings?.[key] ?? ""}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, [key]: e.target.value } : s))
              }
              placeholder="Or paste image URL..."
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, key as "logo" | "favicon");
              }}
              disabled={uploading === key}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          {settings?.[key] && (
            <div className="flex items-center gap-2">
              <img
                src={settings[key]}
                alt={label}
                className="h-10 w-10 rounded object-cover border border-zinc-200"
              />
              <button
                type="button"
                onClick={() => setSettings((s) => s ? { ...s, [key]: "" } : s)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <input
          value={settings?.[key] ?? ""}
          onChange={(e) =>
            setSettings((s) => (s ? { ...s, [key]: e.target.value } : s))
          }
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}
      <span className="text-xs text-zinc-500">{hint}</span>
    </label>
  );

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        {authed === null && <p className="mt-4 text-sm text-zinc-500">Loading…</p>}

        {authed === false && (
          <form onSubmit={login} className="mt-6 space-y-3">
            <p className="text-sm text-zinc-500">
              Enter your admin credentials (<code>ADMIN_USERNAME</code> /{" "}
              <code>ADMIN_PASSWORD</code> env vars).
            </p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              disabled={busy}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {busy ? "…" : "Login"}
            </button>
          </form>
        )}

        {authed && settings && (
          <form onSubmit={save} className="mt-6 space-y-4">
            {field("Site title", "siteTitle", "Shown in the header and browser tab.")}
            {field("Logo", "logo", "Upload an image or paste URL (shown in header badge).", true)}
            {field("Favicon", "favicon", "Upload an image or paste URL (browser tab icon).", true)}
            {field("Tagline", "tagline", "Small text under the main heading.")}
            <button
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy ? "…" : "Save changes"}
            </button>
          </form>
        )}

        {msg && (
          <p className="mt-4 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            {msg}
          </p>
        )}

        <a href="/" className="mt-8 inline-block text-sm text-zinc-500 hover:underline">
          ← Back to site
        </a>
      </div>
    </main>
  );
}
