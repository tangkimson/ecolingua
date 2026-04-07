"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PostFormValue = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
};

type PostFormProps = {
  mode: "create" | "edit";
  postId?: string;
  defaultValues?: PostFormValue;
};

export function PostForm({ mode, postId, defaultValues }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(defaultValues?.published || false);

  async function handleSubmit(formData: FormData) {
    const payload = {
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      excerpt: String(formData.get("excerpt") || ""),
      content: String(formData.get("content") || ""),
      coverImage: String(formData.get("coverImage") || ""),
      published
    };

    try {
      setLoading(true);
      const endpoint = mode === "create" ? "/api/posts" : `/api/posts/${postId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Save failed");

      toast.success(mode === "create" ? "Đã tạo bài viết mới." : "Đã cập nhật bài viết.");
      router.push("/admin/posts");
      router.refresh();
    } catch {
      toast.error("Không thể lưu bài viết.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={async (formData) => handleSubmit(formData)} className="space-y-4 rounded-xl border bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required defaultValue={defaultValues?.slug} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="excerpt">Mô tả ngắn</Label>
        <Textarea id="excerpt" name="excerpt" required rows={3} defaultValue={defaultValues?.excerpt} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Nội dung</Label>
        <Textarea id="content" name="content" required rows={10} defaultValue={defaultValues?.content} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverImage">Ảnh bìa (URL)</Label>
        <Input id="coverImage" name="coverImage" type="url" required defaultValue={defaultValues?.coverImage} />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 rounded border"
        />
        Publish ngay
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? "Đang lưu..." : mode === "create" ? "Tạo bài viết" : "Cập nhật bài viết"}
      </Button>
    </form>
  );
}
