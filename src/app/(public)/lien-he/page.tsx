import { AtSign, Clock3, Mail, MapPin, Megaphone, MessageSquare } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FACEBOOK_FANPAGE_URL, INSTAGRAM_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const dbFaqs = await prisma.faq.findMany({
    where: { location: "CONTACT", published: true },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
  });
  const items = dbFaqs.map((item) => ({ id: item.id, q: item.question, a: item.answer }));

  return (
    <div className="bg-eco-50/70">
      <section className="section-padding">
        <div className="container grid gap-8 lg:grid-cols-2">
          <div>
            <h1 className="title-display text-eco-900">Kết nối cùng EcoLingua Vietnam</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Liên hệ để tham gia hoạt động cộng đồng, hợp tác truyền thông, hoặc đồng phát triển các chương trình giáo dục môi trường.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <p>
                <strong>Email:</strong> ecolinguavietnam@gmail.com
              </p>
              <p>
                <strong>Fanpage:</strong> Ecolingua Vietnam
              </p>
              <p>
                <strong>Instagram:</strong> @ecolingua.vn
              </p>
              <p>
                <strong>Phạm vi:</strong> TP. HCM - Hoạt động toàn quốc
              </p>
            </div>
            <div className="surface-card mt-8 rounded-3xl border-eco-100 p-6">
              <h2 className="text-lg font-bold text-eco-900">Phản hồi nhanh, đúng đầu mối</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gửi nội dung ngắn gọn theo mục tiêu của bạn để đội ngũ phân luồng và phản hồi nhanh hơn.
              </p>
              <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>1. Mô tả ngắn nhu cầu hợp tác hoặc tham gia.</li>
                <li>2. Đính kèm mốc thời gian mong muốn.</li>
                <li>3. Để lại đầu mối liên hệ để đội ngũ phản hồi.</li>
              </ol>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-eco-900">
                    <Clock3 className="size-4 text-eco-700" />
                    Thời gian phản hồi
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Trong 24-48 giờ làm việc</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-eco-900">
                    <MapPin className="size-4 text-eco-700" />
                    Khu vực triển khai
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">TP.HCM và các dự án toàn quốc</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-muted-foreground">
                <p className="font-medium text-eco-900">Gợi ý nội dung email</p>
                <p className="mt-1">
                  Nêu rõ mục tiêu hợp tác, đối tượng hưởng lợi và mốc thời gian dự kiến để đội ngũ hỗ trợ phù hợp.
                </p>
              </div>
            </div>
          </div>
          <div className="surface-card space-y-4 rounded-2xl border-eco-100 p-6">
            <div>
              <h2 className="text-xl font-bold text-eco-900">Kênh liên hệ chính thức</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Để đảm bảo phản hồi nhanh và chính xác, EcoLingua hiện tiếp nhận liên hệ trực tiếp qua email, Fanpage và Instagram.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-eco-900">Email hợp tác</p>
              <a href="mailto:ecolinguavietnam@gmail.com" className="inline-flex items-center gap-2 text-eco-700 hover:underline">
                <Mail className="size-4" />
                ecolinguavietnam@gmail.com
              </a>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-eco-900">Fanpage Facebook</p>
              <a href={FACEBOOK_FANPAGE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-eco-700 hover:underline">
                <Megaphone className="size-4" />
                EcoLingua Vietnam
              </a>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-eco-900">Instagram</p>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-eco-700 hover:underline">
                <AtSign className="size-4" />
                @ecolingua.vn
              </a>
            </div>
            <Button asChild className="w-full rounded-xl">
              <a href="mailto:ecolinguavietnam@gmail.com?subject=Li%C3%AAn%20h%E1%BB%87%20h%E1%BB%A3p%20t%C3%A1c%20c%C3%B9ng%20EcoLingua%20Vietnam">Gửi email ngay</a>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <a href={FACEBOOK_FANPAGE_URL} target="_blank" rel="noopener noreferrer">
                Nhắn qua fanpage
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                Theo dõi Instagram
              </a>
            </Button>
            <div className="rounded-xl border bg-eco-50/70 p-4 text-sm text-eco-900">
              <p className="inline-flex items-center gap-2 font-medium">
                <MessageSquare className="size-4 text-eco-700" />
                Cần trao đổi chi tiết hơn?
              </p>
              <p className="mt-1 text-muted-foreground">
                Bạn có thể gửi trước thông tin qua email, sau đó đội ngũ sẽ hẹn lịch trao đổi phù hợp.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-eco-900">Câu hỏi thường gặp</h2>
          <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-eco-100 bg-white px-6">
            {items.length ? (
              items.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <p className="py-6 text-sm text-muted-foreground">Chưa có câu hỏi nào cho mục này.</p>
            )}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
