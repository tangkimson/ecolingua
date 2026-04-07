import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PostsTable } from "@/components/admin/posts-table";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
          <p className="text-sm text-muted-foreground">Thêm, sửa, xóa bài viết cho mục Tin tức.</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">Thêm bài viết</Link>
        </Button>
      </div>
      <PostsTable posts={posts} />
    </div>
  );
}
