import { unlink } from "node:fs/promises";
import path from "node:path";
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
  extractLocalUploadPathsFromHtml,
  findDisallowedImageSources,
  LOCAL_POST_UPLOAD_PREFIX,
  isAllowedAdminImageSource,
  normalizeImageSource
} from "@/lib/post-images";
import { cuidParamSchema } from "@/lib/validations";

type Context = { params: { id: string } };

function parsePostId(rawId: string) {
  const parsed = cuidParamSchema.safeParse(rawId);
  return parsed.success ? parsed.data : null;
}

function buildLegacyImageSourceSet(existingPost: { coverImage: string; content: string }) {
  const legacySources = new Set<string>();
  legacySources.add(normalizeImageSource(existingPost.coverImage));

  for (const source of extractImageSourcesFromHtml(existingPost.content)) {
    legacySources.add(normalizeImageSource(source));
  }

  return legacySources;
}

function buildLocalUploadPathSet(post: { coverImage: string; content: string }) {
  const localPaths = new Set<string>();
  const normalizedCover = normalizeImageSource(post.coverImage);
  if (normalizedCover.startsWith(LOCAL_POST_UPLOAD_PREFIX)) {
    localPaths.add(normalizedCover);
  }

  for (const source of extractLocalUploadPathsFromHtml(post.content)) {
    localPaths.add(source);
  }

  return localPaths;
}

async function removeUnusedLocalUploads(before: Set<string>, after: Set<string>) {
  if (process.env.VERCEL) return;

  const toDelete = [...before].filter((item) => !after.has(item));
  await Promise.all(
    toDelete.map(async (item) => {
      const absolutePath = path.join(process.cwd(), "public", item.replace(/^\//, ""));
      try {
        await unlink(absolutePath);
      } catch {
        // Ignore missing or non-removable files to keep API flow stable.
      }
    })
  );
}

export async function PUT(req: Request, { params }: Context) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const postId = parsePostId(params.id);
  if (!postId) return NextResponse.json({ error: "ID bài viết không hợp lệ." }, { status: 400 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
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
      where: { id: postId },
      data: {
        ...parsed.data,
        publishedAt: nextPublishedAt
      }
    });

    await removeUnusedLocalUploads(
      buildLocalUploadPathSet(existingPost),
      buildLocalUploadPathSet({ coverImage: parsed.data.coverImage, content: parsed.data.content })
    );

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

  const postId = parsePostId(params.id);
  if (!postId) return NextResponse.json({ error: "ID bài viết không hợp lệ." }, { status: 400 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
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
      where: { id: postId },
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

  const postId = parsePostId(params.id);
  if (!postId) return NextResponse.json({ error: "ID bài viết không hợp lệ." }, { status: 400 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, slug: true, coverImage: true, content: true }
  });
  if (!existingPost) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  try {
    await prisma.post.delete({ where: { id: postId } });
    await removeUnusedLocalUploads(buildLocalUploadPathSet(existingPost), new Set());
    revalidatePath("/admin/posts");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${existingPost.slug}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa bài viết." }, { status: 500 });
  }
}
