import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/constants";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin/settings")}`);
  }

  const setting = await prisma.adminSetting.findUnique({ where: { id: "main" } });
  const email = setting?.notificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Cài đặt admin</h1>
      <p className="text-sm text-muted-foreground">Email bên dưới sẽ nhận lead mới từ website qua dashboard và email.</p>
      <SettingsForm defaultEmail={email} />
    </div>
  );
}
