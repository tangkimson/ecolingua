import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Sửa bài viết</h1>
      <PostForm
        mode="edit"
        postId={post.id}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          published: post.published
        }}
        metadata={{
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          publishedAt: post.publishedAt
        }}
      />
    </div>
  );
}
