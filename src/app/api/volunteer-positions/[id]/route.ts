import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { volunteerPositionSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

type Context = { params: { id: string } };

const publishSchema = z.object({
  published: z.boolean()
});

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.volunteerPosition.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  const body = await req.json();
  const parsed = volunteerPositionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const position = await prisma.volunteerPosition.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      published: parsed.data.published,
      order: parsed.data.order
    }
  });

  return NextResponse.json(position);
}

export async function PATCH(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.volunteerPosition.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  const body = await req.json();
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const position = await prisma.volunteerPosition.update({
    where: { id: params.id },
    data: { published: parsed.data.published }
  });

  return NextResponse.json(position);
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.volunteerPosition.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existing) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  await prisma.volunteerPosition.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ success: true });
}
