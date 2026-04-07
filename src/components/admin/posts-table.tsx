"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PostItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type StatusFilter = "all" | "published" | "draft";
type SortOption = "updated-desc" | "updated-asc" | "created-desc" | "title-asc" | "title-desc";

function toDateLabel(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}

function statusBadge(published: boolean) {
  return published ? (
    <Badge variant="default" className="bg-eco-700">
      Đã đăng
    </Badge>
  ) : (
    <Badge variant="secondary">Bản nháp</Badge>
  );
}

export function PostsTable({ posts }: { posts: PostItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated-desc");
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState<PostItem | null>(null);

  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const next = posts.filter((post) => {
      const matchesQuery =
        !keyword ||
        post.title.toLowerCase().includes(keyword) ||
        post.slug.toLowerCase().includes(keyword) ||
        post.excerpt.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "draft" && !post.published);

      return matchesQuery && matchesStatus;
    });

    next.sort((a, b) => {
      if (sortBy === "title-asc") return a.title.localeCompare(b.title, "vi");
      if (sortBy === "title-desc") return b.title.localeCompare(a.title, "vi");
      if (sortBy === "updated-asc") return +new Date(a.updatedAt) - +new Date(b.updatedAt);
      if (sortBy === "created-desc") return +new Date(b.createdAt) - +new Date(a.createdAt);
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });

    return next;
  }, [posts, query, sortBy, statusFilter]);

  async function handleDelete(id: string) {
    try {
      setBusyPostId(id);
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa bài viết thất bại");
      toast.success("Đã xóa bài viết");
      router.refresh();
    } catch {
      toast.error("Xóa bài viết thất bại");
    } finally {
      setBusyPostId(null);
      setConfirmDeletePost(null);
    }
  }

  async function handleTogglePublish(post: PostItem) {
    try {
      setBusyPostId(post.id);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published })
      });
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      toast.success(post.published ? "Đã chuyển về bản nháp." : "Bài viết đã được xuất bản.");
      router.refresh();
    } catch {
      toast.error("Không thể cập nhật trạng thái bài viết.");
    } finally {
      setBusyPostId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tiêu đề, slug hoặc mô tả ngắn..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã đăng</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm"
          >
            <option value="updated-desc">Mới cập nhật</option>
            <option value="updated-asc">Cập nhật cũ nhất</option>
            <option value="created-desc">Mới tạo</option>
            <option value="title-asc">Tiêu đề A-Z</option>
            <option value="title-desc">Tiêu đề Z-A</option>
          </select>
          <div className="inline-flex items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground">
            <ArrowUpDown className="size-4" />
            {filteredPosts.length} kết quả
          </div>
        </div>
      </div>

      <div className="hidden rounded-xl border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Cập nhật gần nhất</TableHead>
              <TableHead className="w-[300px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="align-top">
                  <p className="font-semibold">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                </TableCell>
                <TableCell>{statusBadge(post.published)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">/{post.slug}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{toDateLabel(post.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Pencil className="size-3.5" />
                        Sửa
                      </Link>
                    </Button>
                    {post.published && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tin-tuc/${post.slug}`} target="_blank">
                          <Eye className="size-3.5" />
                          Xem
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyPostId === post.id}
                      onClick={() => handleTogglePublish(post)}
                    >
                      {busyPostId === post.id
                        ? "Đang lưu..."
                        : post.published
                          ? "Chuyển nháp"
                          : "Xuất bản nhanh"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyPostId === post.id}
                      onClick={() => setConfirmDeletePost(post)}
                    >
                      <Trash2 className="size-3.5" />
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filteredPosts.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Không có bài viết phù hợp bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredPosts.map((post) => (
          <article key={post.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{post.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">/{post.slug}</p>
              </div>
              {statusBadge(post.published)}
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
            <p className="mt-3 text-xs text-muted-foreground">Cập nhật: {toDateLabel(post.updatedAt)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/posts/${post.id}/edit`}>Sửa</Link>
              </Button>
              <Button size="sm" variant="secondary" disabled={busyPostId === post.id} onClick={() => handleTogglePublish(post)}>
                {post.published ? "Chuyển nháp" : "Xuất bản"}
              </Button>
              {post.published ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/tin-tuc/${post.slug}`} target="_blank">
                    Xem
                  </Link>
                </Button>
              ) : (
                <div />
              )}
              <Button size="sm" variant="destructive" disabled={busyPostId === post.id} onClick={() => setConfirmDeletePost(post)}>
                Xóa
              </Button>
            </div>
          </article>
        ))}
        {!filteredPosts.length && (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            Không có bài viết phù hợp bộ lọc hiện tại.
          </div>
        )}
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 items-center justify-center bg-black/40 p-4",
          confirmDeletePost ? "flex" : "hidden"
        )}
      >
        <div className="w-full max-w-md rounded-xl border bg-white p-5">
          <h3 className="text-lg font-semibold">Xóa bài viết?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Bài viết <strong>{confirmDeletePost?.title}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeletePost(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmDeletePost || busyPostId === confirmDeletePost.id}
              onClick={() => confirmDeletePost && handleDelete(confirmDeletePost.id)}
            >
              {busyPostId === confirmDeletePost?.id ? "Đang xóa..." : "Xóa bài viết"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
