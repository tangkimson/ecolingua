"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border bg-white p-5 md:p-6">
      <h2 className="text-xl font-semibold text-foreground">Không thể tải dữ liệu quản trị</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Đã xảy ra sự cố khi tải trang. Kiểm tra kết nối hoặc thử tải lại để tiếp tục quản lý nội dung.
      </p>
      <div className="mt-4">
        <Button type="button" onClick={reset}>
          Tải lại trang
        </Button>
      </div>
    </div>
  );
}
