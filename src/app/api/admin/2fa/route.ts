import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isTrustedOrigin } from "@/lib/security";
import {
  buildOtpAuthUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotpCode
} from "@/lib/totp";
import { disableTwoFactorSchema, enableTwoFactorSchema } from "@/lib/validations";

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

  const payload = await req.json();
  const parsed = enableTwoFactorSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Mã xác thực không hợp lệ." }, { status: 400 });

  const admin = await getCurrentAdmin(session.user.id);
  if (!admin?.twoFactorSecret) return NextResponse.json({ error: "Bạn cần tạo mã QR trước." }, { status: 400 });

  const secret = decryptTotpSecret(admin.twoFactorSecret);
  if (!secret || !verifyTotpCode(secret, parsed.data.code)) {
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

  const payload = await req.json();
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
