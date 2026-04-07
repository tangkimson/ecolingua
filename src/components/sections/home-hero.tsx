import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { mediaAssets } from "@/lib/mock-content";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-eco-950 via-eco-800 to-eco-600 py-16 text-white md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_35%)]" />
      <div className="pointer-events-none absolute -right-14 -top-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="container relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-eco-100">
            <Leaf className="size-3.5" />
            EcoLingua Vietnam
          </p>
          <h1 className="title-display mt-5 max-w-3xl text-balance">
            Kết nối ngôn ngữ và tri thức để nhiều người cùng hành động vì khí hậu
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-eco-100 md:text-lg">
            EcoLingua Vietnam dịch, đơn giản hóa và lan tỏa kiến thức môi trường bằng tiếng Việt và ngôn ngữ gần gũi với cộng
            đồng, giúp người trẻ, trường học và tổ chức địa phương bắt đầu từ những thay đổi nhỏ nhưng bền bỉ.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="yellow" className="rounded-full">
              <Link href="/tham-gia">
                Tham gia cùng EcoLingua
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/55 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="#hoat-dong">Khám phá hoạt động</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-eco-100">
            {["Dịch thuật khí hậu", "Giáo dục cộng đồng", "Hành động địa phương"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                <Sparkles className="size-3.5 text-amber-300" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative fade-up lg:ml-auto lg:max-w-xl">
          <div className="surface-card overflow-hidden border-white/10 bg-white/10 p-2 shadow-[0_25px_55px_-30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="relative h-72 overflow-hidden rounded-2xl md:h-[22rem]">
              <Image
                src={mediaAssets.homeHero}
                alt="Tình nguyện viên cùng dọn rác và bảo vệ môi trường"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 540px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
