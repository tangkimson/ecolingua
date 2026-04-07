"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Eye, Trash2 } from "lucide-react";
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

  const selectedLead = useMemo(
    () => filteredLeads.find((item) => item.id === selectedLeadId) || filteredLeads[0] || null,
    [filteredLeads, selectedLeadId]
  );

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
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Tìm theo tên, email, SĐT..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source === "ALL" ? "Tất cả nguồn gửi" : sourceLabel(source)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
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
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === lead.id}
                          onClick={() => deleteLead(lead.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredLeads.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Không có dữ liệu phù hợp bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="text-base font-semibold">Chi tiết đăng ký</h3>
          {selectedLead ? (
            <div className="mt-3 space-y-3 text-sm">
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
              <p>
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
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="mb-1 font-semibold">Nội dung quan tâm</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{selectedLead.message || "Không có"}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Chọn một bản ghi để xem chi tiết.</p>
          )}
        </div>
      </div>
    </div>
  );
}
