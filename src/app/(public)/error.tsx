"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="section-padding">
      <div className="container">
        <div className="surface-card max-w-2xl space-y-3 p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-eco-700">Đã xảy ra lỗi</p>
          <h1 className="text-2xl font-bold text-eco-900 md:text-3xl">Không thể tải nội dung lúc này</h1>
          <p className="text-sm text-muted-foreground">
            Có thể hệ thống đang bận hoặc kết nối bị gián đoạn. Vui lòng thử lại trong giây lát.
          </p>
          <div className="pt-2">
            <Button type="button" onClick={reset}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
