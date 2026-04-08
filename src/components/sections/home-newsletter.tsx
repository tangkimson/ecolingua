"use client";

import Image from "next/image";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaAssets } from "@/lib/mock-content";
export function HomeNewsletter() {
  return (
    <section className="section-padding bg-gradient-to-r from-eco-100 via-emerald-100 to-amber-100/80">
      <div className="container">
        <div className="surface-card overflow-hidden border-eco-200/80">
          <div className="grid items-stretch gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 md:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-eco-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-eco-700">
                <MailCheck className="size-3.5" />
                Bản tin EcoLingua
              </span>
              <h2 className="title-section mt-4 text-eco-900">Nhận bản tin khí hậu dễ hiểu mỗi tháng</h2>
              <p className="mt-3 max-w-2xl text-eco-900/75">
                Cập nhật tài liệu mới, cơ hội tham gia dự án và thông tin môi trường đáng tin cậy được chọn lọc cho cộng đồng.
              </p>
              <p className="mt-5 rounded-xl bg-white/70 px-4 py-3 text-sm text-eco-900/85">
                Gửi email tới{" "}
                <a href="mailto:ecolinguavietnam@gmail.com?subject=Đăng ký nhận bản tin EcoLingua" className="font-semibold text-eco-800 underline">
                  ecolinguavietnam@gmail.com
                </a>{" "}
                với tiêu đề “Đăng ký nhận bản tin EcoLingua” để được thêm vào danh sách nhận tin.
              </p>
              <Button variant="yellow" className="mt-4 rounded-full px-6" asChild>
                <a href="mailto:ecolinguavietnam@gmail.com?subject=Đăng ký nhận bản tin EcoLingua">Gửi email đăng ký</a>
              </Button>
            </div>
            <div className="relative min-h-72">
              <Image
                src={mediaAssets.newsletter}
                alt="Cảnh thiên nhiên xanh mát truyền cảm hứng lối sống bền vững"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
