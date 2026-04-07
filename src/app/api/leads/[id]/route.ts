import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isTrustedOrigin } from "@/lib/security";

type Context = { params: { id: string } };

const updateLeadSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "CONTACTED", "RESOLVED", "ARCHIVED", "SPAM"])
});

export async function PATCH(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existingLead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: { status: parsed.data.status }
  });

  return NextResponse.json(lead);
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingLead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existingLead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
