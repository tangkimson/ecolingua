ALTER TABLE "AdminUser" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN "twoFactorSecret" TEXT;
