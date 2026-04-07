"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  location: string;
  published: boolean;
  order: number;
  updatedAt: Date | string;
};

type FaqFormValue = {
  question: string;
  answer: string;
  location: "JOIN" | "CONTACT";
  published: boolean;
  order: number;
};

const DEFAULT_FORM: FaqFormValue = {
  question: "",
  answer: "",
  location: "JOIN",
  published: true,
  order: 0
};

function locationLabel(location: string) {
  return location === "JOIN" ? "Trang Tham gia" : "Trang Liên hệ";
}

export function FaqsManager({ initialFaqs }: { initialFaqs: FaqItem[] }) {
  const router = useRouter();
  const [faqs, setFaqs] = useState(initialFaqs);
  const [form, setForm] = useState<FaqFormValue>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const orderedFaqs = useMemo(
    () =>
      [...faqs].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }),
    [faqs]
  );

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  }

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      location: item.location === "CONTACT" ? "CONTACT" : "JOIN",
      published: item.published,
      order: item.order
    });
  }

  function validateForm(value: FaqFormValue) {
    if (value.question.trim().length < 10) {
      toast.error("Câu hỏi cần ít nhất 10 ký tự.");
      return false;
    }
    if (value.answer.trim().length < 10) {
      toast.error("Câu trả lời cần ít nhất 10 ký tự.");
      return false;
    }
    if (value.order < 0 || value.order > 999) {
      toast.error("Thứ tự hiển thị cần trong khoảng 0-999.");
      return false;
    }
    return true;
  }

  async function submitForm() {
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      location: form.location,
      published: form.published,
      order: form.order
    };
    if (!validateForm(payload)) return;

    try {
      setSubmitting(true);
      const endpoint = editingId ? `/api/faqs/${editingId}` : "/api/faqs";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Không thể lưu FAQ.");
      const saved = (await res.json()) as FaqItem;

      setFaqs((prev) => {
        if (!editingId) return [saved, ...prev];
        return prev.map((item) => (item.id === editingId ? saved : item));
      });
      toast.success(editingId ? "Đã cập nhật FAQ." : "Đã thêm FAQ mới.");
      resetForm();
      router.refresh();
    } catch {
      toast.error("Không thể lưu FAQ.");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(item: FaqItem) {
    try {
      setBusyId(item.id);
      const res = await fetch(`/api/faqs/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published })
      });
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại.");
      const saved = (await res.json()) as FaqItem;
      setFaqs((prev) => prev.map((faq) => (faq.id === saved.id ? saved : faq)));
      toast.success(saved.published ? "FAQ đã được xuất bản." : "FAQ đã chuyển về ẩn.");
      router.refresh();
    } catch {
      toast.error("Không thể cập nhật trạng thái FAQ.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeFaq(item: FaqItem) {
    try {
      setBusyId(item.id);
      const res = await fetch(`/api/faqs/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa FAQ thất bại.");
      setFaqs((prev) => prev.filter((faq) => faq.id !== item.id));
      toast.success("Đã xóa FAQ.");
      if (editingId === item.id) resetForm();
      router.refresh();
    } catch {
      toast.error("Không thể xóa FAQ.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingId ? "Chỉnh sửa FAQ" : "Thêm FAQ mới"}</h2>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Tạo mục mới
            </Button>
          )}
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="faq-question">Câu hỏi</Label>
            <Input
              id="faq-question"
              value={form.question}
              onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
              placeholder="Ví dụ: Mình chưa có kinh nghiệm thì có tham gia được không?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">Câu trả lời</Label>
            <Textarea
              id="faq-answer"
              rows={4}
              value={form.answer}
              onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
              placeholder="Mô tả ngắn gọn câu trả lời..."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="faq-location">Hiển thị ở</Label>
              <select
                id="faq-location"
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value as "JOIN" | "CONTACT" }))}
              >
                <option value="JOIN">Trang Tham gia</option>
                <option value="CONTACT">Trang Liên hệ</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-order">Thứ tự</Label>
              <Input
                id="faq-order"
                type="number"
                min={0}
                max={999}
                value={form.order}
                onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-published">Trạng thái</Label>
              <select
                id="faq-published"
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={form.published ? "published" : "hidden"}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.value === "published" }))}
              >
                <option value="published">Đang hiển thị</option>
                <option value="hidden">Đang ẩn</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={submitForm} disabled={submitting}>
              <Plus className="size-4" />
              {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm FAQ"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Câu hỏi</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[260px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedFaqs.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.question}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.answer}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{locationLabel(item.location)}</TableCell>
                <TableCell>{item.order}</TableCell>
                <TableCell>{item.published ? <Badge>Đang hiển thị</Badge> : <Badge variant="secondary">Đang ẩn</Badge>}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                      <Pencil className="size-3.5" />
                      Sửa
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busyId === item.id} onClick={() => togglePublished(item)}>
                      {busyId === item.id ? "Đang lưu..." : item.published ? "Ẩn" : "Xuất bản"}
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busyId === item.id} onClick={() => removeFaq(item)}>
                      <Trash2 className="size-3.5" />
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!orderedFaqs.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có FAQ nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
