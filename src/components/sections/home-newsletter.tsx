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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function submitEmail() {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setErrorMessage("Vui lòng nhập email hợp lệ.");
        return;
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Newsletter Subscriber",
          phone: "000000000",
          email: normalizedEmail,
          sourcePage: "newsletter-home",
          message: "Đăng ký nhận bản tin"
        })
      });

      const payload = (await res.json()) as { error?: string | { fieldErrors?: Record<string, string[] | undefined> } };
      if (!res.ok) {
        if (typeof payload.error === "string") {
          setErrorMessage(payload.error);
        } else if (payload.error?.fieldErrors?.email?.[0]) {
          setErrorMessage(payload.error.fieldErrors.email[0]);
        } else {
          setErrorMessage("Không thể đăng ký lúc này.");
        }
        return;
      }

      setEmail("");
      setSuccessMessage("Đăng ký thành công. Bạn sẽ nhận bản tin mới từ EcoLingua.");
      toast.success("Đăng ký nhận tin thành công.");
    } catch {
      setErrorMessage("Không thể đăng ký lúc này.");
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
              <form
                className="mt-6 max-w-xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitEmail();
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="h-11 rounded-full border-eco-200 bg-white"
                    aria-label="Email đăng ký nhận bản tin"
                    aria-invalid={Boolean(errorMessage)}
                  />
                  <Button type="submit" disabled={loading || !email.trim()} variant="yellow" className="h-11 rounded-full px-6">
                    {loading ? "Đang gửi..." : "Đăng ký"}
                  </Button>
                </div>
              </form>
              {errorMessage ? (
                <p role="alert" aria-live="assertive" className="mt-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p aria-live="polite" className="mt-3 text-sm font-medium text-eco-800">
                  {successMessage}
                </p>
              ) : null}
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
