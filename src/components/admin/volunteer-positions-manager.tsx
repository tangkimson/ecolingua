"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type VolunteerPositionItem = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  order: number;
  updatedAt: Date | string;
};

type PositionFormValue = {
  title: string;
  description: string;
  published: boolean;
  order: number;
};

const DEFAULT_FORM: PositionFormValue = {
  title: "",
  description: "",
  published: true,
  order: 0
};

export function VolunteerPositionsManager({ initialPositions }: { initialPositions: VolunteerPositionItem[] }) {
  const router = useRouter();
  const [positions, setPositions] = useState(initialPositions);
  const [form, setForm] = useState<PositionFormValue>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const orderedPositions = useMemo(
    () =>
      [...positions].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }),
    [positions]
  );

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  }

  function startEdit(item: VolunteerPositionItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      published: item.published,
      order: item.order
    });
  }

  function validateForm(value: PositionFormValue) {
    if (value.title.trim().length < 2) {
      toast.error("Tên vị trí cần ít nhất 2 ký tự.");
      return false;
    }
    if (value.description.trim().length > 500) {
      toast.error("Mô tả vị trí tối đa 500 ký tự.");
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
      title: form.title.trim(),
      description: form.description.trim(),
      published: form.published,
      order: form.order
    };
    if (!validateForm(payload)) return;

    try {
      setSubmitting(true);
      const endpoint = editingId ? `/api/volunteer-positions/${editingId}` : "/api/volunteer-positions";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Không thể lưu vị trí.");
      const saved = (await res.json()) as VolunteerPositionItem;

      setPositions((prev) => {
        if (!editingId) return [saved, ...prev];
        return prev.map((item) => (item.id === editingId ? saved : item));
      });
      toast.success(editingId ? "Đã cập nhật vị trí." : "Đã thêm vị trí mới.");
      resetForm();
      router.refresh();
    } catch {
      toast.error("Không thể lưu vị trí.");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(item: VolunteerPositionItem) {
    try {
      setBusyId(item.id);
      const res = await fetch(`/api/volunteer-positions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published })
      });
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại.");
      const saved = (await res.json()) as VolunteerPositionItem;
      setPositions((prev) => prev.map((position) => (position.id === saved.id ? saved : position)));
      toast.success(saved.published ? "Vị trí đã được hiển thị." : "Vị trí đã chuyển về ẩn.");
      router.refresh();
    } catch {
      toast.error("Không thể cập nhật trạng thái vị trí.");
    } finally {
      setBusyId(null);
    }
  }

  async function removePosition(item: VolunteerPositionItem) {
    try {
      setBusyId(item.id);
      const res = await fetch(`/api/volunteer-positions/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa vị trí thất bại.");
      setPositions((prev) => prev.filter((position) => position.id !== item.id));
      if (editingId === item.id) resetForm();
      toast.success("Đã xóa vị trí.");
      router.refresh();
    } catch {
      toast.error("Không thể xóa vị trí.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingId ? "Chỉnh sửa vị trí" : "Thêm vị trí mới"}</h2>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Tạo mục mới
            </Button>
          )}
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="position-title">Tên vị trí</Label>
            <Input
              id="position-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Ví dụ: Cộng tác viên Content"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-description">Mô tả ngắn</Label>
            <Textarea
              id="position-description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Mô tả nhiệm vụ/chuyên môn chính (không bắt buộc)..."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-order">Thứ tự</Label>
              <Input
                id="position-order"
                type="number"
                min={0}
                max={999}
                value={form.order}
                onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-published">Trạng thái</Label>
              <select
                id="position-published"
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
              {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm vị trí"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vị trí</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[260px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedPositions.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description || "Không có mô tả"}</p>
                </TableCell>
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
                    <Button size="sm" variant="destructive" disabled={busyId === item.id} onClick={() => removePosition(item)}>
                      <Trash2 className="size-3.5" />
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!orderedPositions.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Chưa có vị trí nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
