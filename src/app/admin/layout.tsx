import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname");
  if (pathname === "/admin/login") return <>{children}</>;

  const callbackPath = pathname?.startsWith("/admin") ? pathname : "/admin";
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  return <AdminShell>{children}</AdminShell>;
}
