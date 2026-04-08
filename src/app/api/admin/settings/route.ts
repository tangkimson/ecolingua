import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { adminSettingSchema } from "@/lib/validations";
import { isTrustedOrigin } from "@/lib/security";
import { normalizeGoogleFormLink } from "@/lib/google-forms";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.adminSetting.findUnique({ where: { id: "main" } });
  return NextResponse.json(setting);
}

export async function PUT(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = adminSettingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let normalizedGoogleForm;
  try {
    normalizedGoogleForm = await normalizeGoogleFormLink(parsed.data.googleFormUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Form URL không hợp lệ." },
      { status: 400 }
    );
  }

  const setting = await prisma.adminSetting.upsert({
    where: { id: "main" },
    update: {
      notificationEmail: parsed.data.notificationEmail,
      googleFormUrl: normalizedGoogleForm.embedUrl
    },
    create: {
      id: "main",
      notificationEmail: parsed.data.notificationEmail,
      googleFormUrl: normalizedGoogleForm.embedUrl
    }
  });

  return NextResponse.json(setting);
}
