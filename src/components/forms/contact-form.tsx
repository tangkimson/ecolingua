"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ContactFormProps = {
  sourcePage: string;
};

export function ContactForm({ sourcePage }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        message: String(formData.get("message") || ""),
        sourcePage
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responsePayload = (await res.json()) as {
        error?: string | { fieldErrors?: Record<string, string[] | undefined> };
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
          setErrorMessage("Không thể gửi liên hệ. Vui lòng thử lại.");
        }
        return;
      }

      setSubmitMessage("Đã gửi liên hệ thành công. Đội ngũ sẽ phản hồi sớm.");
      toast.success("Đã gửi liên hệ thành công.");
      (document.getElementById("contact-form") as HTMLFormElement | null)?.reset();
    } catch {
      setErrorMessage("Không thể gửi liên hệ. Vui lòng thử lại.");
      toast.error("Không thể gửi liên hệ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="contact-form"
      action={async (formData) => handleSubmit(formData)}
      className="surface-card space-y-4 rounded-2xl border-eco-100 p-6"
    >
      <div>
        <h2 className="text-xl font-bold text-eco-900">Gửi liên hệ hợp tác</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chúng tôi sẽ phản hồi trong vòng 24-48 giờ làm việc.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Họ và tên *</Label>
        <Input name="fullName" id="fullName" required className="h-11 rounded-xl border-eco-200 bg-white" aria-invalid={Boolean(getFieldError("fullName"))} />
        {getFieldError("fullName") ? <p className="text-xs text-red-600">{getFieldError("fullName")}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại *</Label>
          <Input name="phone" id="phone" required className="h-11 rounded-xl border-eco-200 bg-white" aria-invalid={Boolean(getFieldError("phone"))} />
          {getFieldError("phone") ? <p className="text-xs text-red-600">{getFieldError("phone")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input name="email" id="email" type="email" required className="h-11 rounded-xl border-eco-200 bg-white" aria-invalid={Boolean(getFieldError("email"))} />
          {getFieldError("email") ? <p className="text-xs text-red-600">{getFieldError("email")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Nội dung *</Label>
        <Textarea name="message" id="message" required rows={5} className="rounded-xl border-eco-200 bg-white" aria-invalid={Boolean(getFieldError("message"))} />
        {getFieldError("message") ? <p className="text-xs text-red-600">{getFieldError("message")}</p> : null}
      </div>
      {errorMessage ? (
        <p role="alert" aria-live="assertive" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {submitMessage ? (
        <p aria-live="polite" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {submitMessage}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">Bằng việc gửi form, bạn đồng ý để đội ngũ liên hệ theo thông tin đã cung cấp.</p>
      <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
        {loading ? "Đang gửi..." : "Gửi liên hệ"}
      </Button>
    </form>
  );
}
