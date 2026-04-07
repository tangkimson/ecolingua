"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Eye, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LeadItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  sourcePage: string;
  volunteerPositionTitle: string | null;
  message: string | null;
  birthYear: string | null;
  address: string | null;
  status: string;
  createdAt: Date | string;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "NEW", label: "Mới" },
  { value: "IN_REVIEW", label: "Đang xử lý" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "RESOLVED", label: "Hoàn tất" },
  { value: "ARCHIVED", label: "Lưu trữ" },
  { value: "SPAM", label: "Spam" }
];

function sourceLabel(sourcePage: string) {
  if (sourcePage === "tham-gia") return "Đăng ký cộng tác";
  if (sourcePage === "lien-he") return "Liên hệ";
  if (sourcePage === "newsletter-home") return "Newsletter";
  return sourcePage;
}

function statusLabel(status: string) {
  switch (status) {
    case "NEW":
      return "Mới";
    case "IN_REVIEW":
      return "Đang xử lý";
    case "CONTACTED":
      return "Đã liên hệ";
    case "RESOLVED":
      return "Hoàn tất";
    case "ARCHIVED":
      return "Lưu trữ";
    case "SPAM":
      return "Spam";
    default:
      return status;
  }
}

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "NEW") return "default";
  if (status === "SPAM") return "destructive";
  if (status === "CONTACTED" || status === "RESOLVED") return "outline";
  return "secondary";
}

export function LeadsTable({ leads: initialLeads }: { leads: LeadItem[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sourceOptions = useMemo(() => {
    const uniqueSources = Array.from(new Set(leads.map((item) => item.sourcePage)));
    return ["ALL", ...uniqueSources];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      const matchesSource = sourceFilter === "ALL" || lead.sourcePage === sourceFilter;
      const matchesQuery =
        !normalizedQuery ||
        lead.fullName.toLowerCase().includes(normalizedQuery) ||
        lead.email.toLowerCase().includes(normalizedQuery) ||
        lead.phone.toLowerCase().includes(normalizedQuery) ||
        lead.volunteerPositionTitle?.toLowerCase().includes(normalizedQuery) ||
        lead.address?.toLowerCase().includes(normalizedQuery) ||
        lead.message?.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesSource && matchesQuery;
    });
  }, [leads, query, statusFilter, sourceFilter]);

  const leadStats = useMemo(() => {
    let newCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;

    for (const lead of leads) {
      if (lead.status === "NEW") newCount += 1;
      if (lead.status === "IN_REVIEW" || lead.status === "CONTACTED") inProgressCount += 1;
      if (lead.status === "RESOLVED") resolvedCount += 1;
    }

    return {
      total: leads.length,
      newCount,
      inProgressCount,
      resolvedCount
    };
  }, [leads]);

  const selectedLead = useMemo(
    () => leads.find((item) => item.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  useEffect(() => {
    if (!selectedLeadId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedLeadId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedLeadId]);

  async function updateLeadStatus(id: string, status: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || "Không thể cập nhật trạng thái.");
      }
      const saved = (await res.json()) as LeadItem;
      setLeads((prev) => prev.map((item) => (item.id === id ? { ...item, status: saved.status } : item)));
      toast.success("Đã cập nhật trạng thái.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteLead(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || "Không thể xóa dữ liệu đăng ký.");
      }
      setLeads((prev) => prev.filter((item) => item.id !== id));
      if (selectedLeadId === id) setSelectedLeadId(null);
      toast.success("Đã xóa bản ghi.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa bản ghi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm theo tên, email, SĐT..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="Lọc lead theo trạng thái"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc lead theo nguồn gửi"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source === "ALL" ? "Tất cả nguồn gửi" : sourceLabel(source)}
              </option>
            ))}
          </select>
          <div className="inline-flex items-center justify-center rounded-lg border px-3 text-sm text-muted-foreground">
            {filteredLeads.length} kết quả
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Tổng đăng ký</p>
          <p className="mt-1 text-2xl font-semibold">{leadStats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Mới nhận</p>
          <p className="mt-1 text-2xl font-semibold">{leadStats.newCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Đang xử lý</p>
          <p className="mt-1 text-2xl font-semibold">{leadStats.inProgressCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-muted-foreground">Hoàn tất</p>
          <p className="mt-1 text-2xl font-semibold">{leadStats.resolvedCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="w-[220px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.fullName}</TableCell>
                  <TableCell>
                    <p>{lead.email}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </TableCell>
                  <TableCell>{sourceLabel(lead.sourcePage)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(lead.status)}>{statusLabel(lead.status)}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedLeadId(lead.id)}>
                        <Eye className="size-3.5" />
                        Chi tiết
                      </Button>
                      <select
                        aria-label={`Cập nhật trạng thái cho ${lead.fullName}`}
                        className="h-9 rounded-md border border-input bg-white px-2 text-xs"
                        value={lead.status}
                        disabled={busyId === lead.id}
                        onChange={(event) => updateLeadStatus(lead.id, event.target.value)}
                      >
                        {STATUS_OPTIONS.filter((option) => option.value !== "ALL").map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" variant="destructive" disabled={busyId === lead.id} onClick={() => deleteLead(lead.id)}>
                        <Trash2 className="size-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredLeads.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Không có dữ liệu phù hợp bộ lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            setSelectedLeadId(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-xl border bg-white p-5" role="dialog" aria-modal="true" aria-labelledby="lead-detail-title">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <h3 id="lead-detail-title" className="text-lg font-semibold">
                  Chi tiết đăng ký
                </h3>
                <p className="text-sm text-muted-foreground">Thông tin đầy đủ của người gửi biểu mẫu.</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Đóng chi tiết đăng ký" onClick={() => setSelectedLeadId(null)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <p>
                <span className="font-semibold">Họ tên:</span> {selectedLead.fullName}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {selectedLead.email}
              </p>
              <p>
                <span className="font-semibold">Số điện thoại:</span> {selectedLead.phone}
              </p>
              <p>
                <span className="font-semibold">Nguồn:</span> {sourceLabel(selectedLead.sourcePage)}
              </p>
              <p>
                <span className="font-semibold">Vị trí đăng ký:</span> {selectedLead.volunteerPositionTitle || "Không có"}
              </p>
              <p>
                <span className="font-semibold">Năm sinh:</span> {selectedLead.birthYear || "Không có"}
              </p>
              <p className="md:col-span-2">
                <span className="font-semibold">Địa chỉ:</span> {selectedLead.address || "Không có"}
              </p>
              <p>
                <span className="font-semibold">Trạng thái:</span>{" "}
                <Badge variant={statusBadgeVariant(selectedLead.status)}>{statusLabel(selectedLead.status)}</Badge>
              </p>
              <p>
                <span className="font-semibold">Thời gian gửi:</span>{" "}
                {format(new Date(selectedLead.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </p>
            </div>

            <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
              <p className="mb-1 font-semibold">Nội dung quan tâm</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{selectedLead.message || "Không có"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
