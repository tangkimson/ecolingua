import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VolunteerPositionsManager } from "@/components/admin/volunteer-positions-manager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminVolunteerPositionsPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin/volunteer-positions")}`);
  }

  let positions: Awaited<ReturnType<typeof prisma.volunteerPosition.findMany>> = [];
  try {
    positions = await prisma.volunteerPosition.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
    });
  } catch {
    positions = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vị trí cộng tác viên</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý danh sách vị trí hiển thị ở trang Tham gia. Nếu không có vị trí nào đang hiển thị, form đăng ký sẽ tự khóa.
        </p>
      </div>
      <VolunteerPositionsManager initialPositions={positions} />
    </div>
  );
}
