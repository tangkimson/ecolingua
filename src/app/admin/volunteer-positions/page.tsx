import { prisma } from "@/lib/prisma";
import { VolunteerPositionsManager } from "@/components/admin/volunteer-positions-manager";

export default async function AdminVolunteerPositionsPage() {
  const positions = await prisma.volunteerPosition.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
  });

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
