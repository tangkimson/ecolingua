import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const MAX_TOTAL_PIXELS = 4096 * 4096;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OUTPUT_EXTENSION = "webp";

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
  return null;
}

export async function POST(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu tệp ảnh." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Định dạng ảnh không hỗ trợ." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Ảnh vượt quá dung lượng 4MB." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(buffer);
  if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
    return NextResponse.json({ error: "Nội dung tệp không phải ảnh hợp lệ." }, { status: 400 });
  }

  let processedBuffer: Buffer;
  try {
    const image = sharp(buffer, { failOn: "error" }).rotate();
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    if (!width || !height) {
      return NextResponse.json({ error: "Không đọc được kích thước ảnh." }, { status: 400 });
    }
    if (width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_TOTAL_PIXELS) {
      return NextResponse.json({ error: "Kích thước ảnh quá lớn. Tối đa 4096x4096." }, { status: 400 });
    }

    processedBuffer = await image
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Không thể xử lý ảnh tải lên." }, { status: 400 });
  }

  const fileName = `${Date.now()}-${randomUUID()}.${OUTPUT_EXTENSION}`;

  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Môi trường hiện tại không hỗ trợ lưu ảnh cục bộ. Vui lòng dùng runtime có persistent disk." },
      { status: 503 }
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
  const filePath = path.join(uploadDir, fileName);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, processedBuffer);

  return NextResponse.json({ url: `/uploads/posts/${fileName}` });
}
