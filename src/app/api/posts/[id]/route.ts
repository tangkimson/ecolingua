import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

type Context = { params: { id: string } };

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, publishedAt: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const nextPublishedAt = parsed.data.published ? (existingPost.publishedAt ?? new Date()) : null;

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      publishedAt: nextPublishedAt
    }
  });

  return NextResponse.json(post);
}

const postPublishSchema = z.object({
  published: z.boolean()
});

export async function PATCH(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, publishedAt: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = await req.json();
  const parsed = postPublishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      published: parsed.data.published,
      publishedAt: parsed.data.published ? (existingPost.publishedAt ?? new Date()) : null
    }
  });

  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
