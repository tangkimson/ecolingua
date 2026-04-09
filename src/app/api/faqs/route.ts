import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { faqSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/admin";
import { isTrustedOrigin } from "@/lib/security";

const ALLOWED_LOCATIONS = new Set(["JOIN", "CONTACT"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location");

  const faqs = await prisma.faq.findMany({
    where: {
      published: true,
      ...(location && ALLOWED_LOCATIONS.has(location) ? { location } : {})
    },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json(faqs);
}

export async function POST(req: Request) {
  if (!isTrustedOrigin()) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });

  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const faq = await prisma.faq.create({
    data: parsed.data
  });

  revalidatePath("/tham-gia");
  revalidatePath("/lien-he");
  revalidatePath("/admin/faqs");

  return NextResponse.json(faq, { status: 201 });
}
