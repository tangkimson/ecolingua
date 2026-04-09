import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getClientIp, isTrustedOrigin } from "@/lib/security";
import { simpleRateLimit } from "@/lib/rate-limit";
import {
  buildOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotpCode,
  verifyTotpCodeDetailed
} from "@/lib/totp";
import { disableTwoFactorSchema, enableTwoFactorSchema } from "@/lib/validations";

const TWO_FA_VERIFY_RATE_MAX = 8;
const TWO_FA_VERIFY_RATE_WINDOW_MS = 5 * 60_000;

async function getCurrentAdmin(adminId: string) {
  return prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      twoFactorEnabled: true,
      twoFactorSecret: true
    }
  });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await getCurrentAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ enabled: admin.twoFactorEnabled });
}

export async function POST() {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await getCurrentAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = generateTotpSecret();
  const otpAuthUri = buildOtpAuthUri(admin.email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      twoFactorSecret: encryptTotpSecret(secret),
      twoFactorEnabled: false
    }
  });

  return NextResponse.json({
    enabled: false,
    qrCodeDataUrl,
    manualKey: secret
  });
}

export async function PUT(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp();
  const rate = await simpleRateLimit(`admin-2fa-enable:${session.user.id}:${ip}`, TWO_FA_VERIFY_RATE_MAX, TWO_FA_VERIFY_RATE_WINDOW_MS);
  if (!rate.success) {
    return NextResponse.json({ error: "Bạn thử mã quá nhiều lần. Vui lòng đợi vài phút rồi thử lại." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const parsed = enableTwoFactorSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Mã xác thực không hợp lệ." }, { status: 400 });

  const admin = await getCurrentAdmin(session.user.id);
  if (!admin?.twoFactorSecret) return NextResponse.json({ error: "Bạn cần tạo mã QR trước." }, { status: 400 });

  const secret = decryptTotpSecret(admin.twoFactorSecret);
  if (!secret) {
    return NextResponse.json({ error: "Không thể đọc secret 2FA. Vui lòng tạo mã QR mới." }, { status: 400 });
  }

  const verifyResult = verifyTotpCodeDetailed(secret, parsed.data.code, 2);
  if (!verifyResult.valid) {
    const driftCheck = verifyTotpCodeDetailed(secret, parsed.data.code, 6);
    if (driftCheck.valid) {
      return NextResponse.json(
        {
          error:
            "Mã 2FA đúng nhưng lệch thời gian giữa thiết bị và máy chủ. Hãy bật đồng bộ thời gian tự động trên điện thoại, rồi nhập mã mới nhất."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Mã xác thực không đúng." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { twoFactorEnabled: true }
  });

  return NextResponse.json({ enabled: true });
}

export async function DELETE(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp();
  const rate = await simpleRateLimit(`admin-2fa-disable:${session.user.id}:${ip}`, TWO_FA_VERIFY_RATE_MAX, TWO_FA_VERIFY_RATE_WINDOW_MS);
  if (!rate.success) {
    return NextResponse.json({ error: "Bạn thử mã quá nhiều lần. Vui lòng đợi vài phút rồi thử lại." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const parsed = disableTwoFactorSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

  const admin = await getCurrentAdmin(session.user.id);
  if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
    return NextResponse.json({ error: "2FA chưa được bật." }, { status: 400 });
  }

  const passwordValid = await compare(parsed.data.password, admin.passwordHash);
  if (!passwordValid) return NextResponse.json({ error: "Mật khẩu không đúng." }, { status: 400 });

  const secret = decryptTotpSecret(admin.twoFactorSecret);
  if (!secret || !verifyTotpCode(secret, parsed.data.code)) {
    return NextResponse.json({ error: "Mã xác thực không đúng." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null
    }
  });

  return NextResponse.json({ enabled: false });
}
