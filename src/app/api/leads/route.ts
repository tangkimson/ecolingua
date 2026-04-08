import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { simpleRateLimit } from "@/lib/rate-limit";
import { getClientIp, isTrustedOrigin, sanitizeText } from "@/lib/security";
import { leadSchema } from "@/lib/validations";
import { sendLeadEmail } from "@/lib/mail";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/constants";

const LEAD_STATUSES = new Set(["NEW", "IN_REVIEW", "CONTACTED", "RESOLVED", "ARCHIVED", "SPAM"]);

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const source = searchParams.get("source")?.trim();
  const includeArchived = searchParams.get("includeArchived") === "true";

  const where = {
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(source ? { sourcePage: source } : {}),
    ...(status && LEAD_STATUSES.has(status) ? { status } : {}),
    ...(!includeArchived && !status ? { status: { not: "ARCHIVED" } } : {})
  };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  try {
    if (!isTrustedOrigin()) {
      return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
    }

    const ip = getClientIp();
    const rate = await simpleRateLimit(`lead:${ip}`, 5, 60_000);
    if (!rate.success) {
      return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const sourcePage = sanitizeText(data.sourcePage.toLowerCase());
    // Honeypot: bots usually fill hidden fields. Return success-like response to avoid probing.
    if (data.website) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const normalizedEmail = sanitizeText(data.email.toLowerCase());
    const normalizedPhone = sanitizeText(data.phone.replace(/\s+/g, ""));
    const duplicateWindow = new Date(Date.now() - 10 * 60_000);
    const existingLead = await prisma.lead.findFirst({
      where: {
        email: normalizedEmail,
        phone: normalizedPhone,
        sourcePage,
        createdAt: {
          gte: duplicateWindow
        }
      },
      select: { id: true }
    });

    if (existingLead) {
      return NextResponse.json(
        { error: "Bạn đã gửi đăng ký gần đây. Vui lòng chờ đội ngũ phản hồi hoặc thử lại sau ít phút." },
        { status: 409 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        fullName: sanitizeText(data.fullName),
        email: normalizedEmail,
        phone: normalizedPhone,
        sourcePage,
        message: sanitizeText(data.message || ""),
        birthYear: data.birthYear ? sanitizeText(data.birthYear) : null,
        address: sanitizeText(data.address || ""),
        status: "NEW"
      }
    });

    await prisma.adminNotification.create({
      data: {
        type: "NEW_LEAD",
        payload: JSON.stringify({
          leadId: lead.id,
          fullName: lead.fullName,
          sourcePage: lead.sourcePage
        })
      }
    });

    const setting = await prisma.adminSetting.findUnique({ where: { id: "main" } });
    const adminEmailList = [
      setting?.notificationEmail,
      process.env.ADMIN_NOTIFICATION_EMAIL,
      ...(process.env.ADMIN_NOTIFICATION_EMAILS || "").split(","),
      DEFAULT_ADMIN_EMAIL
    ]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);

    let emailSent = true;
    try {
      await sendLeadEmail({
        to: Array.from(new Set(adminEmailList)),
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        sourcePage: lead.sourcePage,
        birthYear: lead.birthYear || undefined,
        address: lead.address || undefined,
        message: lead.message || ""
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Lead email error", emailError);
      await prisma.adminNotification.create({
        data: {
          type: "LEAD_EMAIL_FAILED",
          payload: JSON.stringify({
            leadId: lead.id,
            sourcePage: lead.sourcePage
          })
        }
      });
    }

    return NextResponse.json({ success: true, leadId: lead.id, emailSent }, { status: 201 });
  } catch (error) {
    console.error("Lead API error", error);
    return NextResponse.json({ error: "Không thể gửi form lúc này." }, { status: 500 });
  }
}
