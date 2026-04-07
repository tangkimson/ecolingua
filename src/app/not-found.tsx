import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-eco-50 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Trang bạn tìm không tồn tại.</p>
      <Link href="/" className="font-semibold text-eco-700 hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
