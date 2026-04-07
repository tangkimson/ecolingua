"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PostItem = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date | string;
};

export function PostsTable({ posts }: { posts: PostItem[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Bạn chắc chắn muốn xóa bài viết này?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Xóa bài viết thất bại");
      return;
    }
    toast.success("Đã xóa bài viết");
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-[180px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell>{post.slug}</TableCell>
              <TableCell>
                <Badge variant={post.published ? "default" : "secondary"}>{post.published ? "Published" : "Draft"}</Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/posts/${post.id}/edit`}>Sửa</Link>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!posts.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Chưa có bài viết nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
