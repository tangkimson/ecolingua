import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
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
          coverImage: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8",
          published: false
        }}
      />
    </div>
  );
}
