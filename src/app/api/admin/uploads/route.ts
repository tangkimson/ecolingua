import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

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
  const extension = TYPE_TO_EXTENSION[detectedType];
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

  // Vercel serverless runtime has a read-only deployment filesystem, so writing
  // to /var/task/public will fail. In that environment, return a data URL as
  // a compatible fallback for inline rich-text images.
  if (process.env.VERCEL) {
    const base64 = buffer.toString("base64");
    return NextResponse.json({ url: `data:${detectedType};base64,${base64}` });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
  const filePath = path.join(uploadDir, fileName);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/posts/${fileName}` });
}
