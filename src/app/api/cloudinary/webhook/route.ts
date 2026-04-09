import { NextResponse } from "next/server";

import { simpleRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const configuredSecret = process.env.CLOUDINARY_WEBHOOK_SIGNING_SECRET?.trim();
  if (!configuredSecret) {
    return NextResponse.json({ error: "Webhook chưa được cấu hình." }, { status: 503 });
  }

  const candidateSecret = req.headers.get("x-ecolingua-webhook-secret")?.trim();
  if (!candidateSecret || candidateSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = await simpleRateLimit(`cloudinary-webhook:${ip}`, 60, 60_000);
  if (!rate.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Keep structured log lines so alerts can be parsed in Vercel logs.
  console.warn("[cloudinary-webhook]", JSON.stringify(payload));
  return NextResponse.json({ ok: true });
}
