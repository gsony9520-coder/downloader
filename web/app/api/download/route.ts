import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { getYtDlp } from "@/lib/ytdlp";

export const maxDuration = 60; // hobby plan cap

function sanitize(name: string) {
  const s = name.replace(/[<>:"/\\|?*\x00-\x1f"]/g, "").trim().slice(0, 80);
  return s || "video";
}

function contentDisposition(title: string, ext: string) {
  const ascii = sanitize(title).replace(/[^\x20-\x7e]/g, "_") || "video";
  const utf8 = encodeURIComponent(sanitize(title));
  return `attachment; filename="${ascii}.${ext}"; filename*=UTF-8''${utf8}.${ext}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  const height = Number(searchParams.get("height")) || null;
  const audio = searchParams.get("audio") === "1";
  const title = searchParams.get("title") ?? "video";

  if (!url.startsWith("http")) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
  const cleanup = () => fs.rm(tmp, { recursive: true, force: true }, () => {});

  try {
    const builder = getYtDlp()
      .download(url)
      .output(tmp)
      .addArgs("--no-playlist", "--no-warnings");

    if (audio) {
      builder.addArgs("-x", "--audio-format", "mp3", "--audio-quality", "0");
    } else {
      const sel = height
        ? `bv*[height<=${height}]+ba/b[height<=${height}]/b`
        : "bv*+ba/b";
      builder.addArgs("-f", sel, "--merge-output-format", "mp4");
    }

    const result = await builder.run();
    const file =
      result.filePaths[0] ??
      fs.readdirSync(tmp).map((f) => path.join(tmp, f))[0];
    if (!file || !fs.existsSync(file)) {
      throw new Error("No output file produced");
    }

    const stat = fs.statSync(file);
    const ext = path.extname(file).slice(1) || "mp4";
    const nodeStream = fs.createReadStream(file);
    nodeStream.on("close", cleanup);
    nodeStream.on("error", cleanup);

    return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
      headers: {
        "Content-Type": audio ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": contentDisposition(title, ext),
        "Content-Length": String(stat.size),
      },
    });
  } catch (e) {
    cleanup();
    return Response.json(
      { error: e instanceof Error ? e.message : "Download failed" },
      { status: 500 },
    );
  }
}
