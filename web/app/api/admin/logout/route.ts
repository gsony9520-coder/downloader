export async function POST(request: Request) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `sgm_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}
