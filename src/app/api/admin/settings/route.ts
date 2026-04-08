import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { adminSettingSchema } from "@/lib/validations";
import { isTrustedOrigin } from "@/lib/security";
import { normalizeGoogleFormLink } from "@/lib/google-forms";

function isSchemaMismatchError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes("googleFormUrl") || message.includes("column") || message.includes("P2022");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const setting = await prisma.adminSetting.findUnique({ where: { id: "main" } });
    return NextResponse.json(setting);
  } catch (error) {
    if (!isSchemaMismatchError(error)) throw error;
    const legacySetting = await prisma.adminSetting.findUnique({
      where: { id: "main" },
      select: { id: true, notificationEmail: true, siteMeta: true, updatedAt: true }
    });
    return NextResponse.json({
      ...legacySetting,
      googleFormUrl: null,
      schemaWarning:
        "Database chưa cập nhật migration mới cho googleFormUrl. Hãy chạy prisma migrate deploy trên production."
    });
  }
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

  let setting;
  try {
    setting = await prisma.adminSetting.upsert({
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
  } catch (error) {
    if (!isSchemaMismatchError(error)) throw error;
    return NextResponse.json(
      {
        error:
          "Database production chưa chạy migration mới. Vui lòng chạy `prisma migrate deploy` rồi thử lưu lại Google Form."
      },
      { status: 503 }
    );
  }

  return NextResponse.json(setting);
}
