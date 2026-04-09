import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    throw new Error("Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD. Refusing to seed weak/default credentials.");
  }
  if (adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }
  const passwordHash = await hash(adminPassword, 10);
  const faqSeeds = [
    {
      location: "JOIN",
      question: "Mình chưa có kinh nghiệm thì có tham gia được không?",
      answer: "Có. Bạn có thể bắt đầu từ các hoạt động phù hợp với quỹ thời gian và kinh nghiệm hiện tại.",
      order: 1
    },
    {
      location: "JOIN",
      question: "Mình có thể theo dõi cơ hội tham gia mới ở đâu?",
      answer: "Các đợt mở biểu mẫu mới được cập nhật trên website và Fanpage chính thức của EcoLingua.",
      order: 2
    },
    {
      location: "JOIN",
      question: "Sau khi gửi biểu mẫu tham gia thì cần làm gì tiếp theo?",
      answer: "Bạn chỉ cần theo dõi email/Fanpage để nhận các thông báo tiếp theo khi chương trình phù hợp được mở.",
      order: 3
    },
    {
      location: "CONTACT",
      question: "Tôi muốn hợp tác truyền thông hoặc giáo dục với EcoLingua thì bắt đầu từ đâu?",
      answer: "Bạn có thể điền form Liên hệ hoặc gửi email, đội ngũ sẽ phản hồi và đề xuất hướng hợp tác phù hợp.",
      order: 1
    },
    {
      location: "CONTACT",
      question: "EcoLingua có hỗ trợ các nhóm/đơn vị địa phương không?",
      answer: "Có. Chúng tôi có thể đồng hành ở mức tư vấn nội dung, truyền thông hoặc kết nối chương trình theo nhu cầu thực tế.",
      order: 2
    }
  ] as const;

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

  console.log("Seeded admin account.");

  let createdFaqCount = 0;
  for (const item of faqSeeds) {
    const existingFaq = await prisma.faq.findFirst({
      where: { location: item.location, question: item.question }
    });
    if (existingFaq) continue;

    await prisma.faq.create({
      data: {
        location: item.location,
        question: item.question,
        answer: item.answer,
        order: item.order,
        published: true
      }
    });
    createdFaqCount += 1;
  }
  console.log(`Seeded FAQ items: +${createdFaqCount} (tham-gia/lien-he)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });