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
  const [password, setPassword] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

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
      body: JSON.stringify({ password }),
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

  const field = (
    label: string,
    key: keyof Settings,
    hint: string,
  ) => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={settings?.[key] ?? ""}
        onChange={(e) =>
          setSettings((s) => (s ? { ...s, [key]: e.target.value } : s))
        }
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
      />
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
              Enter your admin password (<code>ADMIN_PASSWORD</code> env var).
            </p>
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
            {field("Logo", "logo", "Emoji/text shown in the badge, or an image URL.")}
            {field("Favicon URL", "favicon", "Image URL for the browser tab icon. Leave empty for default.")}
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
