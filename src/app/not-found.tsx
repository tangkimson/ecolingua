import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="section-padding bg-eco-50/70">
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-eco-700">Không tìm thấy trang</p>
          <h1 className="mt-2 text-4xl font-bold text-eco-900 md:text-5xl">404</h1>
          <p className="mt-3 text-muted-foreground">Liên kết có thể đã thay đổi hoặc nội dung đã được di chuyển.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Về trang chủ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tin-tuc">Xem tin tức mới</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
