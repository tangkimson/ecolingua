import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin/settings")}`);
  }

  let setting: { googleFormUrl: string | null } | null = null;
  let schemaWarning: string | null = null;

  try {
    setting = await prisma.adminSetting.findUnique({
      where: { id: "main" },
      select: { googleFormUrl: true }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("googleFormUrl") || message.includes("column") || message.includes("P2022")) {
      schemaWarning =
        "Database production chưa cập nhật migration mới. Vui lòng chạy migration để bật cấu hình Google Form.";
      setting = { googleFormUrl: null };
    } else {
      throw error;
    }
  }

  const googleFormUrl = setting?.googleFormUrl || "";

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Cài đặt admin</h1>
      <p className="text-sm text-muted-foreground">Quản lý cấu hình biểu mẫu Google Forms cho trang Tham gia.</p>
      {schemaWarning ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{schemaWarning}</p>
      ) : null}
      <SettingsForm defaultGoogleFormUrl={googleFormUrl} />
    </div>
  );
}
