import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  const [posts, leads, notifications] = await Promise.all([
    prisma.post.count(),
    prisma.lead.count(),
    prisma.adminNotification.findMany({
      take: 8,
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Theo dõi nhanh dữ liệu website.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tổng bài viết</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-eco-700">{posts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tổng lead</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-eco-700">{leads}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông báo mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <p className="font-semibold">{item.type}</p>
              <p className="text-muted-foreground">{item.payload}</p>
            </div>
          ))}
          {!notifications.length && <p className="text-muted-foreground">Chưa có thông báo.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
