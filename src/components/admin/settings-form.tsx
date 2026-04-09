"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({
  defaultGoogleFormUrl
}: {
  defaultGoogleFormUrl: string;
}) {
  const [googleFormUrl, setGoogleFormUrl] = useState(defaultGoogleFormUrl);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  async function parseJsonSafely<T>(res: Response) {
    try {
      return (await res.json()) as T;
    } catch {
      return {} as T;
    }
  }

  async function fetchTwoFactorStatus() {
    try {
      const res = await fetch("/api/admin/2fa", { cache: "no-store" });
      if (!res.ok) throw new Error("Cannot fetch 2FA status");
      const data = (await res.json()) as { enabled?: boolean };
      setTwoFactorEnabled(Boolean(data.enabled));
    } catch {
      setTwoFactorEnabled(false);
    }
  }

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleFormUrl
        })
      });
      const payload = (await res.json()) as { error?: string; googleFormUrl?: string | null };
      if (!res.ok) throw new Error(payload.error || "Update failed");
      setGoogleFormUrl(payload.googleFormUrl || "");
      toast.success("Đã cập nhật cài đặt.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cài đặt.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup2FA() {
    try {
      setTwoFactorLoading(true);
      const res = await fetch("/api/admin/2fa", { method: "POST" });
      const data = await parseJsonSafely<{ qrCodeDataUrl?: string; manualKey?: string; error?: string }>(res);
      if (!res.ok || !data.qrCodeDataUrl || !data.manualKey) throw new Error(data.error || "Setup failed");
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setManualKey(data.manualKey);
      setVerifyCode("");
      setTwoFactorEnabled(false);
      toast.success("Đã tạo QR. Hãy quét mã và nhập mã xác thực để bật 2FA.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể khởi tạo 2FA.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleEnable2FA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setTwoFactorLoading(true);
      const res = await fetch("/api/admin/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.replace(/\D/g, "").trim() })
      });
      const data = await parseJsonSafely<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Enable failed");

      setQrCodeDataUrl("");
      setManualKey("");
      setVerifyCode("");
      setTwoFactorEnabled(true);
      toast.success("Đã bật 2FA cho tài khoản admin.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mã xác thực không đúng hoặc đã hết hạn.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleDisable2FA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setTwoFactorLoading(true);
      const res = await fetch("/api/admin/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode.replace(/\D/g, "").trim()
        })
      });
      const data = await parseJsonSafely<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Disable failed");

      setDisablePassword("");
      setDisableCode("");
      setTwoFactorEnabled(false);
      toast.success("Đã tắt 2FA.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tắt 2FA. Kiểm tra lại mật khẩu và mã xác thực.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="googleFormUrl">Link Google Form cho trang Tham gia</Label>
          <Input
            id="googleFormUrl"
            name="googleFormUrl"
            type="url"
            value={googleFormUrl}
            onChange={(e) => setGoogleFormUrl(e.target.value)}
            placeholder="https://docs.google.com/forms/d/e/.../viewform hoặc forms.gle/..."
          />
          <p className="text-xs text-muted-foreground">
            Hệ thống tự chuyển mọi định dạng link Google Forms sang dạng nhúng iframe.
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </form>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold">Bảo mật đăng nhập 2 lớp (2FA)</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Dùng Google Authenticator hoặc app TOTP tương thích để tăng bảo mật cho tài khoản admin.
        </p>

        <div className="mt-3 text-sm">
          Trạng thái:{" "}
          <span className={twoFactorEnabled ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
            {twoFactorEnabled === null ? "Đang tải..." : twoFactorEnabled ? "Đang bật" : "Đang tắt"}
          </span>
        </div>

        {!twoFactorEnabled && !qrCodeDataUrl && (
          <Button className="mt-4" onClick={handleSetup2FA} disabled={twoFactorLoading} type="button">
            {twoFactorLoading ? "Đang tạo..." : "Thiết lập 2FA"}
          </Button>
        )}

        {!twoFactorEnabled && qrCodeDataUrl && (
          <form onSubmit={handleEnable2FA} className="mt-4 space-y-3">
            <Image
              src={qrCodeDataUrl}
              alt="QR code 2FA"
              width={176}
              height={176}
              unoptimized
              className="rounded border p-1"
            />
            <div className="space-y-1">
              <Label>Khóa thủ công</Label>
              <Input value={manualKey} readOnly />
            </div>
            <div className="space-y-1">
              <Label htmlFor="verifyCode">Mã xác thực 6 số</Label>
              <Input
                id="verifyCode"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
              />
            </div>
            <Button type="submit" disabled={twoFactorLoading || verifyCode.length !== 6}>
              {twoFactorLoading ? "Đang xác minh..." : "Xác minh và bật 2FA"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Nếu báo sai mã liên tục, hãy đồng bộ thời gian tự động trên điện thoại và thử lại bằng mã mới nhất.
            </p>
          </form>
        )}

        {twoFactorEnabled && (
          <form onSubmit={handleDisable2FA} className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="disablePassword">Mật khẩu hiện tại</Label>
              <Input
                id="disablePassword"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disableCode">Mã 2FA hiện tại</Label>
              <Input
                id="disableCode"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
              />
            </div>
            <Button type="submit" disabled={twoFactorLoading || disableCode.length !== 6 || !disablePassword}>
              {twoFactorLoading ? "Đang xử lý..." : "Tắt 2FA"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
