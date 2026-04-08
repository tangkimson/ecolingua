-- AlterTable
ALTER TABLE "AdminSetting"
ADD COLUMN "googleFormUrl" TEXT;

-- AlterTable
ALTER TABLE "Lead"
DROP COLUMN IF EXISTS "volunteerPositionId",
DROP COLUMN IF EXISTS "volunteerPositionTitle";

-- DropTable
DROP TABLE IF EXISTS "VolunteerPosition";
