import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mediaAssets } from "@/lib/mock-content";

const activityItems = ["Dịch tài liệu khí hậu", "Workshop cộng đồng", "Chiến dịch truyền thông xanh"];

export function HomeHighlights() {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <h2 className="title-section">Hoạt động và truyền thông</h2>
        <Tabs defaultValue="activities" className="mt-6">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-eco-50 p-2">
            <TabsTrigger value="activities" className="rounded-xl data-[state=active]:bg-white">
              Hoạt động nổi bật
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-xl data-[state=active]:bg-white">
              Báo chí
            </TabsTrigger>
            <TabsTrigger value="awards" className="rounded-xl data-[state=active]:bg-white">
              Thành tựu
            </TabsTrigger>
            <TabsTrigger value="tips" className="rounded-xl data-[state=active]:bg-white">
              Sống xanh
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-4 md:grid-cols-3">
              {activityItems.map((item) => (
                <Card key={item} className="border-eco-100/80">
                  <CardHeader>
                    <CardTitle className="text-lg">{item}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Kết hợp kiến thức và thực hành để cộng đồng hiểu đúng, làm đúng và duy trì thói quen bền vững.
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="relative min-h-72 overflow-hidden rounded-2xl">
              <Image
                src={mediaAssets.activity}
                alt="Tình nguyện viên đang tham gia hoạt động bảo vệ môi trường"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Thông điệp của EcoLingua Vietnam tập trung vào &quot;khí hậu dễ hiểu - hành động dễ bắt đầu&quot;, phù hợp xu hướng
            truyền thông phát triển bền vững và giáo dục cộng đồng hiện nay. Theo UNEP, mạng lưới Youth and Education Alliance đang
            thúc đẩy vai trò của người trẻ và giáo dục trong chuyển đổi xanh trên toàn cầu.
          </TabsContent>
          <TabsContent value="awards" className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Dự án được xây dựng bởi đội ngũ trẻ giàu tinh thần dấn thân, định hướng tạo tác động xã hội từ tri thức đáng tin cậy.
            Chúng tôi ưu tiên giá trị bền vững, tính bao trùm và khả năng nhân rộng thay vì các chiến dịch ngắn hạn theo phong trào.
          </TabsContent>
          <TabsContent value="tips" className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Bắt đầu từ ba thói quen đơn giản: phân loại rác tại nguồn, giảm nhựa dùng một lần và ưu tiên tiêu dùng có trách nhiệm.
            Sự thay đổi nhỏ nhưng duy trì đều đặn là nền tảng cho tác động môi trường dài hạn.
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
