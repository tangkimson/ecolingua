import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu tệp ảnh." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Định dạng ảnh không hỗ trợ." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Ảnh vượt quá dung lượng 5MB." }, { status: 400 });

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "");
  const fileName = `${Date.now()}-${randomUUID()}.${safeExtension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Vercel serverless runtime has a read-only deployment filesystem, so writing
  // to /var/task/public will fail. In that environment, return a data URL as
  // a compatible fallback for inline rich-text images.
  if (process.env.VERCEL) {
    const base64 = buffer.toString("base64");
    return NextResponse.json({ url: `data:${file.type};base64,${base64}` });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
  const filePath = path.join(uploadDir, fileName);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/posts/${fileName}` });
}
