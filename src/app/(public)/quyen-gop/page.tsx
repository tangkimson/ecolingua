import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { mediaAssets } from "@/lib/mock-content";

export default function DonatePage() {
  return (
    <div className="bg-white">
      <section className="section-padding relative overflow-hidden bg-eco-900 text-white">
        <Image
          src={mediaAssets.donate}
          alt="Khung cảnh thiên nhiên Việt Nam"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-eco-950/85 to-eco-700/70" />
        <div className="container relative">
          <h1 className="title-display">Quyên góp vì môi trường</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-eco-100">
            Mỗi đóng góp giúp EcoLingua duy trì hoạt động dịch thuật, sản xuất học liệu mở và tổ chức chương trình giáo dục khí hậu
            cho cộng đồng.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-eco-100">
            Nguồn lực được ưu tiên cho nội dung chất lượng, đào tạo cộng đồng và triển khai các sáng kiến môi trường tại địa phương
            theo hướng minh bạch, đo đếm được tác động.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="yellow" className="rounded-full" asChild>
              <Link href="/lien-he">Liên hệ quyên góp</Link>
            </Button>
            <Button variant="outline" className="rounded-full border-white bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
              <Link href="/tham-gia">Tham gia hoạt động</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
