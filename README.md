# Video Downloader

100% free stack — sab kuch **Vercel** par, database **Turso** par. No credit card.

```
User → Vercel site → /api/extract (yt-dlp) → qualities
     → click quality → /api/download → MP4/MP3 file
```

- `web/` — Next.js app (frontend + yt-dlp/ffmpeg serverless functions)
- `worker/` — optional FastAPI worker (abhi use nahi ho raha; agar kabhi Render/Docker host karna ho to ready hai)

## 1. Turso database (free)

https://turso.tech → sign up → Create Database → `downloader`

Phir database details se:
- **URL** → `libsql://downloader-xxx.turso.io`
- **Create Token** → auth token

## 2. Vercel deploy (free, no card)

1. Repo GitHub par already hai: `github.com/gsony9520-coder/downloader`
2. https://vercel.com → sign up with GitHub → **Add New → Project** → repo import
3. **Root Directory:** `web`
4. Environment Variables:
   - `TURSO_DATABASE_URL` = libsql://... (step 1)
   - `TURSO_AUTH_TOKEN` = token (step 1)
5. Deploy — done!

## Local dev

```bash
cd web
# .env.local mein Turso values daalo (optional — bina DB ke bhi chalta hai)
npm run dev
```

## Notes / limits

- Vercel free tier par function **60s timeout** hai — bohat lambi/heavy videos timeout ho sakti hain. Normal videos (reels, songs, shorts) theek chalti hain
- YouTube kabhi kabhi datacenter IPs par "Sign in to confirm you're not a bot" maangta hai — agar ho to `cookies.txt` ka option code mein pehle se support hai
- Rate limit: 30 extracts/hour per IP (`web/app/api/extract/route.ts` mein `RATE_LIMIT`)
