import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { faqSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

type Context = { params: { id: string } };

const faqPublishSchema = z.object({
  published: z.boolean()
});

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingFaq = await prisma.faq.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existingFaq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

  const body = await req.json();
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const faq = await prisma.faq.update({
    where: { id: params.id },
    data: parsed.data
  });

  return NextResponse.json(faq);
}

export async function PATCH(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingFaq = await prisma.faq.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existingFaq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

  const body = await req.json();
  const parsed = faqPublishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const faq = await prisma.faq.update({
    where: { id: params.id },
    data: {
      published: parsed.data.published
    }
  });

  return NextResponse.json(faq);
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingFaq = await prisma.faq.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existingFaq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

  await prisma.faq.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
