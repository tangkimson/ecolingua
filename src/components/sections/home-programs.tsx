import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { programs } from "@/lib/mock-content";
import { mediaAssets } from "@/lib/mock-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HomePrograms() {
  return (
    <section id="hoat-dong" className="section-padding bg-gradient-to-b from-eco-50 via-white to-eco-50/40">
      <div className="container">
        <h2 className="title-section">Các chương trình trọng điểm</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tập trung vào kiến thức dễ tiếp cận, năng lực thực hành và mạng lưới cộng đồng để tạo thay đổi dài hạn.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {programs.map((program, index) => (
            <Card key={program.title} className="overflow-hidden border-eco-100 bg-white">
              <div className="relative h-52">
                <Image
                  src={mediaAssets.programs[index]}
                  alt={program.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-eco-800">{program.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{program.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild size="lg" className="rounded-full">
            <a href="/tham-gia">
              Xem biểu mẫu tham gia
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
