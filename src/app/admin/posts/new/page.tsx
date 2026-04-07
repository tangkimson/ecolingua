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
          coverImage: "",
          published: false
        }}
      />
    </div>
  );
}
