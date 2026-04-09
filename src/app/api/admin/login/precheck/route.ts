import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildPrecheckToken,
  getPrecheckCookieName,
  getPrecheckMaxAgeSeconds,
  normalizeAdminIdentifier
} from "@/lib/admin-login-flow";
import { verifyCaptchaToken } from "@/lib/captcha";
import { prisma } from "@/lib/prisma";
import { getClientIp, isTrustedOrigin } from "@/lib/security";
import { adminPrecheckSchema } from "@/lib/validations";
import { simpleRateLimit } from "@/lib/rate-limit";
import { assertSecurityEnv } from "@/lib/env";

const INVALID_CREDENTIALS_ERROR = "Tài khoản hoặc mật khẩu không chính xác.";
const DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOeRz2R7sRKqGZo4PMBVXgS5aXoaZySUO";

export async function POST(req: Request) {
  assertSecurityEnv();
  if (!isTrustedOrigin()) {
    return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  }

  const ip = getClientIp();
  const ipRate = await simpleRateLimit(`admin-precheck-ip:${ip}`, 8, 60_000);
  if (!ipRate.success) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const parsed = adminPrecheckSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin đăng nhập chưa hợp lệ." }, { status: 400 });
  }

  const normalizedIdentifier = normalizeAdminIdentifier(parsed.data.identifier);
  const accountRate = await simpleRateLimit(`admin-precheck-account:${normalizedIdentifier}:${ip}`, 5, 5 * 60_000);
  if (!accountRate.success) {
    return NextResponse.json({ error: "Tài khoản tạm thời bị giới hạn thử đăng nhập. Vui lòng thử lại sau." }, { status: 429 });
  }

  const captchaCheck = await verifyCaptchaToken(parsed.data.captchaToken, ip);
  if (!captchaCheck.success) {
    return NextResponse.json({ error: captchaCheck.error || "CAPTCHA không hợp lệ." }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedIdentifier },
    select: { id: true, email: true, passwordHash: true, twoFactorEnabled: true }
  });

  if (!user) {
    await compare(parsed.data.password, DUMMY_HASH);
    return NextResponse.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
  }

  const validPassword = await compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
  }

  const precheckToken = buildPrecheckToken(normalizedIdentifier);
  cookies().set({
    name: getPrecheckCookieName(),
    value: precheckToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getPrecheckMaxAgeSeconds(),
    path: "/"
  });

  return NextResponse.json({
    requiresTwoFactor: user.twoFactorEnabled,
    normalizedIdentifier
  });
}
