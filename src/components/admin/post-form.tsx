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
  ImagePlus,
  Undo2,
  Redo2,
  Eraser,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  metadata?: {
    createdAt: Date | string;
    updatedAt: Date | string;
    publishedAt: Date | string | null;
  };
};

type DraftPayload = PostFormValue & {
  savedAt: string;
};

type FormErrors = Partial<Record<keyof PostFormValue, string>>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as { error?: unknown };
  if (!data.error || typeof data.error !== "object") return null;
  const flattened = data.error as { fieldErrors?: Record<string, string[] | undefined> };
  const firstFieldError = Object.values(flattened.fieldErrors ?? {}).find((messages) => messages?.length)?.[0];
  return firstFieldError ?? null;
}

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

function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}

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

export function PostForm({ mode, postId, defaultValues, metadata }: PostFormProps) {
  const router = useRouter();
  const initialContent = normalizePostContent(defaultValues?.content || "");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [excerpt, setExcerpt] = useState(defaultValues?.excerpt ?? "");
  const [content, setContent] = useState(initialContent);
  const [coverImage, setCoverImage] = useState(defaultValues?.coverImage ?? "");
  const [published, setPublished] = useState(defaultValues?.published || false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [errors, setErrors] = useState<FormErrors>({});
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [linkInput, setLinkInput] = useState("https://");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageWidth, setImageWidth] = useState(80);
  const [imageAlign, setImageAlign] = useState<"left" | "center" | "right">("center");
  const [insertingImage, setInsertingImage] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      title: (defaultValues?.title ?? "").trim(),
      slug: (defaultValues?.slug ?? "").trim(),
      excerpt: (defaultValues?.excerpt ?? "").trim(),
      content: initialContent.trim(),
      coverImage: (defaultValues?.coverImage ?? "").trim(),
      published: defaultValues?.published ?? false
    })
  );
  const [storedDraft, setStoredDraft] = useState<DraftPayload | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const draftKey = useMemo(() => `admin-post-draft:${mode}:${postId ?? "new"}`, [mode, postId]);
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImage: coverImage.trim(),
        published
      }),
    [title, slug, excerpt, content, coverImage, published]
  );
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;

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
    if (slugTouched) return;
    setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (!editor) return;
    const selectedLink = editor.getAttributes("link").href as string | undefined;
    setLinkInput(selectedLink || "https://");
  }, [editor, tab]);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftKey);
    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft) as DraftPayload;
      setStoredDraft(draft);
      setLastDraftSavedAt(draft.savedAt);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    if (storedDraft) return;

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
  }, [title, slug, excerpt, content, coverImage, published, draftKey, storedDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function validate(payload: PostFormValue) {
    const nextErrors: FormErrors = {};
    if (payload.title.trim().length < 5) nextErrors.title = "Tiêu đề cần ít nhất 5 ký tự.";
    if (payload.title.trim().length > 180) nextErrors.title = "Tiêu đề tối đa 180 ký tự.";
    if (!/^[a-z0-9-]+$/.test(payload.slug.trim())) nextErrors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
    if (payload.slug.trim().length < 3) nextErrors.slug = "Slug cần ít nhất 3 ký tự.";
    if (payload.excerpt.trim().length < 20) nextErrors.excerpt = "Mô tả ngắn cần ít nhất 20 ký tự.";
    if (payload.excerpt.trim().length > 300) nextErrors.excerpt = "Mô tả ngắn tối đa 300 ký tự.";
    if (payload.content.trim().length < 50) nextErrors.content = "Nội dung cần chi tiết hơn (ít nhất 50 ký tự).";
    try {
      new URL(payload.coverImage.trim());
    } catch {
      nextErrors.coverImage = "Ảnh bìa cần là URL hợp lệ.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function applyStoredDraft() {
    if (!storedDraft) return;
    setTitle(storedDraft.title);
    setSlug(storedDraft.slug);
    setExcerpt(storedDraft.excerpt);
    setCoverImage(storedDraft.coverImage);
    setPublished(storedDraft.published);
    setContent(storedDraft.content);
    editor?.commands.setContent(storedDraft.content, { emitUpdate: false });
    toast.success("Đã khôi phục bản nháp cục bộ.");
    setStoredDraft(null);
  }

  function discardStoredDraft() {
    window.localStorage.removeItem(draftKey);
    setStoredDraft(null);
    setLastDraftSavedAt(null);
    toast.success("Đã xóa bản nháp cục bộ.");
  }

  function saveDraftToLocal() {
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
    toast.success("Đã lưu bản nháp cục bộ.");
  }

  async function handleSubmit(nextPublished: boolean) {
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      coverImage: coverImage.trim(),
      published: nextPublished
    };

    if (!validate(payload)) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin.");
      return;
    }

    try {
      setLoading(true);
      const endpoint = mode === "create" ? "/api/posts" : `/api/posts/${postId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await res.json()) as { id?: string } | { error?: unknown };
      if (!res.ok) {
        const apiMessage = getApiErrorMessage(result);
        throw new Error(apiMessage ?? "Không thể lưu bài viết.");
      }

      setPublished(nextPublished);
      setSavedSnapshot(
        JSON.stringify({
          title: payload.title,
          slug: payload.slug,
          excerpt: payload.excerpt,
          content: payload.content.trim(),
          coverImage: payload.coverImage,
          published: nextPublished
        })
      );
      window.localStorage.removeItem(draftKey);
      setStoredDraft(null);
      setLastDraftSavedAt(null);

      toast.success(
        mode === "create"
          ? nextPublished
            ? "Đã tạo và xuất bản bài viết."
            : "Đã tạo bài viết ở trạng thái nháp."
          : nextPublished
            ? "Đã cập nhật bài viết đã xuất bản."
            : "Đã lưu bản nháp."
      );

      if (mode === "create" && "id" in result && result.id) {
        router.replace(`/admin/posts/${result.id}/edit`);
        return;
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu bài viết.";
      toast.error(message);
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
    if (!linkInput.trim()) {
      editor.chain().focus().unsetLink().run();
      toast.success("Đã gỡ liên kết.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkInput.trim() }).run();
    toast.success("Đã cập nhật liên kết.");
  }

  function handleBackToList() {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/posts");
  }

  return (
    <>
      <form
        onSubmit={(event) => event.preventDefault()}
        className="space-y-6 rounded-xl border bg-white p-4 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{mode === "create" ? "Tạo bài viết" : "Chỉnh sửa bài viết"}</Badge>
              {published ? <Badge>Đã xuất bản</Badge> : <Badge variant="secondary">Bản nháp</Badge>}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                  Chưa lưu
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {lastDraftSavedAt ? `Tự lưu cục bộ lúc ${formatDateTime(lastDraftSavedAt)}` : "Đang tự động lưu bản nháp cục bộ"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="size-4" />
              Danh sách bài viết
            </Button>
            <Button type="button" variant="outline" onClick={saveDraftToLocal}>
              Lưu nháp cục bộ
            </Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => handleSubmit(false)}>
              {loading ? "Đang lưu..." : "Lưu nháp"}
            </Button>
            <Button type="button" disabled={loading} onClick={() => handleSubmit(true)}>
              {loading ? "Đang lưu..." : published ? "Cập nhật bài đã đăng" : "Xuất bản"}
            </Button>
          </div>
        </div>

        {storedDraft && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-medium text-amber-900">Phát hiện bản nháp cục bộ chưa áp dụng.</p>
            <p className="mt-1 text-amber-800">Lưu lúc: {formatDateTime(storedDraft.savedAt)}.</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={applyStoredDraft}>
                Khôi phục bản nháp
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={discardStoredDraft}>
                Bỏ bản nháp này
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <section className="rounded-xl border p-4">
              <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">Các trường này ảnh hưởng trực tiếp tới SEO và hiển thị ngoài trang tin tức.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề bài viết</Label>
                  <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Chiến dịch trồng cây tháng 4" />
                  <p className="text-xs text-muted-foreground">{title.trim().length}/180 ký tự</p>
                  {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="slug">Slug URL</Label>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSlug(slugify(title))}>
                      Tạo lại từ tiêu đề
                    </Button>
                  </div>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(slugify(event.target.value));
                    }}
                    placeholder="chien-dich-trong-cay-thang-4"
                  />
                  <p className="text-xs text-muted-foreground">Chỉ dùng chữ thường, số và dấu gạch ngang.</p>
                  {errors.slug && <p className="text-xs text-red-600">{errors.slug}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Mô tả ngắn</Label>
                  <Textarea
                    id="excerpt"
                    rows={4}
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                    placeholder="Tóm tắt nội dung bài viết để hiển thị ở danh sách tin tức..."
                  />
                  <p className="text-xs text-muted-foreground">{excerpt.trim().length}/300 ký tự (khuyến nghị 80-160 ký tự).</p>
                  {errors.excerpt && <p className="text-xs text-red-600">{errors.excerpt}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Nội dung bài viết</h3>
                  <p className="text-sm text-muted-foreground">Soạn thảo rich text, chèn ảnh, liên kết và xem trước ngay.</p>
                </div>
              </div>

              <Tabs value={tab} onValueChange={(value) => setTab(value as "editor" | "preview")}>
                <TabsList>
                  <TabsTrigger value="editor">Soạn thảo</TabsTrigger>
                  <TabsTrigger value="preview">Xem trước</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-3">
                  <div className="rounded-lg border border-input">
                    <div className="flex flex-wrap gap-1 border-b border-input bg-muted/40 p-2">
                      <ToolbarButton
                        title="Bold"
                        active={editor?.isActive("bold")}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                      >
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
                      <ToolbarButton title="Undo" onClick={() => editor?.chain().focus().undo().run()}>
                        <Undo2 className="size-4" />
                      </ToolbarButton>
                      <ToolbarButton title="Redo" onClick={() => editor?.chain().focus().redo().run()}>
                        <Redo2 className="size-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        title="Clear format"
                        onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                      >
                        <Eraser className="size-4" />
                      </ToolbarButton>
                    </div>
                    <div className="border-b bg-muted/20 p-2">
                      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                        <Input value={linkInput} onChange={(event) => setLinkInput(event.target.value)} placeholder="https://..." />
                        <Button type="button" variant="outline" onClick={setLink}>
                          Áp dụng link
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => editor?.chain().focus().unsetLink().run()}>
                          Gỡ link
                        </Button>
                      </div>
                    </div>
                    <EditorContent editor={editor} />
                  </div>
                  {errors.content && <p className="text-xs text-red-600">{errors.content}</p>}

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
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border p-4">
              <h3 className="text-base font-semibold">Xuất bản & trạng thái</h3>
              <div className="mt-3 space-y-2">
                <Label htmlFor="publishStatus">Trạng thái</Label>
                <select
                  id="publishStatus"
                  value={published ? "published" : "draft"}
                  onChange={(event) => setPublished(event.target.value === "published")}
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đã xuất bản</option>
                </select>
                <p className="text-xs text-muted-foreground">Bạn vẫn có thể đổi trạng thái bất cứ lúc nào ở danh sách bài viết.</p>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p>Tạo lúc: {formatDateTime(metadata?.createdAt)}</p>
                <p>Cập nhật: {formatDateTime(metadata?.updatedAt)}</p>
                <p>Xuất bản: {formatDateTime(metadata?.publishedAt ?? (published ? new Date().toISOString() : null))}</p>
              </div>
            </section>

            <section className="rounded-xl border p-4">
              <h3 className="text-base font-semibold">Ảnh bìa</h3>
              <div className="mt-3 space-y-2">
                <Label htmlFor="coverImage">URL ảnh bìa</Label>
                <Input
                  id="coverImage"
                  name="coverImage"
                  type="url"
                  value={coverImage}
                  onChange={(event) => setCoverImage(event.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Nên dùng ảnh ngang tỷ lệ 16:9 để hiển thị đẹp trên trang tin tức.</p>
                {errors.coverImage && <p className="text-xs text-red-600">{errors.coverImage}</p>}
              </div>
              {coverImage && (
                <div className="mt-3 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="Cover preview" className="h-40 w-full object-cover" />
                </div>
              )}
            </section>
          </aside>
        </div>
      </form>

      <div className={cn("fixed inset-0 z-50 items-center justify-center bg-black/40 p-4", showLeaveConfirm ? "flex" : "hidden")}>
        <div className="w-full max-w-md rounded-xl border bg-white p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <h3 className="text-lg font-semibold">Bạn có thay đổi chưa lưu</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Nếu rời trang ngay, các thay đổi gần nhất có thể chưa được cập nhật lên hệ thống.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              Tiếp tục chỉnh sửa
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowLeaveConfirm(false);
                router.push("/admin/posts");
              }}
            >
              Rời trang
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
