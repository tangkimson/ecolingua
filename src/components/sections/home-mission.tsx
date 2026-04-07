import Image from "next/image";
import { HandHeart, Sprout, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mediaAssets } from "@/lib/mock-content";

const pillars = [
  {
    title: "Tiếp cận tri thức công bằng",
    description: "Giảm rào cản ngôn ngữ để kiến thức môi trường đến gần hơn với học sinh, sinh viên và cộng đồng địa phương."
  },
  {
    title: "Học đi đôi với làm",
    description: "Kết hợp nội dung giáo dục khí hậu với hoạt động thực tiễn để biến nhận thức thành hành động đo đếm được."
  },
  {
    title: "Lan tỏa thế hệ trẻ dẫn dắt",
    description: "Trao công cụ cho người trẻ trở thành hạt nhân truyền thông xanh trong trường học, tổ chức và địa phương."
  }
];

export function HomeMission() {
  return (
    <section className="section-padding bg-white">
      <div className="container grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative order-2 overflow-hidden rounded-3xl lg:order-1">
          <div className="relative h-72 md:h-[28rem]">
            <Image
              src={mediaAssets.mission}
              alt="Cộng đồng cùng trồng cây và xây dựng môi trường xanh"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/30 bg-black/35 p-4 text-white backdrop-blur">
            <p className="text-sm font-semibold">Từ bản dịch nhỏ đến thay đổi lớn</p>
            <p className="mt-1 text-xs text-white/80">Mỗi tài liệu dễ hiểu hơn là thêm một người có thể bắt đầu hành động.</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-eco-600">Điều EcoLingua Vietnam theo đuổi</p>
          <h2 className="title-section mt-2">Sứ mệnh của chúng tôi</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[Users2, HandHeart, Sprout].map((Icon, idx) => {
              const item = pillars[idx];
              return (
                <Card key={item.title} className="border-eco-100/80 bg-white">
                  <CardHeader>
                    <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-eco-100 text-eco-700">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className="text-xl text-eco-800">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
