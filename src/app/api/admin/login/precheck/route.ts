import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildPrecheckToken,
  getPrecheckCookieName,
  getPrecheckMaxAgeSeconds,
  isLikelyEmailIdentifier,
  normalizeAdminIdentifier
} from "@/lib/admin-login-flow";
import { verifyCaptchaToken } from "@/lib/captcha";
import { prisma } from "@/lib/prisma";
import { getClientIp, isTrustedOrigin } from "@/lib/security";
import { adminPrecheckSchema } from "@/lib/validations";
import { clearAuthFailures, getAuthLockStatus, registerAuthFailure, simpleRateLimit } from "@/lib/rate-limit";

const INVALID_CREDENTIALS_ERROR = "Tài khoản hoặc mật khẩu không chính xác.";
const AUTH_LOCK_ERROR = "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.";

function authAttemptKey(identifier: string, ip: string) {
  return `admin-login:${identifier}:${ip}`;
}

export async function POST(req: Request) {
  if (!isTrustedOrigin()) {
    return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  }

  const ip = getClientIp();
  const rate = await simpleRateLimit(`admin-precheck:${ip}`, 10, 60_000);
  if (!rate.success) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  const payload = await req.json();
  const parsed = adminPrecheckSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin đăng nhập chưa hợp lệ." }, { status: 400 });
  }

  const normalizedIdentifier = normalizeAdminIdentifier(parsed.data.identifier);
  const loginKey = authAttemptKey(normalizedIdentifier, ip);
  const lockStatus = await getAuthLockStatus(loginKey);
  if (lockStatus.locked) {
    return NextResponse.json({ error: AUTH_LOCK_ERROR }, { status: 429 });
  }

  const captchaCheck = await verifyCaptchaToken(parsed.data.captchaToken, ip);
  if (!captchaCheck.success) {
    await registerAuthFailure(loginKey);
    return NextResponse.json({ error: captchaCheck.error || "CAPTCHA không hợp lệ." }, { status: 400 });
  }

  const user = isLikelyEmailIdentifier(normalizedIdentifier)
    ? await prisma.adminUser.findUnique({
        where: { email: normalizedIdentifier },
        select: { id: true, email: true, passwordHash: true, twoFactorEnabled: true }
      })
    : await prisma.adminUser.findFirst({
        where: {
          email: {
            startsWith: `${normalizedIdentifier}@`,
            mode: "insensitive"
          }
        },
        select: { id: true, email: true, passwordHash: true, twoFactorEnabled: true }
      });

  if (!user) {
    await registerAuthFailure(loginKey);
    return NextResponse.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
  }

  const validPassword = await compare(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    await registerAuthFailure(loginKey);
    return NextResponse.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
  }

  await clearAuthFailures(loginKey);

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
