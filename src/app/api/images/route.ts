import { NextResponse } from "next/server";
import { db } from "@/db";
import { warehubImages } from "@/db/schema";

export const dynamic = "force-dynamic";

/** ~9 MB of base64 text — beyond that the client should downscale first. */
const MAX_B64_CHARS = 9_000_000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lotId = String(body?.lotId || "").trim();
    let dataB64 = String(body?.dataB64 || "").trim();
    const position = Number(body?.position) || 0;

    // Accept both raw base64 and a full `data:image/...;base64,` payload.
    let mime = String(body?.mime || "").trim();
    const marker = "base64,";
    const markerIdx = dataB64.indexOf(marker);
    if (markerIdx !== -1) {
      const header = dataB64.slice(0, markerIdx);
      dataB64 = dataB64.slice(markerIdx + marker.length).trim();
      if (!mime) mime = header.replace(/^data:/i, "").split(";")[0] || "";
    }
    if (!mime) mime = "image/jpeg";

    if (!lotId || !dataB64) {
      return NextResponse.json({ error: "lotId and dataB64 are required" }, { status: 400 });
    }
    if (dataB64.length > MAX_B64_CHARS) {
      return NextResponse.json(
        { error: "Image is too large — use a photo under 6 MB" },
        { status: 413 },
      );
    }
    if (!/^[\w+/=\s]+$/.test(dataB64)) {
      return NextResponse.json({ error: "dataB64 must be base64 encoded" }, { status: 400 });
    }

    const inserted = await db
      .insert(warehubImages)
      .values({ lotId, mime, dataB64, position })
      .returning();

    return NextResponse.json(
      { id: inserted[0].id, url: `/api/image?id=${inserted[0].id}` },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to store image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
