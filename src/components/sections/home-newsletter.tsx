"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaAssets } from "@/lib/mock-content";

export function HomeNewsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitEmail() {
    try {
      setLoading(true);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Newsletter Subscriber",
          phone: "000000000",
          email,
          sourcePage: "newsletter-home",
          message: "Đăng ký nhận bản tin"
        })
      });
      if (!res.ok) throw new Error("Failed");
      setEmail("");
      toast.success("Đăng ký nhận tin thành công.");
    } catch {
      toast.error("Không thể đăng ký lúc này.");
    } finally {
      setLoading(false);
    }
  }

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
              <div className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="h-11 rounded-full border-eco-200 bg-white"
                />
                <Button disabled={loading || !email} onClick={submitEmail} variant="yellow" className="h-11 rounded-full px-6">
                  {loading ? "Đang gửi..." : "Đăng ký"}
                </Button>
              </div>
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
