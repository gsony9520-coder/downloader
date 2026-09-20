import { YtDlp } from "ytdlp-nodejs";
import ffmpegPath from "ffmpeg-static";

let instance: YtDlp | null = null;

export function getYtDlp(): YtDlp {
  if (!instance) {
    instance = new YtDlp({ ffmpegPath: ffmpegPath ?? undefined });
  }
  return instance;
}
