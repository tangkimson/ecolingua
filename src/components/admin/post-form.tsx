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
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw
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

async function transformImageFile(file: File, zoom: number, rotate: number) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."));
      element.src = objectUrl;
    });

    const radians = (rotate * Math.PI) / 180;
    const scaledWidth = image.naturalWidth * zoom;
    const scaledHeight = image.naturalHeight * zoom;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const canvasWidth = Math.max(1, Math.round(scaledWidth * cos + scaledHeight * sin));
    const canvasHeight = Math.max(1, Math.round(scaledWidth * sin + scaledHeight * cos));

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate(radians);
    ctx.scale(zoom, zoom);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Không thể xuất ảnh."))), outputType, 0.92);
    });

    const extension = outputType === "image/png" ? "png" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}-edited.${extension}`, {
      type: outputType
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
      },
      rotate: {
        default: 0
      }
    };
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.align || "center";
    const width = Number(HTMLAttributes.width || 100);
    const rotate = Number(HTMLAttributes.rotate || 0);
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
        style: `${preservedStyle}width:${width}%;max-width:100%;height:auto;transform:rotate(${rotate}deg);transform-origin:center;${alignmentStyle}`
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
  const [imageRotate, setImageRotate] = useState(0);
  const [imageAlign, setImageAlign] = useState<"left" | "center" | "right">("center");
  const [insertingImage, setInsertingImage] = useState(false);
  const [selectedImageWidth, setSelectedImageWidth] = useState<number | null>(null);
  const [selectedImageRotate, setSelectedImageRotate] = useState(0);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState("");
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverRotate, setCoverRotate] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
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

  async function uploadLocalImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData
    });
    const result = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !result.url) {
      throw new Error(result.error || "Không thể tải ảnh lên.");
    }
    return result.url;
  }

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
    if (!editor) return;

    const updateSelectedImageState = () => {
      if (!editor.isActive("image")) {
        setSelectedImageWidth(null);
        setSelectedImageRotate(0);
        return;
      }

      const attrs = editor.getAttributes("image");
      setSelectedImageWidth(Number(attrs.width || 100));
      setSelectedImageRotate(Number(attrs.rotate || 0));
    };

    updateSelectedImageState();
    editor.on("selectionUpdate", updateSelectedImageState);
    editor.on("transaction", updateSelectedImageState);

    return () => {
      editor.off("selectionUpdate", updateSelectedImageState);
      editor.off("transaction", updateSelectedImageState);
    };
  }, [editor]);

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
      if (coverImagePreviewUrl) {
        URL.revokeObjectURL(coverImagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, coverImagePreviewUrl]);

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
      const transformedFile = await transformImageFile(imageFile, 1, imageRotate);
      const uploadedUrl = await uploadLocalImage(transformedFile);

      editor
        .chain()
        .focus()
        .setImage({
          src: uploadedUrl,
          alt: imageFile.name
        })
        .updateAttributes("image", {
          width: imageWidth,
          align: imageAlign,
          rotate: imageRotate
        })
        .run();

      setImageFile(null);
      setImagePreviewUrl("");
      setImageRotate(0);
      toast.success("Đã chèn ảnh vào nội dung.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải ảnh lên.";
      toast.error(message);
    } finally {
      setInsertingImage(false);
    }
  }

  function updateSelectedImageAttributes(nextWidth: number, nextRotate: number) {
    if (!editor || !editor.isActive("image")) return;
    editor
      .chain()
      .focus()
      .updateAttributes("image", {
        width: Math.max(20, Math.min(100, nextWidth)),
        rotate: Math.max(-180, Math.min(180, nextRotate))
      })
      .run();
    setSelectedImageWidth(Math.max(20, Math.min(100, nextWidth)));
    setSelectedImageRotate(Math.max(-180, Math.min(180, nextRotate)));
  }

  async function handleUploadCoverImage() {
    if (!coverImageFile) {
      toast.error("Vui lòng chọn ảnh bìa từ máy tính.");
      return;
    }

    try {
      setUploadingCover(true);
      const transformedFile = await transformImageFile(coverImageFile, coverZoom, coverRotate);
      const uploadedUrl = await uploadLocalImage(transformedFile);
      setCoverImage(uploadedUrl);
      setCoverImageFile(null);
      if (coverImagePreviewUrl) {
        URL.revokeObjectURL(coverImagePreviewUrl);
      }
      setCoverImagePreviewUrl("");
      toast.success("Đã tải lên ảnh bìa.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải ảnh bìa lên.";
      toast.error(message);
    } finally {
      setUploadingCover(false);
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
                    <p className="mb-3 text-xs text-muted-foreground">Bắt buộc chọn ảnh từ máy tính, không nhập URL trực tiếp.</p>
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
                        <Label htmlFor="imageWidth">Zoom ({imageWidth}%)</Label>
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setImageWidth((prev) => Math.max(30, prev - 5))}>
                        <ZoomOut className="size-4" />
                        Thu nhỏ
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setImageWidth((prev) => Math.min(100, prev + 5))}>
                        <ZoomIn className="size-4" />
                        Phóng to
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setImageRotate((prev) => Math.max(-180, prev - 15))}>
                        <RotateCcw className="size-4" />
                        Xoay trái
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setImageRotate((prev) => Math.min(180, prev + 15))}>
                        <RotateCw className="size-4" />
                        Xoay phải
                      </Button>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="imageRotate">Góc xoay ({imageRotate}°)</Label>
                      <Input
                        id="imageRotate"
                        type="range"
                        min={-180}
                        max={180}
                        value={imageRotate}
                        onChange={(event) => setImageRotate(Number(event.target.value))}
                      />
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
                            marginRight: imageAlign === "left" ? "auto" : imageAlign === "center" ? "auto" : "0",
                            transform: `rotate(${imageRotate}deg)`,
                            transformOrigin: "center"
                          }}
                          className="rounded-md"
                        />
                      </div>
                    )}

                    {selectedImageWidth !== null && (
                      <div className="mt-4 rounded-lg border bg-white p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Chỉnh ảnh đang chọn trong nội dung</p>
                        <div className="space-y-2">
                          <Label htmlFor="selectedImageWidth">Zoom ảnh đang chọn ({selectedImageWidth}%)</Label>
                          <Input
                            id="selectedImageWidth"
                            type="range"
                            min={20}
                            max={100}
                            value={selectedImageWidth}
                            onChange={(event) => updateSelectedImageAttributes(Number(event.target.value), selectedImageRotate)}
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="selectedImageRotate">Góc xoay ảnh đang chọn ({selectedImageRotate}°)</Label>
                          <Input
                            id="selectedImageRotate"
                            type="range"
                            min={-180}
                            max={180}
                            value={selectedImageRotate}
                            onChange={(event) => updateSelectedImageAttributes(selectedImageWidth, Number(event.target.value))}
                          />
                        </div>
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
                <Label htmlFor="coverImageUpload">Tải ảnh bìa từ máy</Label>
                <Input
                  id="coverImageUpload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (coverImagePreviewUrl) URL.revokeObjectURL(coverImagePreviewUrl);
                    setCoverImageFile(file);
                    setCoverImagePreviewUrl(URL.createObjectURL(file));
                    setCoverImage("");
                    setCoverZoom(1);
                    setCoverRotate(0);
                  }}
                />
                <p className="text-xs text-muted-foreground">Bắt buộc upload từ local. Khuyến nghị ảnh ngang tỷ lệ 16:9.</p>
                {errors.coverImage && <p className="text-xs text-red-600">{errors.coverImage}</p>}
              </div>
              {coverImageFile && (
                <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="coverZoom">Zoom ảnh bìa ({Math.round(coverZoom * 100)}%)</Label>
                    <Input
                      id="coverZoom"
                      type="range"
                      min={50}
                      max={200}
                      value={Math.round(coverZoom * 100)}
                      onChange={(event) => setCoverZoom(Number(event.target.value) / 100)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverRotate">Góc xoay ảnh bìa ({coverRotate}°)</Label>
                    <Input
                      id="coverRotate"
                      type="range"
                      min={-180}
                      max={180}
                      value={coverRotate}
                      onChange={(event) => setCoverRotate(Number(event.target.value))}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setCoverZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}>
                      <ZoomOut className="size-4" />
                      Thu nhỏ
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setCoverZoom((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}>
                      <ZoomIn className="size-4" />
                      Phóng to
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setCoverRotate((prev) => Math.max(-180, prev - 15))}>
                      <RotateCcw className="size-4" />
                      Xoay trái
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setCoverRotate((prev) => Math.min(180, prev + 15))}>
                      <RotateCw className="size-4" />
                      Xoay phải
                    </Button>
                  </div>
                  <Button type="button" onClick={handleUploadCoverImage} disabled={uploadingCover}>
                    {uploadingCover ? "Đang tải..." : "Tải ảnh bìa lên"}
                  </Button>
                </div>
              )}
              {(coverImagePreviewUrl || coverImage) && (
                <div className="mt-3 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImagePreviewUrl || coverImage}
                    alt="Cover preview"
                    className="h-40 w-full object-cover"
                    style={{
                      transform: coverImagePreviewUrl ? `scale(${coverZoom}) rotate(${coverRotate}deg)` : undefined,
                      transformOrigin: "center"
                    }}
                  />
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
