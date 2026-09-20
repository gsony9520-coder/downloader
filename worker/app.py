import asyncio
import json
import os
import re
import shutil
import tempfile
import time

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

app = FastAPI(title="Video Downloader Worker")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Limit simultaneous downloads so the free CPU doesn't melt.
download_sem = asyncio.Semaphore(2)

INFO_TIMEOUT = 90
DOWNLOAD_TIMEOUT = 900
TMP_ROOT = "/tmp/downloads"


class InfoRequest(BaseModel):
    url: str


@app.get("/health")
def health():
    return {"ok": True}


def run_ytdlp(args: list[str], timeout: int) -> subprocess.CompletedProcess:
    import subprocess

    return subprocess.run(
        ["yt-dlp", *args],
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def parse_qualities(meta: dict) -> list[dict]:
    """Extract a clean list of video heights that actually exist."""
    heights: dict[int, dict] = {}
    for f in meta.get("formats") or []:
        h = f.get("height")
        if not h or f.get("vcodec") in (None, "none"):
            continue
        size = f.get("filesize") or f.get("filesize_approx")
        cur = heights.get(h)
        if cur is None or (size and size > (cur.get("size") or 0)):
            heights[h] = {"height": h, "size": size}
    return [
        {"height": h, "label": f"{h}p", "size_mb": round(v["size"] / 1e6, 1) if v["size"] else None}
        for h, v in sorted(heights.items(), key=lambda kv: -kv[0])
    ]


@app.post("/info")
async def info(req: InfoRequest):
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(400, "Invalid URL")

    try:
        proc = await asyncio.to_thread(
            run_ytdlp,
            ["-J", "--no-playlist", "--no-warnings", url],
            INFO_TIMEOUT,
        )
    except Exception as e:
        raise HTTPException(504, f"Extraction timed out: {e}")

    if proc.returncode != 0:
        raise HTTPException(422, (proc.stderr or "Extraction failed").strip()[-500:])

    meta = json.loads(proc.stdout)
    return {
        "title": meta.get("title"),
        "thumbnail": meta.get("thumbnail"),
        "duration": meta.get("duration"),
        "uploader": meta.get("uploader") or meta.get("channel"),
        "platform": meta.get("extractor_key"),
        "qualities": parse_qualities(meta),
        "has_audio": True,
    }


def sanitize(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", name or "video").strip()
    return name[:80] or "video"


@app.get("/download")
async def download(
    url: str = Query(...),
    height: int | None = Query(None),
    audio: int = Query(0),
    title: str = Query("video"),
):
    if not url.startswith(("http://", "https://")):
        raise HTTPException(400, "Invalid URL")

    await download_sem.acquire()
    workdir = tempfile.mkdtemp(dir=TMP_ROOT, prefix="dl_")
    outtmpl = os.path.join(workdir, "out.%(ext)s")

    try:
        if audio:
            args = ["-x", "--audio-format", "mp3", "--audio-quality", "0"]
        elif height:
            args = [
                "-f", f"bv*[height<={height}]+ba/b[height<={height}]/b",
                "--merge-output-format", "mp4",
            ]
        else:
            args = ["-f", "bv*+ba/b", "--merge-output-format", "mp4"]

        args += ["--no-playlist", "--no-warnings", "-o", outtmpl, url]

        try:
            proc = await asyncio.to_thread(run_ytdlp, args, DOWNLOAD_TIMEOUT)
        except Exception as e:
            shutil.rmtree(workdir, ignore_errors=True)
            raise HTTPException(504, f"Download timed out: {e}")

        if proc.returncode != 0:
            shutil.rmtree(workdir, ignore_errors=True)
            raise HTTPException(422, (proc.stderr or "Download failed").strip()[-500:])

        files = [f for f in os.listdir(workdir) if f.startswith("out.")]
        if not files:
            shutil.rmtree(workdir, ignore_errors=True)
            raise HTTPException(500, "No output file produced")

        path = os.path.join(workdir, files[0])
        ext = files[0].rsplit(".", 1)[-1]
        filename = f"{sanitize(title)}.{ext}"

        def cleanup():
            download_sem.release()
            shutil.rmtree(workdir, ignore_errors=True)

        return FileResponse(
            path,
            media_type="application/octet-stream",
            filename=filename,
            background=BackgroundTask(cleanup),
        )
    except HTTPException:
        download_sem.release()
        raise
    except Exception as e:
        download_sem.release()
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(500, str(e))


@app.on_event("startup")
def startup():
    os.makedirs(TMP_ROOT, exist_ok=True)
