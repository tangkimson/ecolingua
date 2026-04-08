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

  const [posts, faqs] = await Promise.all([
    prisma.post.count(),
    prisma.faq.count()
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
            <CardTitle>Tổng FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-eco-700">{faqs}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
