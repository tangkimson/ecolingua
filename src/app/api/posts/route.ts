import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";
import { extractPostImageAssets } from "@/lib/post-assets";
import { countUniqueImageSources, findDisallowedImageSources, isAllowedAdminImageSource } from "@/lib/post-images";

const MAX_IMAGES_PER_POST = 10;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(posts, { status: 200 });
}

export async function POST(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!isAllowedAdminImageSource(parsed.data.coverImage)) {
    return NextResponse.json(
      { error: { fieldErrors: { coverImage: ["Ảnh bìa phải được tải lên từ thiết bị trong trang quản trị."] } } },
      { status: 400 }
    );
  }

  const invalidContentImages = findDisallowedImageSources(parsed.data.content);
  if (invalidContentImages.length > 0) {
    return NextResponse.json(
      { error: { fieldErrors: { content: ["Chỉ cho phép ảnh đã tải lên từ thiết bị. Vui lòng thay thế ảnh URL/link ngoài."] } } },
      { status: 400 }
    );
  }

  const imageCount = countUniqueImageSources(parsed.data.content);
  if (imageCount > MAX_IMAGES_PER_POST) {
    return NextResponse.json(
      { error: { fieldErrors: { content: [`Tối đa ${MAX_IMAGES_PER_POST} ảnh trong một bài viết.`] } } },
      { status: 400 }
    );
  }

  try {
    const imageAssets = extractPostImageAssets(parsed.data.coverImage, parsed.data.content);
    const post = await prisma.post.create({
      data: {
        ...parsed.data,
        publishedAt: parsed.data.published ? new Date() : null,
        imageAssets
      }
    });

    revalidatePath("/admin/posts");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${post.slug}`);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: { fieldErrors: { slug: ["Slug đã tồn tại. Vui lòng chọn slug khác."] } } },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Không thể tạo bài viết. Vui lòng thử lại." }, { status: 500 });
  }
}
