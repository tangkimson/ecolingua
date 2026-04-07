import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

type Context = { params: { id: string } };

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      publishedAt: parsed.data.published ? new Date() : null
    }
  });

  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
