import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LeadItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  sourcePage: string;
  status: string;
  createdAt: Date;
};

export function LeadsTable({ leads }: { leads: LeadItem[] }) {
  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Họ tên</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Nguồn</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thời gian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.fullName}</TableCell>
              <TableCell>
                <p>{lead.email}</p>
                <p className="text-xs text-muted-foreground">{lead.phone}</p>
              </TableCell>
              <TableCell>{lead.sourcePage}</TableCell>
              <TableCell>
                <Badge variant={lead.status === "NEW" ? "default" : "secondary"}>{lead.status}</Badge>
              </TableCell>
              <TableCell>{format(lead.createdAt, "dd/MM/yyyy HH:mm", { locale: vi })}</TableCell>
            </TableRow>
          ))}
          {!leads.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Chưa có dữ liệu lead.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
