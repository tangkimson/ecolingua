import { prisma } from "@/lib/prisma";
import { LeadsTable } from "@/components/admin/leads-table";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  let leads: Awaited<ReturnType<typeof prisma.lead.findMany>> = [];
  try {
    leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch {
    leads = [];
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Danh sách đăng ký</h1>
        <p className="text-sm text-muted-foreground">Lead từ form tham gia, liên hệ và newsletter.</p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
