"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail: email })
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Đã cập nhật email nhận form.");
    } catch {
      toast.error("Không thể lưu cài đặt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="notificationEmail">Email nhận form từ website</Label>
        <Input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Đang lưu..." : "Lưu cài đặt"}
      </Button>
    </form>
  );
}
