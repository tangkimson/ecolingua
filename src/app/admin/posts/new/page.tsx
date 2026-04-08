import { redirect } from "next/navigation";

import { PostForm } from "@/components/admin/post-form";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin/posts/new")}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Tạo bài viết</h1>
      <PostForm
        mode="create"
        defaultValues={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverImage: "",
          published: false
        }}
      />
    </div>
  );
}
