import { NextResponse } from "next/server";
import { clearVoiceDemoSessionCookie } from "@/lib/voice-demo-session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearVoiceDemoSessionCookie(res);
  return res;
}
