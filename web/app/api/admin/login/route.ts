import { adminToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = adminToken();
  if (!token) {
    return Response.json(
      { error: "ADMIN_USERNAME / ADMIN_PASSWORD env vars not set" },
      { status: 500 },
    );
  }
  let username: string, password: string;
  try {
    ({ username, password } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return Response.json({ error: "Wrong username or password" }, { status: 401 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `sgm_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
    },
  });
}
