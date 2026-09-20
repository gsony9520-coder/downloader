# Video Downloader

Free stack: **Next.js on Vercel** (frontend) + **Render** (yt-dlp worker) + **Turso** (database). No credit card needed.

```
User → Vercel site → /api/extract → Render worker /info → qualities
     → click quality → Render worker /download → file downloads
```

## 0. Push repo to GitHub

Render aur Vercel dono ko GitHub repo chahiye:

```bash
git init && git add -A && git commit -m "init"
# GitHub par naya repo banao, phir:
git remote add origin https://github.com/<you>/downloader.git
git push -u origin main
```

## 1. Deploy worker to Render (free, no card)

1. https://render.com → sign up with GitHub
2. **New → Web Service** → repo select karo
3. Settings:
   - **Root Directory:** `worker`
   - **Runtime:** Docker (auto-detected from Dockerfile)
   - **Instance Type:** Free
4. Deploy. URL milega: `https://<name>.onrender.com`
5. Test: `https://<name>.onrender.com/health` → `{"ok": true}`

⚠️ Free tier 15 min inactivity ke baad **sleep** ho jata hai — pehla request ~30-60s lega (cold start), phir normal.

## 2. Create Turso database (free)

```bash
# install CLI (Windows: powershell)
irm https://get.tur.so/install.ps1 | iex

turso auth signup        # free account
turso db create downloader
turso db show downloader --url        # → libsql://downloader-xxx.turso.io
turso db tokens create downloader     # → auth token
```

Or do it from the Turso web dashboard — no CLI needed.

## 3. Deploy web to Vercel (free)

1. Push this repo to GitHub
2. https://vercel.com → Add New Project → import repo → set **Root Directory** to `web`
3. Add Environment Variables:
   - `WORKER_URL` = your Render URL (step 1, e.g. `https://video-dl.onrender.com`)
   - `TURSO_DATABASE_URL` = libsql://... (step 2)
   - `TURSO_AUTH_TOKEN` = token (step 2)
4. Deploy

## Local dev

```bash
cd web
# fill in .env.local with WORKER_URL + Turso values
npm run dev
```

## Notes / limits

- Render free tier **sleeps** after 15 min — first request takes ~30-60s to wake
- YouTube sometimes blocks datacenter IPs. If `Sign in to confirm you're not a bot` errors appear, add a `cookies.txt` to the worker and pass `--cookies cookies.txt` in `app.py`
- Rate limit: 30 extracts/hour per IP (edit `RATE_LIMIT` in `web/app/api/extract/route.ts`)
