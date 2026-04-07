import { prisma } from "@/lib/prisma";
import { FaqsManager } from "@/components/admin/faqs-manager";

export default async function AdminFaqsPage() {
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
