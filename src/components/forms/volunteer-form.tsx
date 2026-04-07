"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VolunteerFormProps = {
  sourcePage: string;
};

export function VolunteerForm({ sourcePage }: VolunteerFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true);
      const payload = {
        fullName: String(formData.get("fullName") || ""),
        phone: String(formData.get("phone") || ""),
        email: String(formData.get("email") || ""),
        address: String(formData.get("address") || ""),
        birthYear: String(formData.get("birthYear") || ""),
        message: String(formData.get("message") || ""),
        sourcePage
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Submit thất bại");
      toast.success("Đăng ký thành công! Đội ngũ sẽ liên hệ bạn sớm.");
      (document.getElementById("volunteer-form") as HTMLFormElement | null)?.reset();
    } catch {
      toast.error("Không thể gửi form. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="volunteer-form"
      action={async (formData) => handleSubmit(formData)}
      className="surface-card space-y-4 rounded-2xl border-eco-100 p-6"
    >
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại *</Label>
          <Input name="phone" id="phone" required className="h-11 rounded-xl border-eco-200 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input name="email" id="email" type="email" required className="h-11 rounded-xl border-eco-200 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthYear">Năm sinh</Label>
          <Input name="birthYear" id="birthYear" placeholder="Ví dụ: 1999" className="h-11 rounded-xl border-eco-200 bg-white" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Địa chỉ</Label>
        <Input name="address" id="address" className="h-11 rounded-xl border-eco-200 bg-white" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Bạn muốn tham gia hoạt động nào?</Label>
        <Textarea name="message" id="message" className="rounded-xl border-eco-200 bg-white" />
      </div>
      <p className="text-xs text-muted-foreground">Thông tin của bạn chỉ được dùng để điều phối hoạt động cộng đồng.</p>
      <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">
        {loading ? "Đang gửi..." : "Đăng ký ngay"}
      </Button>
    </form>
  );
}
