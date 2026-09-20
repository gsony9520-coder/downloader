import { adminToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = adminToken();
  if (!token) {
    return Response.json(
      { error: "ADMIN_PASSWORD env var not set" },
      { status: 500 },
    );
  }
  let password: string;
  try {
    password = (await request.json()).password;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (password !== expected) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `sgm_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
    },
  });
}
