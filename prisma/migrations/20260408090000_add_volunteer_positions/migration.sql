-- AlterTable
ALTER TABLE "Lead"
ADD COLUMN "volunteerPositionId" TEXT,
ADD COLUMN "volunteerPositionTitle" TEXT;

-- CreateTable
CREATE TABLE "VolunteerPosition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerPosition_pkey" PRIMARY KEY ("id")
);
