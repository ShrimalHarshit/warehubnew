import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { warehubImages } from "@/db/schema";

export const dynamic = "force-dynamic";

function decodeBase64(dataB64: string, mime: string): Buffer | null {
  let raw = dataB64 || "";
  const marker = "base64,";
  const idx = raw.indexOf(marker);
  if (idx !== -1) raw = raw.slice(idx + marker.length);
  else if (raw.startsWith("data:")) raw = "";
  raw = raw.replace(/\s+/g, "");
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 0) return null;
    return buf;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(warehubImages)
      .where(eq(warehubImages.id, id))
      .limit(1);

    if (rows.length === 0) {
      return new Response("Not found", { status: 404 });
    }

    const row = rows[0];
    const buf = decodeBase64(row.dataB64, row.mime);
    if (!buf) {
      return new Response("Corrupt image data", { status: 422 });
    }

    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": row.mime || "image/jpeg",
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
