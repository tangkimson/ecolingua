import { cn } from "@/lib/utils";
import { normalizePostContent } from "@/lib/post-content";

type PostContentProps = {
  content: string;
  className?: string;
};

export function PostContent({ content, className }: PostContentProps) {
  const html = normalizePostContent(content);

  return (
    <div
      className={cn("post-content text-base leading-8 text-foreground/90", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
