"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { mergeAttributes } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Link2Off,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Paintbrush,
  Highlighter,
  Smile,
  ImagePlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostContent } from "@/components/posts/post-content";
import { normalizePostContent } from "@/lib/post-content";
import { cn } from "@/lib/utils";

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

type DraftPayload = PostFormValue & {
  savedAt: string;
};

const RichImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100
      },
      align: {
        default: "center"
      }
    };
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.align || "center";
    const width = Number(HTMLAttributes.width || 100);
    const preservedStyle = HTMLAttributes.style ? `${HTMLAttributes.style};` : "";
    const alignmentStyle =
      align === "left"
        ? "display:block;margin:0 auto 0 0;"
        : align === "right"
          ? "display:block;margin:0 0 0 auto;"
          : "display:block;margin:0 auto;";

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `${preservedStyle}width:${width}%;max-width:100%;height:auto;${alignmentStyle}`
      })
    ];
  }
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-eco-200 hover:bg-eco-50 hover:text-eco-800 disabled:cursor-not-allowed disabled:opacity-50",
        active && "border-eco-200 bg-eco-100 text-eco-900"
      )}
    >
      {children}
    </button>
  );
}

export function PostForm({ mode, postId, defaultValues }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [slug, setSlug] = useState(defaultValues?.slug || "");
  const [excerpt, setExcerpt] = useState(defaultValues?.excerpt || "");
  const [content, setContent] = useState(normalizePostContent(defaultValues?.content || ""));
  const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || "");
  const [published, setPublished] = useState(defaultValues?.published || false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageWidth, setImageWidth] = useState(80);
  const [imageAlign, setImageAlign] = useState<"left" | "center" | "right">("center");
  const [insertingImage, setInsertingImage] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);

  const draftKey = useMemo(() => `admin-post-draft:${mode}:${postId ?? "new"}`, [mode, postId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      RichImage.configure({
        allowBase64: true
      })
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] w-full rounded-b-lg border border-t-0 border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      setContent(currentEditor.getHTML());
    }
  });

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftKey);
    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft) as DraftPayload;
      setTitle(draft.title);
      setSlug(draft.slug);
      setExcerpt(draft.excerpt);
      setCoverImage(draft.coverImage);
      setPublished(draft.published);
      setContent(draft.content);
      editor?.commands.setContent(draft.content, { emitUpdate: false });
      setLastDraftSavedAt(draft.savedAt);
      toast.info("Đã khôi phục bản nháp tự động.");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey, editor]);

  useEffect(() => {
    const draftTimeout = window.setTimeout(() => {
      const draft: DraftPayload = {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        published,
        savedAt: new Date().toISOString()
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastDraftSavedAt(draft.savedAt);
    }, 1000);

    return () => window.clearTimeout(draftTimeout);
  }, [title, slug, excerpt, content, coverImage, published, draftKey]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function handleSubmit() {
    const payload = {
      title,
      slug,
      excerpt,
      content,
      coverImage,
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
      window.localStorage.removeItem(draftKey);
      router.push("/admin/posts");
      router.refresh();
    } catch {
      toast.error("Không thể lưu bài viết.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInsertImage() {
    if (!imageFile || !editor) {
      toast.error("Vui lòng chọn ảnh trước khi chèn.");
      return;
    }

    try {
      setInsertingImage(true);
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData
      });

      const result = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !result.url) throw new Error(result.error || "Upload failed");

      editor
        .chain()
        .focus()
        .setImage({
          src: result.url,
          alt: imageFile.name
        })
        .updateAttributes("image", {
          width: imageWidth,
          align: imageAlign
        })
        .run();

      setImageFile(null);
      setImagePreviewUrl("");
      toast.success("Đã chèn ảnh vào nội dung.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải ảnh lên.";
      toast.error(message);
    } finally {
      setInsertingImage(false);
    }
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Nhập liên kết", previousUrl || "https://");
    if (nextUrl === null) return;
    if (!nextUrl.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: nextUrl.trim() }).run();
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit();
      }}
      className="space-y-4 rounded-xl border bg-white p-4 md:p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" name="title" required value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required value={slug} onChange={(event) => setSlug(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="excerpt">Mô tả ngắn</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          required
          rows={3}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Nội dung</Label>
          {lastDraftSavedAt && (
            <span className="text-xs text-muted-foreground">
              Tự lưu nháp: {new Date(lastDraftSavedAt).toLocaleTimeString("vi-VN")}
            </span>
          )}
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as "editor" | "preview")}>
          <TabsList>
            <TabsTrigger value="editor">Soạn thảo</TabsTrigger>
            <TabsTrigger value="preview">Xem trước</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-3">
            <div className="rounded-lg border border-input">
              <div className="flex flex-wrap gap-1 border-b border-input bg-muted/40 p-2">
                <ToolbarButton title="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
                  <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Italic"
                  active={editor?.isActive("italic")}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Underline"
                  active={editor?.isActive("underline")}
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Heading 1"
                  active={editor?.isActive("heading", { level: 1 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                  <Heading1 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Heading 2"
                  active={editor?.isActive("heading", { level: 2 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <Heading2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Heading 3"
                  active={editor?.isActive("heading", { level: 3 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <Heading3 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Bullet list"
                  active={editor?.isActive("bulletList")}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Ordered list"
                  active={editor?.isActive("orderedList")}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Quote"
                  active={editor?.isActive("blockquote")}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                >
                  <Quote className="size-4" />
                </ToolbarButton>
                <ToolbarButton title="Insert / edit link" active={editor?.isActive("link")} onClick={setLink}>
                  <LinkIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Remove link"
                  onClick={() => editor?.chain().focus().unsetLink().run()}
                  disabled={!editor?.isActive("link")}
                >
                  <Link2Off className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                  title="Highlight"
                  active={editor?.isActive("highlight")}
                  onClick={() => editor?.chain().focus().toggleHighlight({ color: "#FFF59D" }).run()}
                >
                  <Highlighter className="size-4" />
                </ToolbarButton>
                <label className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-eco-50">
                  <Paintbrush className="size-4" />
                  <input
                    type="color"
                    title="Text color"
                    className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                    onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
                  />
                </label>
                <ToolbarButton title="Insert emoji" onClick={() => editor?.chain().focus().insertContent(" 😊 ").run()}>
                  <Smile className="size-4" />
                </ToolbarButton>
              </div>
              <EditorContent editor={editor} />
            </div>

            <div className="rounded-lg border border-dashed p-3 md:p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <ImagePlus className="size-4" />
                Chèn ảnh trong nội dung
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="inlineImage">Ảnh từ thiết bị</Label>
                  <Input
                    id="inlineImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                      setImageFile(file);
                      setImagePreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageWidth">Kích thước ({imageWidth}%)</Label>
                  <Input
                    id="imageWidth"
                    type="range"
                    min={30}
                    max={100}
                    value={imageWidth}
                    onChange={(event) => setImageWidth(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageAlign">Canh lề</Label>
                  <select
                    id="imageAlign"
                    value={imageAlign}
                    onChange={(event) => setImageAlign(event.target.value as "left" | "center" | "right")}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="left">Trái</option>
                    <option value="center">Giữa</option>
                    <option value="right">Phải</option>
                  </select>
                </div>
                <Button type="button" onClick={handleInsertImage} disabled={!imageFile || insertingImage}>
                  {insertingImage ? "Đang tải..." : "Upload & chèn"}
                </Button>
              </div>

              {imagePreviewUrl && (
                <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Xem trước trước khi chèn:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Image preview"
                    style={{
                      width: `${imageWidth}%`,
                      maxWidth: "100%",
                      marginLeft: imageAlign === "right" ? "auto" : imageAlign === "center" ? "auto" : "0",
                      marginRight: imageAlign === "left" ? "auto" : imageAlign === "center" ? "auto" : "0"
                    }}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="rounded-xl border bg-white p-4 md:p-6">
              <PostContent content={content} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImage">Ảnh bìa (URL)</Label>
        <Input
          id="coverImage"
          name="coverImage"
          type="url"
          required
          value={coverImage}
          onChange={(event) => setCoverImage(event.target.value)}
        />
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
