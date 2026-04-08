-- AlterTable
ALTER TABLE "AdminSetting"
DROP COLUMN IF EXISTS "notificationEmail";

-- DropTable
DROP TABLE IF EXISTS "Lead";

-- DropTable
DROP TABLE IF EXISTS "AdminNotification";
