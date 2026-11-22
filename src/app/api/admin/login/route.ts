import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id, pass } = await request.json();
    const validId = process.env.ADMIN_ID || "admin";
    const validPass = process.env.ADMIN_PASS || "warehub2026";
    
    if (id === validId && pass === validPass) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
