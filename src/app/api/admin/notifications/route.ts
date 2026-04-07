import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json(notifications);
}
