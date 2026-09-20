import crypto from "node:crypto";

export function adminToken(): string | null {
  const user = process.env.ADMIN_USERNAME;
  const pw = process.env.ADMIN_PASSWORD;
  if (!user || !pw) return null;
  return crypto
    .createHash("sha256")
    .update(`sgm:${user}:${pw}`)
    .digest("hex");
}

export function isAdmin(request: Request): boolean {
  const token = adminToken();
  if (!token) return false;
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(/;\s*/).includes(`sgm_admin=${token}`);
}
