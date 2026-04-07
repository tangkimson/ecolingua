type CaptchaVerificationResult = {
  success: boolean;
  error?: string;
};

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyCaptchaToken(token: string, remoteIp?: string): Promise<CaptchaVerificationResult> {
  if (!token?.trim()) {
    return { success: false, error: "Vui lòng hoàn thành CAPTCHA." };
  }

  if (process.env.CAPTCHA_BYPASS === "true") {
    return { success: true };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: false, error: "Máy chủ chưa cấu hình CAPTCHA." };
  }

  const body = new URLSearchParams({
    secret,
    response: token
  });

  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store"
    });

    if (!response.ok) {
      return { success: false, error: "Không thể xác minh CAPTCHA. Vui lòng thử lại." };
    }

    const payload = (await response.json()) as TurnstileResponse;
    if (!payload.success) {
      return { success: false, error: "Xác minh CAPTCHA thất bại. Vui lòng thử lại." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Không thể kết nối dịch vụ CAPTCHA." };
  }
}
