import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { cuidParamSchema, faqSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

type Context = { params: { id: string } };

const faqPublishSchema = z.object({
  published: z.boolean()
});

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  const idParsed = cuidParamSchema.safeParse(params.id);
  if (!idParsed.success) return NextResponse.json({ error: "ID FAQ không hợp lệ." }, { status: 400 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingFaq = await prisma.faq.findUnique({
    where: { id: idParsed.data },
    select: { id: true }
  });
  if (!existingFaq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const faq = await prisma.faq.update({
    where: { id: idParsed.data },
    data: parsed.data
  });

  revalidatePath("/tham-gia");
  revalidatePath("/lien-he");
  revalidatePath("/admin/faqs");

  return NextResponse.json(faq);
}

export async function PATCH(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  const idParsed = cuidParamSchema.safeParse(params.id);
  if (!idParsed.success) return NextResponse.json({ error: "ID FAQ không hợp lệ." }, { status: 400 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingFaq = await prisma.faq.findUnique({
    where: { id: idParsed.data },
    select: { id: true }
  });
  if (!existingFaq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const parsed = faqPublishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const faq = await prisma.faq.update({
    where: { id: idParsed.data },
    data: {
      published: parsed.data.published
    }
  });

  revalidatePath("/tham-gia");
  revalidatePath("/lien-he");
  revalidatePath("/admin/faqs");

  return NextResponse.json(faq);
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  const idParsed = cuidParamSchema.safeParse(params.id);
  if (!idParsed.success) return NextResponse.json({ error: "ID FAQ không hợp lệ." }, { status: 400 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingFaq = await prisma.faq.findUnique({
    where: { id: idParsed.data },
    select: { id: true }
  });
  if (!existingFaq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

  await prisma.faq.delete({ where: { id: idParsed.data } });
  revalidatePath("/tham-gia");
  revalidatePath("/lien-he");
  revalidatePath("/admin/faqs");

  return NextResponse.json({ success: true });
}
