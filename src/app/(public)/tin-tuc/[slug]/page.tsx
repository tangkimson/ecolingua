import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FACEBOOK_FANPAGE_URL, SITE_NAME, SITE_URL } from "@/lib/constants";
import { PostContent } from "@/components/posts/post-content";
import { AdaptiveImageFrame } from "@/components/ui/adaptive-image-frame";
import { parseCoverImageTransform } from "@/lib/image-presentation";
import { slugParamSchema } from "@/lib/validations";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slugParsed = slugParamSchema.safeParse(params.slug);
  if (!slugParsed.success) {
    return {
      title: `Tin tức | ${SITE_NAME}`,
      description: "Bài viết không tồn tại hoặc chưa được xuất bản."
    };
  }

  const post = await prisma.post.findUnique({
    where: { slug: slugParsed.data },
    select: { title: true, excerpt: true, published: true, coverImage: true, slug: true }
  });

  if (!post || !post.published) {
    return {
      title: `Tin tức | ${SITE_NAME}`,
      description: "Bài viết không tồn tại hoặc chưa được xuất bản."
    };
  }

  const cover = parseCoverImageTransform(post.coverImage);
  const canonicalUrl = `${SITE_URL}/tin-tuc/${post.slug}`;
  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${post.title} | ${SITE_NAME}`,
      description: post.excerpt,
      url: canonicalUrl,
      type: "article",
      images: cover.src ? [{ url: cover.src, alt: post.title }] : undefined
    }
  };
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const slugParsed = slugParamSchema.safeParse(params.slug);
  if (!slugParsed.success) return notFound();

  const post = await prisma.post.findUnique({
    where: { slug: slugParsed.data }
  });

  if (!post || !post.published) return notFound();
  const cover = parseCoverImageTransform(post.coverImage);

  return (
    <article className="bg-white">
      <section className="section-padding bg-eco-50">
        <div className="container grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-eco-900 md:text-5xl">{post.title}</h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">{post.excerpt}</p>
          </div>
          <div className="relative min-h-64 overflow-hidden rounded-3xl">
            <AdaptiveImageFrame
              src={cover.src}
              alt={post.title}
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="min-h-64 rounded-3xl"
              zoom={cover.zoom}
              offsetX={cover.offsetX}
              offsetY={cover.offsetY}
            />
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-3xl border border-eco-100 bg-white p-6 shadow-sm md:p-10">
            <PostContent content={post.content} />
          </div>
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-eco-100 bg-eco-50/70 p-4 md:p-5">
            <a
              href={FACEBOOK_FANPAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-eco-800 hover:text-eco-900 hover:underline"
            >
              <Megaphone className="size-4 text-[#1877F2]" />
              Theo dõi Fanpage để nhận thông báo bài viết và hoạt động mới nhất
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
