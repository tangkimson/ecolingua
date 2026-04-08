import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const adminUser = session.user.id
    ? await prisma.adminUser.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, role: true }
      })
    : session.user.email
      ? await prisma.adminUser.findUnique({
          where: { email: session.user.email },
          select: { id: true, email: true, role: true }
        })
      : null;

  if (!adminUser) return null;
  if (adminUser.role !== "ADMIN") return null;

  session.user.id = adminUser.id;
  session.user.email = adminUser.email;
  session.user.role = adminUser.role;
  return session;
}
