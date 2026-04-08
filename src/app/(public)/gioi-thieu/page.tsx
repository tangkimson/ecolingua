import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mediaAssets } from "@/lib/mock-content";

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="section-padding bg-eco-50">
        <div className="container grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge variant="secondary">Giới thiệu</Badge>
            <h1 className="title-display mt-3 text-eco-900">Câu chuyện EcoLingua Vietnam</h1>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              EcoLingua Vietnam ra đời từ một khoảng trống rất rõ: nhiều kiến thức môi trường quan trọng vẫn khó tiếp cận vì rào cản
              ngôn ngữ và cách diễn đạt học thuật.
            </p>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              Chúng tôi bắt đầu bằng việc dịch, đơn giản hóa và chia sẻ thông tin về biến đổi khí hậu theo cách gần gũi hơn, để nhiều
              người có thể hiểu, tham gia và hành động từ chính cộng đồng của mình.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-eco-700">
              <Sparkles className="size-4" />
              Tri thức dễ hiểu - hành động dễ bắt đầu
            </p>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-3xl">
            <Image
              src={mediaAssets.activity}
              alt="Cộng đồng tham gia hoạt động môi trường tại Việt Nam"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Tầm nhìn",
              content: "Một xã hội nơi mọi người, đặc biệt là người trẻ, đều có thể tiếp cận tri thức khí hậu bằng ngôn ngữ gần gũi."
            },
            {
              title: "Sứ mệnh",
              content:
                "Kết nối ngôn ngữ, giáo dục và truyền thông để biến thông tin môi trường thành năng lực hành động cho cộng đồng."
            },
            { title: "Giá trị cốt lõi", content: "Bao trùm - Chính xác - Hợp tác - Bền bỉ - Phụng sự cộng đồng." }
          ].map((item) => (
            <Card key={item.title} className="border-eco-100/80">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{item.content}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <div className="surface-card border-eco-100/90 p-5 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-stretch">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-eco-100/80 bg-eco-50 shadow-[0_16px_40px_-28px_rgba(16,24,40,0.45)] lg:aspect-auto lg:min-h-[420px]">
                <Image
                  src={mediaAssets.founder}
                  alt="Founder EcoLingua Vietnam - Nguyễn Thị Thảo Nhi (Vivian)"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-black/45 px-3 py-2 text-white backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-100">Founder</p>
                  <p className="text-sm font-semibold">Nguyễn Thị Thảo Nhi (Vivian)</p>
                </div>
              </div>
              <div className="flex h-full flex-col rounded-2xl border border-eco-100/80 bg-white p-5 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-eco-600">Founder Profile</p>
                <h2 className="mt-2 text-2xl font-bold text-eco-900 md:text-3xl">Người khởi tạo EcoLingua Vietnam</h2>
                <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  EcoLingua Vietnam được sáng lập bởi <strong>Nguyễn Thị Thảo Nhi (Vivian)</strong> - sinh viên Đại học Quốc tế, Đại học
                  Quốc gia TP.HCM, đồng thời là gương mặt trẻ tích cực trong các hoạt động giáo dục bền vững và truyền thông xã hội.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Từ trải nghiệm hoạt động thực tế, cô định hình EcoLingua theo hướng kiến tạo hệ sinh thái tri thức khí hậu dễ hiểu,
                  đáng tin cậy và có tính ứng dụng cho cộng đồng trẻ tại Việt Nam.
                </p>
                <div className="mt-5 grid gap-2 rounded-xl bg-eco-50/70 p-3 text-sm text-eco-800 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold">Định hướng:</span> SDG 13 - Hành động khí hậu
                  </p>
                  <p>
                    <span className="font-semibold">Vai trò:</span> Sáng lập và định hướng chiến lược
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["SDG 13 - Hành động khí hậu", "Giáo dục bền vững", "Lãnh đạo trẻ vì cộng đồng"].map((item) => (
                    <span key={item} className="rounded-full bg-eco-50 px-3 py-1 text-xs font-medium text-eco-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Card className="border-eco-100/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Giới thiệu & nền tảng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Theo báo Sinh Viên Việt Nam (Tiền Phong), Thảo Nhi được ghi nhận là hình mẫu tiêu biểu cho tinh thần dấn thân,
                    kết hợp thành tích học tập tốt với cam kết hoạt động cộng đồng.
                  </p>
                  <p>
                    Thảo Nhi tham gia và đại diện Việt Nam tại các diễn đàn quốc tế về phát triển bền vững như AUN Summer Camp 2024,
                    Regen Asia Summit 2025 và AUS 2025.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-eco-100/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Sứ mệnh cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Với định hướng SDG 13 (Hành động vì khí hậu), cô theo đuổi mục tiêu thu hẹp khoảng cách giữa tri thức chuyên ngành
                    và khả năng tiếp cận của cộng đồng.
                  </p>
                  <p>
                    Cô tin rằng ngôn ngữ không chỉ là công cụ giao tiếp, mà còn là chiếc cầu để mở ra cơ hội học tập công bằng và tạo
                    thay đổi tích cực cho nhiều nhóm xã hội.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-eco-100/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Thành tựu nổi bật</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Top thí sinh xuất sắc tại Hoa khôi Sinh viên Việt Nam 2024, cùng các danh hiệu liên quan đến hùng biện tiếng Anh
                    và hoạt động nhân ái.
                  </p>
                  <p>
                    Tham gia chia sẻ tại diễn đàn &quot;Tiếng nói sinh viên - Bước chuyển xanh, kiến tạo tương lai xanh&quot;, góp
                    phần lan tỏa tinh thần chuyển đổi xanh trong cộng đồng trẻ.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-eco-100/80 shadow-sm">
                <CardHeader>
                  <CardTitle>Vai trò trong EcoLingua Vietnam</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Định hình chiến lược phát triển dự án theo hướng lấy cộng đồng làm trung tâm, ưu tiên nội dung chính xác, dễ hiểu
                    và có tính bao trùm.
                  </p>
                  <p>
                    Kết nối đội ngũ truyền thông, thiết kế, dịch thuật và các đối tác để mở rộng hệ sinh thái tri thức xanh tại Việt
                    Nam.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
