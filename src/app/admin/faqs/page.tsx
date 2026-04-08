import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FaqsManager } from "@/components/admin/faqs-manager";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin/faqs")}`);
  }

  const faqs = await prisma.faq.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
  });
  const normalizedFaqs = faqs.map((item) => ({
    ...item,
    location: item.location === "CONTACT" ? "CONTACT" : "JOIN"
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý FAQ</h1>
        <p className="text-sm text-muted-foreground">Thêm, chỉnh sửa và xuất bản câu hỏi thường gặp cho trang Tham gia và Liên hệ.</p>
      </div>
      <FaqsManager initialFaqs={normalizedFaqs} />
    </div>
  );
}
