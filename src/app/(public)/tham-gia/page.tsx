import Image from "next/image";
import { ExternalLink, Megaphone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FACEBOOK_FANPAGE_URL } from "@/lib/constants";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { faqsJoin, mediaAssets } from "@/lib/mock-content";

export default function JoinPage() {
  return (
    <div className="bg-eco-50/70">
      <section className="section-padding">
        <div className="container grid gap-8 lg:grid-cols-2">
          <div>
            <h1 className="title-display text-eco-900">Tham gia đội ngũ EcoLingua Vietnam</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Nếu bạn muốn học hỏi, thử sức và tạo tác động thật trong các dự án môi trường, EcoLingua đang chờ bạn.
            </p>
            <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Điền form để đội ngũ hiểu năng lực và mối quan tâm của bạn.</li>
              <li>Nhận hướng dẫn onboarding theo ban chuyên môn.</li>
              <li>Tham gia dự án thật cùng cố vấn và cộng đồng.</li>
            </ol>
            <div className="mt-6 rounded-2xl border border-eco-100 bg-white p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-eco-800">Vị trí đang ưu tiên tuyển</p>
              <p className="mt-2">Content & Social Media - Design - Translation</p>
            </div>
            <div className="mt-4 rounded-2xl border border-[#1877F2]/20 bg-[#1877F2]/5 p-4 text-sm text-eco-900/85">
              <p className="font-semibold">Thông báo tuyển thành viên được đăng trước trên Fanpage</p>
              <a
                href={FACEBOOK_FANPAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 font-semibold text-[#1877F2] hover:underline"
              >
                <Megaphone className="size-4" />
                Theo dõi Fanpage để nhận đợt tuyển mới
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <div className="relative mt-8 min-h-64 overflow-hidden rounded-3xl">
              <Image
                src={mediaAssets.join}
                alt="Nhóm tình nguyện viên hợp tác trong hoạt động môi trường"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
          <VolunteerForm sourcePage="tham-gia" />
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-eco-900">Câu hỏi thường gặp</h2>
          <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-eco-100 bg-white px-6">
            {faqsJoin.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
