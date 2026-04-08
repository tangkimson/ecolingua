import Image from "next/image";
import { Mail, Megaphone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FACEBOOK_FANPAGE_URL } from "@/lib/constants";
import { mediaAssets } from "@/lib/mock-content";
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
                <strong>Phạm vi:</strong> TP. HCM - Hoạt động toàn quốc
              </p>
            </div>
            <div className="relative mt-8 min-h-64 overflow-hidden rounded-3xl">
              <Image
                src={mediaAssets.contact}
                alt="Đội ngũ đang trao đổi hợp tác cộng đồng"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="surface-card space-y-4 rounded-2xl border-eco-100 p-6">
            <div>
              <h2 className="text-xl font-bold text-eco-900">Kênh liên hệ chính thức</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Để đảm bảo phản hồi nhanh và chính xác, EcoLingua hiện tiếp nhận liên hệ trực tiếp qua email và Fanpage.
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
            <Button asChild className="w-full rounded-xl">
              <a href="mailto:ecolinguavietnam@gmail.com">Gửi email ngay</a>
            </Button>
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
