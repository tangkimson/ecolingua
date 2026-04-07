import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("Admin@12345", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@xanhvietnam.local" },
    update: { passwordHash },
    create: {
      email: "admin@xanhvietnam.local",
      passwordHash,
      role: "ADMIN"
    }
  });

  await prisma.adminSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      notificationEmail: "xanhvietnam.org@gmail.com"
    }
  });

  const posts = [
    {
      title: "Earth Day Việt Nam 2026: Triệu hành động nhỏ",
      slug: "earth-day-viet-nam-2026-trieu-hanh-dong-nho",
      excerpt: "Chiến dịch Earth Day 2026 chính thức khởi động với mục tiêu lan tỏa thói quen sống xanh.",
      content:
        "Earth Day Việt Nam 2026 tập trung vào hành động thực tiễn: dọn rác, trồng cây và giáo dục môi trường. Hãy tham gia cùng chúng tôi tại điểm cầu gần bạn.",
      coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      published: true,
      publishedAt: new Date()
    },
    {
      title: "Clean Up Việt Nam: 800 tấn rác được thu gom",
      slug: "clean-up-viet-nam-800-tan-rac-duoc-thu-gom",
      excerpt: "Hơn 200.000 tình nguyện viên đã ra quân đồng loạt tại nhiều tỉnh thành.",
      content:
        "Chiến dịch Clean Up Việt Nam ghi nhận hàng nghìn điểm ra quân. Các hoạt động được tổ chức đồng bộ với sự tham gia của trường học, doanh nghiệp và cộng đồng địa phương.",
      coverImage: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b",
      published: true,
      publishedAt: new Date()
    }
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
      create: post
    });
  }

  await prisma.lead.deleteMany();
  await prisma.lead.createMany({
    data: [
      {
        fullName: "Nguyen Van A",
        phone: "0909123123",
        email: "vana@example.com",
        sourcePage: "tham-gia",
        message: "Mình muốn tham gia hoạt động cuối tuần.",
        status: "NEW"
      },
      {
        fullName: "Tran Thi B",
        phone: "0912345678",
        email: "thib@example.com",
        sourcePage: "lien-he",
        message: "Doanh nghiệp của mình muốn tài trợ chiến dịch.",
        status: "NEW"
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
