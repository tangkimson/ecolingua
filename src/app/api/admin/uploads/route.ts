import { NextResponse } from "next/server";
import { imageSize } from "image-size";

import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin";
import { simpleRateLimit } from "@/lib/rate-limit";
import { isTrustedOrigin } from "@/lib/security";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function detectImageType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "image/gif";
  }
  return null;
}

export async function POST(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Máy chủ chưa cấu hình Cloudinary." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = await simpleRateLimit(`admin-upload:${ip}`, 20, 60_000);
  if (!rate.success) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu tệp ảnh." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Định dạng ảnh không hỗ trợ." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Ảnh vượt quá dung lượng 5MB." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(buffer);
  if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
    return NextResponse.json({ error: "Nội dung tệp không phải ảnh hợp lệ." }, { status: 400 });
  }

  const size = imageSize(buffer);
  if (!size.width || !size.height) {
    return NextResponse.json({ error: "Không thể đọc kích thước ảnh." }, { status: 400 });
  }
  if (size.width > MAX_DIMENSION || size.height > MAX_DIMENSION) {
    return NextResponse.json(
      { error: `Kích thước ảnh quá lớn. Vui lòng dùng ảnh tối đa ${MAX_DIMENSION}x${MAX_DIMENSION}.` },
      { status: 400 }
    );
  }

  try {
    const uploaded = await uploadImageToCloudinary(buffer, detectedType);
    return NextResponse.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width ?? size.width,
      height: uploaded.height ?? size.height,
      bytes: uploaded.bytes ?? file.size
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải ảnh lên Cloudinary." }, { status: 502 });
  }

}
