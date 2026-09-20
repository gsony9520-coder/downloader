---
title: Video Downloader Worker
emoji: ⬇️
sdk: docker
app_port: 7860
pinned: false
---

FastAPI worker that wraps `yt-dlp` + `ffmpeg`.

Endpoints:
- `POST /info` — `{ "url": "..." }` → title, thumbnail, available qualities
- `GET /download?url=...&height=720` — streams merged MP4
- `GET /download?url=...&audio=1` — streams MP3
- `GET /health`
