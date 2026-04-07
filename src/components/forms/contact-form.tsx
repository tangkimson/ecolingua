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

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true);
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

      if (!res.ok) throw new Error("Submit thất bại");
      toast.success("Đã gửi liên hệ thành công.");
      (document.getElementById("contact-form") as HTMLFormElement | null)?.reset();
    } catch {
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
        <Input name="fullName" id="fullName" required className="h-11 rounded-xl border-eco-200 bg-white" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại *</Label>
          <Input name="phone" id="phone" required className="h-11 rounded-xl border-eco-200 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input name="email" id="email" type="email" required className="h-11 rounded-xl border-eco-200 bg-white" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Nội dung *</Label>
        <Textarea name="message" id="message" required rows={5} className="rounded-xl border-eco-200 bg-white" />
      </div>
      <p className="text-xs text-muted-foreground">Bằng việc gửi form, bạn đồng ý để đội ngũ liên hệ theo thông tin đã cung cấp.</p>
      <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
        {loading ? "Đang gửi..." : "Gửi liên hệ"}
      </Button>
    </form>
  );
}
