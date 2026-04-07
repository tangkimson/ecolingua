import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@xanhvietnam.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "ADMIN",
      twoFactorEnabled: false,
      twoFactorSecret: null
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      twoFactorEnabled: false
    }
  });

  console.log("Seeded admin account:");
  console.log(`- Email: ${adminEmail}`);
  console.log(`- Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });