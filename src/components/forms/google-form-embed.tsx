"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

type GoogleFormEmbedProps = {
  embedUrl: string | null;
};

function extractPublicFormUrl(embedUrl: string) {
  const url = new URL(embedUrl);
  url.searchParams.delete("embedded");
  return url.toString();
}

export function GoogleFormEmbed({ embedUrl }: GoogleFormEmbedProps) {
  const [isLoading, setIsLoading] = useState(Boolean(embedUrl));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(Boolean(embedUrl));
    setHasError(false);
  }, [embedUrl]);

  const fallbackUrl = useMemo(() => {
    if (!embedUrl) return null;
    try {
      return extractPublicFormUrl(embedUrl);
    } catch {
      return null;
    }
  }, [embedUrl]);

  if (!embedUrl) {
    return (
      <div className="surface-card rounded-2xl border-eco-100 p-6">
        <h2 className="text-xl font-bold text-eco-900">Biểu mẫu tham gia</h2>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Form đăng ký hiện chưa được cấu hình. Vui lòng quay lại sau hoặc theo dõi Fanpage để nhận thông báo mới.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl border-eco-100 p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-eco-900 md:text-xl">Biểu mẫu tham gia</h2>
        {fallbackUrl ? (
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-eco-700 hover:underline"
          >
            Mở form tab mới
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Đang tải biểu mẫu...
        </p>
      ) : null}
      {hasError ? (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Không thể nhúng biểu mẫu trong trang. Vui lòng mở form ở tab mới để gửi đăng ký.
        </p>
      ) : null}

      <iframe
        title="Google Form đăng ký cộng tác viên EcoLingua"
        src={embedUrl}
        loading="lazy"
        className="h-[820px] w-full rounded-xl border bg-white md:h-[900px]"
        sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
