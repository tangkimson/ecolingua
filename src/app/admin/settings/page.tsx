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

  let setting:
    | {
        notificationEmail: string;
        googleFormUrl: string | null;
      }
    | null = null;
  let schemaWarning: string | null = null;

  try {
    setting = await prisma.adminSetting.findUnique({
      where: { id: "main" },
      select: { notificationEmail: true, googleFormUrl: true }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("googleFormUrl") || message.includes("column") || message.includes("P2022")) {
      schemaWarning =
        "Database production chưa cập nhật migration mới. Vui lòng chạy migration để bật cấu hình Google Form.";
      try {
        const fallbackSetting = await prisma.adminSetting.findUnique({
          where: { id: "main" },
          select: { notificationEmail: true }
        });
        setting = {
          notificationEmail: fallbackSetting?.notificationEmail || "",
          googleFormUrl: null
        };
      } catch {
        setting = null;
      }
    } else {
      throw error;
    }
  }

  const email = setting?.notificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
  const googleFormUrl = setting?.googleFormUrl || "";

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Cài đặt admin</h1>
      <p className="text-sm text-muted-foreground">Email bên dưới sẽ nhận lead mới từ website qua dashboard và email.</p>
      {schemaWarning ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{schemaWarning}</p>
      ) : null}
      <SettingsForm defaultEmail={email} defaultGoogleFormUrl={googleFormUrl} />
    </div>
  );
}
