import { isAdmin } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await getSettings());
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const allowed = ["siteTitle", "logo", "favicon", "tagline"] as const;
  const patch: Record<string, string> = {};
  for (const k of allowed) {
    if (typeof body[k] === "string") patch[k] = body[k].slice(0, 500);
  }
  try {
    await saveSettings(patch);
  } catch {
    return Response.json({ error: "Database not configured" }, { status: 500 });
  }
  return Response.json(await getSettings());
}
