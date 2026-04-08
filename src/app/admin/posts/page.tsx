import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { PostsTable } from "@/components/admin/posts-table";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin/posts")}`);
  }

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" }
  });

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((post) => post.published).length;
  const draftPosts = totalPosts - publishedPosts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý vòng đời nội dung từ nháp đến xuất bản cho mục Tin tức.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-white px-2.5 py-1">Tổng: {totalPosts}</span>
            <span className="rounded-full border bg-white px-2.5 py-1">Đã đăng: {publishedPosts}</span>
            <span className="rounded-full border bg-white px-2.5 py-1">Bản nháp: {draftPosts}</span>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">Tạo bài viết</Link>
        </Button>
      </div>
      <PostsTable posts={posts} />
    </div>
  );
}
