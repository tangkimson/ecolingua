"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EcoLinguaLogo } from "@/components/brand/ecolingua-logo";

type LoginStep = "credentials" | "otp";

declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get("callbackUrl");
  const callbackUrl =
    callbackUrlParam && /^\/(?!\/)/.test(callbackUrlParam) && !callbackUrlParam.includes("\\")
      ? callbackUrlParam
      : "/admin";
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
  const stepDescription = useMemo(() => {
    if (step === "credentials") return "Nhập email quản trị, mật khẩu và hoàn tất CAPTCHA.";
    return "Nhập mã OTP 6 số từ ứng dụng xác thực để hoàn tất đăng nhập.";
  }, [step]);
  const normalizedTotpCode = useMemo(() => totpCode.replace(/\s+/g, ""), [totpCode]);

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
      setErrorMessage("Vui lòng nhập email quản trị.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
      setErrorMessage("Email quản trị không hợp lệ.");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-eco-50 via-white to-eco-50/40 p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-eco-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-eco-200/40 blur-3xl" aria-hidden="true" />
      {captchaEnabled ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setCaptchaScriptLoaded(true)}
        />
      ) : null}
      <Card className="relative z-10 w-full max-w-lg border-eco-100/80 bg-white/95 shadow-[0_24px_70px_-38px_rgba(22,101,52,0.55)] backdrop-blur">
        <CardHeader className="space-y-4 pb-4">
          <div className="mx-auto mb-1 flex h-20 w-20 items-center justify-center rounded-2xl border border-eco-100 bg-white shadow-sm">
            <EcoLinguaLogo size="lg" />
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl text-slate-900">Đăng nhập Admin Dashboard</CardTitle>
            <p className="text-sm text-slate-600">Đăng nhập theo từng bước để tăng cường bảo mật.</p>
          </div>

          <div className="mt-1 grid grid-cols-2 gap-2 rounded-2xl border border-eco-100 bg-eco-50/40 p-1.5">
            <div
              className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition ${
                step === "credentials"
                  ? "border-eco-500 bg-white text-eco-800 shadow-sm"
                  : "border-transparent bg-transparent text-slate-500"
              }`}
            >
              1. Tài khoản + CAPTCHA
            </div>
            <div
              className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition ${
                step === "otp"
                  ? "border-eco-500 bg-white text-eco-800 shadow-sm"
                  : "border-transparent bg-transparent text-slate-500"
              }`}
            >
              2. Mã OTP 2FA
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-eco-100 bg-eco-50/50 px-4 py-3">
            <p className="text-sm font-semibold text-eco-900">{stepTitle}</p>
            <p className="mt-1 text-xs text-slate-600">{stepDescription}</p>
          </div>

          {errorMessage ? (
            <p
              role="alert"
              aria-live="assertive"
              className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          {step === "credentials" ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCredentialStep();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-700">
                  Email quản trị
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  className="h-11 rounded-xl border-slate-200 bg-white/90"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@ecolingua.vn"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-slate-200 bg-white/90"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {captchaEnabled ? (
                <div className="space-y-2">
                  <Label className="text-slate-700">CAPTCHA</Label>
                  <div
                    ref={captchaContainerRef}
                    className="min-h-[72px] rounded-xl border border-dashed border-slate-300 bg-white p-2.5"
                  />
                </div>
              ) : (
                <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  CAPTCHA chưa được cấu hình. Thiết lập `NEXT_PUBLIC_TURNSTILE_SITE_KEY` và `TURNSTILE_SECRET_KEY` để đăng nhập.
                </p>
              )}

              <Button className="h-11 w-full rounded-xl text-sm" type="submit" disabled={loading || (captchaEnabled && !captchaToken)}>
                {loading ? "Đang xác minh..." : "Tiếp tục"}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleOtpStep();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="totpCode" className="text-slate-700">
                  Mã xác thực 2FA
                </Label>
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
                  className="h-11 rounded-xl border-slate-200 bg-white text-center text-base tracking-[0.24em]"
                />
                <p className="text-xs text-slate-500">Mẹo: mở ứng dụng Authenticator để lấy mã mới nhất.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={goBackToCredentials} disabled={loading}>
                  Quay lại
                </Button>
                <Button type="submit" className="h-11 rounded-xl" disabled={loading || normalizedTotpCode.length !== 6}>
                  {loading ? "Đang xác thực..." : "Đăng nhập"}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-slate-500">Phiên đăng nhập được bảo vệ bằng CAPTCHA và xác thực 2 lớp.</p>
        </CardContent>
      </Card>
    </div>
  );
}
