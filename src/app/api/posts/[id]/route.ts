import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";
import {
  extractImageSourcesFromHtml,
  findDisallowedImageSources,
  isAllowedAdminImageSource,
  normalizeImageSource
} from "@/lib/post-images";

type Context = { params: { id: string } };

function buildLegacyImageSourceSet(existingPost: { coverImage: string; content: string }) {
  const legacySources = new Set<string>();
  legacySources.add(normalizeImageSource(existingPost.coverImage));

  for (const source of extractImageSourcesFromHtml(existingPost.content)) {
    legacySources.add(normalizeImageSource(source));
  }

  return legacySources;
}

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true, publishedAt: true, coverImage: true, content: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const legacySources = buildLegacyImageSourceSet(existingPost);
  const normalizedCoverImage = normalizeImageSource(parsed.data.coverImage);
  if (!isAllowedAdminImageSource(normalizedCoverImage) && !legacySources.has(normalizedCoverImage)) {
    return NextResponse.json(
      { error: { fieldErrors: { coverImage: ["Ảnh bìa phải được tải lên từ thiết bị trong trang quản trị."] } } },
      { status: 400 }
    );
  }

  const invalidContentImages = findDisallowedImageSources(parsed.data.content, legacySources);
  if (invalidContentImages.length > 0) {
    return NextResponse.json(
      { error: { fieldErrors: { content: ["Chỉ cho phép ảnh đã tải lên từ thiết bị. Vui lòng thay thế ảnh URL/link ngoài."] } } },
      { status: 400 }
    );
  }

  const nextPublishedAt = parsed.data.published ? (existingPost.publishedAt ?? new Date()) : null;

  try {
    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        publishedAt: nextPublishedAt
      }
    });

    revalidatePath("/admin/posts");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${existingPost.slug}`);
    revalidatePath(`/tin-tuc/${post.slug}`);

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: { fieldErrors: { slug: ["Slug đã tồn tại. Vui lòng chọn slug khác."] } } },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Không thể cập nhật bài viết. Vui lòng thử lại." }, { status: 500 });
  }
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
    select: { id: true, slug: true, publishedAt: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const parsed = postPublishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        published: parsed.data.published,
        publishedAt: parsed.data.published ? (existingPost.publishedAt ?? new Date()) : null
      }
    });

    revalidatePath("/admin/posts");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${existingPost.slug}`);
    revalidatePath(`/tin-tuc/${post.slug}`);

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật trạng thái bài viết." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  try {
    await prisma.post.delete({ where: { id: params.id } });
    revalidatePath("/admin/posts");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${existingPost.slug}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa bài viết." }, { status: 500 });
  }
}
