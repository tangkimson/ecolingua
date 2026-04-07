import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.id) return session;

  if (!session.user.email) return null;
  const adminUser = await prisma.adminUser.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });
  if (!adminUser) return null;

  session.user.id = adminUser.id;
  return session;
}
