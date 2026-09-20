import { isAdmin } from "@/lib/auth";

export const maxDuration = 10;

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "logo" or "favicon"

    if (!file || !type) {
      return Response.json({ error: "Missing file or type" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "File must be an image" }, { status: 400 });
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return Response.json({ dataUrl });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}
