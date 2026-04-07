"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VolunteerFormProps = {
  sourcePage: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type LeadValidationErrors = {
  fieldErrors?: Record<string, string[]>;
};

export function VolunteerForm({ sourcePage }: VolunteerFormProps) {
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const captchaEnabled = Boolean(captchaSiteKey);

  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaScriptLoaded, setCaptchaScriptLoaded] = useState(false);

  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);

  const renderCaptchaWidget = useCallback(() => {
    if (!captchaEnabled || !captchaScriptLoaded || !captchaContainerRef.current || !window.turnstile) return;
    captchaContainerRef.current.innerHTML = "";
    captchaWidgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
      sitekey: captchaSiteKey,
      theme: "light",
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken("")
    });
  }, [captchaEnabled, captchaScriptLoaded, captchaSiteKey]);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    if (window.turnstile) {
      window.turnstile.reset(captchaWidgetIdRef.current || undefined);
    }
  }, []);

  useEffect(() => {
    renderCaptchaWidget();
  }, [renderCaptchaWidget]);

  function getFieldError(name: string) {
    return fieldErrors[name];
  }

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true);
      setSubmitMessage(null);
      setErrorMessage(null);
      setFieldErrors({});

      const payload = {
        fullName: String(formData.get("fullName") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || ""),
        address: String(formData.get("address") || ""),
        birthYear: String(formData.get("birthYear") || ""),
        message: String(formData.get("message") || ""),
        website: String(formData.get("website") || ""),
        captchaToken,
        sourcePage
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responsePayload = (await res.json()) as {
        success?: boolean;
        error?: string | LeadValidationErrors;
      };
      if (!res.ok) {
        if (typeof responsePayload.error === "string") {
          setErrorMessage(responsePayload.error);
        } else if (responsePayload.error?.fieldErrors) {
          const nextFieldErrors: Record<string, string> = {};
          Object.entries(responsePayload.error.fieldErrors).forEach(([field, messages]) => {
            if (messages?.[0]) nextFieldErrors[field] = messages[0];
          });
          setFieldErrors(nextFieldErrors);
          setErrorMessage("Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu.");
        } else {
          setErrorMessage("Không thể gửi form lúc này. Vui lòng thử lại.");
        }
        resetCaptcha();
        return;
      }

      setSubmitMessage("Đăng ký thành công! Đội ngũ sẽ liên hệ bạn sớm.");
      toast.success("Đăng ký thành công! Đội ngũ sẽ liên hệ bạn sớm.");
      (document.getElementById("volunteer-form") as HTMLFormElement | null)?.reset();
      setCaptchaToken("");
      resetCaptcha();
    } catch {
      setErrorMessage("Không thể gửi form. Vui lòng thử lại.");
      toast.error("Không thể gửi form. Vui lòng thử lại.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="volunteer-form" action={async (formData) => handleSubmit(formData)} className="surface-card space-y-4 rounded-2xl border-eco-100 p-6">
      {captchaEnabled ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setCaptchaScriptLoaded(true)}
        />
      ) : null}
      <div>
        <h2 className="text-xl font-bold text-eco-900">Đăng ký cộng tác</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Điền thông tin để đội ngũ EcoLingua kết nối bạn với vai trò phù hợp.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên *</Label>
          <Input name="fullName" id="fullName" required className="h-11 rounded-xl border-eco-200 bg-white" />
          {getFieldError("fullName") ? <p className="text-xs text-red-600">{getFieldError("fullName")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại *</Label>
          <Input name="phone" id="phone" required className="h-11 rounded-xl border-eco-200 bg-white" />
          {getFieldError("phone") ? <p className="text-xs text-red-600">{getFieldError("phone")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input name="email" id="email" type="email" required className="h-11 rounded-xl border-eco-200 bg-white" />
          {getFieldError("email") ? <p className="text-xs text-red-600">{getFieldError("email")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthYear">Năm sinh</Label>
          <Input name="birthYear" id="birthYear" placeholder="Ví dụ: 1999" className="h-11 rounded-xl border-eco-200 bg-white" />
          {getFieldError("birthYear") ? <p className="text-xs text-red-600">{getFieldError("birthYear")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Địa chỉ</Label>
        <Input name="address" id="address" className="h-11 rounded-xl border-eco-200 bg-white" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Bạn muốn tham gia hoạt động nào?</Label>
        <Textarea name="message" id="message" className="rounded-xl border-eco-200 bg-white" />
        {getFieldError("message") ? <p className="text-xs text-red-600">{getFieldError("message")}</p> : null}
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {captchaEnabled ? (
        <div className="space-y-2">
          <Label>CAPTCHA chống bot</Label>
          <div ref={captchaContainerRef} className="min-h-[68px] rounded-md border border-dashed p-2" />
        </div>
      ) : null}

      {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}
      {submitMessage ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{submitMessage}</p> : null}

      <p className="text-xs text-muted-foreground">Thông tin của bạn chỉ được dùng để điều phối hoạt động cộng đồng.</p>
      <Button type="submit" disabled={loading || (captchaEnabled && !captchaToken)} className="h-11 w-full rounded-xl">
        {loading ? "Đang gửi..." : "Đăng ký ngay"}
      </Button>
    </form>
  );
}
