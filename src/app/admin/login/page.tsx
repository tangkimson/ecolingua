"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginStep = "credentials" | "otp";

declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const callbackUrl = "/admin";
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const captchaEnabled = Boolean(captchaSiteKey);

  const [step, setStep] = useState<LoginStep>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaScriptLoaded, setCaptchaScriptLoaded] = useState(false);

  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);

  const stepTitle = useMemo(() => {
    if (step === "credentials") return "Xác thực tài khoản";
    return "Xác thực 2FA";
  }, [step]);

  const renderCaptchaWidget = useCallback(() => {
    if (!captchaEnabled || !captchaScriptLoaded || !captchaContainerRef.current || !window.turnstile) return;
    captchaContainerRef.current.innerHTML = "";
    captchaWidgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
      sitekey: captchaSiteKey,
      theme: "light",
      callback: (token: string) => {
        setCaptchaToken(token);
        setErrorMessage(null);
      },
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

  async function completeSignIn(otp?: string) {
    const result = await signIn("credentials", {
      identifier: identifier.trim(),
      password,
      ...(otp ? { totpCode: otp } : {}),
      callbackUrl,
      redirect: false
    });

    if (result?.error) {
      if (step === "otp") {
        setErrorMessage("Mã xác thực 2FA không đúng hoặc đã hết hạn.");
      } else {
        setErrorMessage("Không thể đăng nhập. Vui lòng thử lại.");
      }
      return false;
    }

    router.push(callbackUrl);
    router.refresh();
    return true;
  }

  async function handleCredentialStep() {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      setErrorMessage("Vui lòng nhập email hoặc username.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (captchaEnabled && !captchaToken) {
      setErrorMessage("Vui lòng hoàn thành CAPTCHA trước khi tiếp tục.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/admin/login/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: normalizedIdentifier,
          password,
          captchaToken
        })
      });

      const payload = (await response.json()) as { requiresTwoFactor?: boolean; error?: string };
      if (!response.ok) {
        setErrorMessage(payload.error || "Không thể xác minh thông tin đăng nhập.");
        resetCaptcha();
        return;
      }

      if (payload.requiresTwoFactor) {
        setStep("otp");
        setTotpCode("");
        toast.success("Xác minh thành công. Vui lòng nhập mã 2FA để tiếp tục.");
        return;
      }

      const signedIn = await completeSignIn();
      if (!signedIn) {
        resetCaptcha();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpStep() {
    const normalizedCode = totpCode.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(normalizedCode)) {
      setErrorMessage("Mã 2FA phải gồm đúng 6 chữ số.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await completeSignIn(normalizedCode);
    } finally {
      setLoading(false);
    }
  }

  function goBackToCredentials() {
    setStep("credentials");
    setTotpCode("");
    setErrorMessage(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-eco-50 to-white p-4 sm:p-6">
      {captchaEnabled ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setCaptchaScriptLoaded(true)}
        />
      ) : null}
      <Card className="w-full max-w-md border-eco-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Đăng nhập Admin Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">Đăng nhập theo từng bước để tăng cường bảo mật.</p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div
              className={`rounded-md border px-3 py-2 text-center text-xs font-medium ${
                step === "credentials"
                  ? "border-eco-500 bg-eco-50 text-eco-700"
                  : "border-muted bg-muted/30 text-muted-foreground"
              }`}
            >
              1. Tài khoản + CAPTCHA
            </div>
            <div
              className={`rounded-md border px-3 py-2 text-center text-xs font-medium ${
                step === "otp"
                  ? "border-eco-500 bg-eco-50 text-eco-700"
                  : "border-muted bg-muted/30 text-muted-foreground"
              }`}
            >
              2. Mã OTP 2FA
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-md border border-muted/80 bg-muted/30 px-3 py-2 text-sm font-medium">{stepTitle}</div>

          {errorMessage ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p> : null}

          {step === "credentials" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email hoặc username</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@ecolingua.vn hoặc admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {captchaEnabled ? (
                <div className="space-y-2">
                  <Label>CAPTCHA</Label>
                  <div ref={captchaContainerRef} className="min-h-[68px] rounded-md border border-dashed p-2" />
                </div>
              ) : (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  CAPTCHA chưa được cấu hình. Thiết lập `NEXT_PUBLIC_TURNSTILE_SITE_KEY` và `TURNSTILE_SECRET_KEY` để đăng nhập.
                </p>
              )}

              <Button className="w-full" type="button" disabled={loading || !captchaEnabled} onClick={handleCredentialStep}>
                {loading ? "Đang xác minh..." : "Tiếp tục"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totpCode">Mã xác thực 2FA</Label>
                <Input
                  id="totpCode"
                  name="totpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  pattern="\d{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={goBackToCredentials} disabled={loading}>
                  Quay lại
                </Button>
                <Button type="button" onClick={handleOtpStep} disabled={loading}>
                  {loading ? "Đang xác thực..." : "Đăng nhập"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
