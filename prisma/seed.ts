import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "ecolinguavietnam@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await hash(adminPassword, 10);
  const faqSeeds = [
    {
      location: "JOIN",
      question: "Mình chưa có kinh nghiệm thì có tham gia được không?",
      answer: "Có. EcoLingua có lộ trình onboarding theo từng ban để bạn bắt đầu từ nền tảng cơ bản.",
      order: 1
    },
    {
      location: "JOIN",
      question: "EcoLingua đang tuyển những vị trí nào?",
      answer: "Các vị trí mở theo từng đợt, thường gồm Content, Design, Dịch thuật và Truyền thông cộng đồng.",
      order: 2
    },
    {
      location: "JOIN",
      question: "Bao lâu mình sẽ nhận phản hồi sau khi gửi form?",
      answer: "Thông thường trong 3-5 ngày làm việc, tùy số lượng hồ sơ ở từng đợt tuyển.",
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

  console.log("Seeded admin account:");
  console.log(`- Email: ${adminEmail}`);
  console.log(`- Password: ${adminPassword}`);

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
  console.log(`- Seeded FAQ items: +${createdFaqCount} (JOIN/CONTACT)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });