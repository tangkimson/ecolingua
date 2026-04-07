import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { volunteerPositionSchema } from "@/lib/validations";
import { isTrustedOrigin } from "@/lib/security";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminView = searchParams.get("adminView") === "true";

  const positions = await prisma.volunteerPosition.findMany({
    where: adminView ? {} : { published: true },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json(positions);
}

export async function POST(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = volunteerPositionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const position = await prisma.volunteerPosition.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      published: parsed.data.published,
      order: parsed.data.order
    }
  });

  return NextResponse.json(position, { status: 201 });
}
