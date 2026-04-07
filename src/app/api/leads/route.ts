import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { simpleRateLimit } from "@/lib/rate-limit";
import { getClientIp, isTrustedOrigin, sanitizeText } from "@/lib/security";
import { leadSchema } from "@/lib/validations";
import { sendLeadEmail } from "@/lib/mail";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    if (!isTrustedOrigin()) {
      return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
    }

    const ip = getClientIp();
    const rate = simpleRateLimit(`lead:${ip}`, 5, 60_000);
    if (!rate.success) {
      return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        fullName: sanitizeText(data.fullName),
        email: sanitizeText(data.email),
        phone: sanitizeText(data.phone),
        sourcePage: sanitizeText(data.sourcePage),
        message: sanitizeText(data.message || ""),
        birthYear: data.birthYear ? sanitizeText(data.birthYear) : null,
        address: sanitizeText(data.address || "")
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
    const adminEmail = setting?.notificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;

    await sendLeadEmail({
      to: adminEmail,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      sourcePage: lead.sourcePage,
      message: lead.message || ""
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead API error", error);
    return NextResponse.json({ error: "Không thể gửi form lúc này." }, { status: 500 });
  }
}
