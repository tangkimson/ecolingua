import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactForm } from "@/components/forms/contact-form";
import { mediaAssets } from "@/lib/mock-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const dbFaqs = await prisma.faq.findMany({
    where: { location: "CONTACT", published: true },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
  });
  const items = dbFaqs.map((item) => ({ q: item.question, a: item.answer }));

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
          <ContactForm sourcePage="lien-he" />
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-eco-900">Câu hỏi thường gặp</h2>
          <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-eco-100 bg-white px-6">
            {items.length ? (
              items.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
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
