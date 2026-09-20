import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ytdlp-nodejs", "ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/ytdlp-nodejs/bin/**",
      "./node_modules/ffmpeg-static/**",
    ],
  },
};

export default nextConfig;
