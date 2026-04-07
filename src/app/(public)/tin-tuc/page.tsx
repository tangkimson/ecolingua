import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdaptiveImageFrame } from "@/components/ui/adaptive-image-frame";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { mediaAssets } from "@/lib/mock-content";
import { parseCoverImageTransform } from "@/lib/image-presentation";

export const metadata: Metadata = {
  title: `Tin tức | ${SITE_NAME}`,
  description: "Cập nhật hoạt động, câu chuyện cộng đồng và kiến thức môi trường từ EcoLingua Vietnam.",
  alternates: {
    canonical: `${SITE_URL}/tin-tuc`
  },
  openGraph: {
    title: `Tin tức | ${SITE_NAME}`,
    description: "Cập nhật hoạt động, câu chuyện cộng đồng và kiến thức môi trường từ EcoLingua Vietnam.",
    url: `${SITE_URL}/tin-tuc`,
    type: "website"
  }
};

export default async function NewsPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <div className="bg-white">
      <section className="section-padding bg-eco-50">
        <div className="container grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="title-display text-eco-900">Tin tức</h1>
            <p className="mt-3 text-muted-foreground">
              Cập nhật hoạt động, câu chuyện cộng đồng và kiến thức môi trường được chọn lọc từ góc nhìn thực hành.
            </p>
          </div>
          <div className="relative min-h-64 overflow-hidden rounded-3xl">
            <AdaptiveImageFrame
              src={mediaAssets.news}
              alt="Bản tin và hoạt động môi trường"
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="min-h-64 rounded-3xl"
            />
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Card key={post.id} className="overflow-hidden border-eco-100/80 transition-shadow hover:shadow-md">
              <div className="relative h-48">
                {(() => {
                  const transformed = parseCoverImageTransform(post.coverImage || mediaAssets.programs[index % mediaAssets.programs.length]);
                  return (
                    <AdaptiveImageFrame
                      src={transformed.src}
                      alt={post.title}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="h-48 rounded-none"
                      zoom={transformed.zoom}
                      offsetX={transformed.offsetX}
                      offsetY={transformed.offsetY}
                    />
                  );
                })()}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2 text-xl">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <Link href={`/tin-tuc/${post.slug}`} className="mt-4 inline-block text-sm font-semibold text-eco-700 hover:underline">
                  Xem chi tiết
                </Link>
              </CardContent>
            </Card>
          ))}
          {!posts.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-eco-200 bg-eco-50/50 px-6 py-10 text-center">
              <p className="text-base font-semibold text-eco-900">Chưa có bài viết nào</p>
              <p className="mt-1 text-sm text-muted-foreground">Nội dung mới sẽ được cập nhật trong thời gian tới. Vui lòng quay lại sau.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
