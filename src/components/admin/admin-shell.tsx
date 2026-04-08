"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EcoLinguaLogo } from "@/components/brand/ecolingua-logo";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const navItems = [
    { href: "/admin", label: "Tổng quan" },
    { href: "/admin/posts", label: "Quản lý bài viết" },
    { href: "/admin/faqs", label: "Quản lý FAQ" },
    { href: "/admin/leads", label: "Danh sách đăng ký" },
    { href: "/admin/settings", label: "Cài đặt" }
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container grid gap-6 py-5 md:py-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border bg-white p-4 lg:sticky lg:top-6 lg:h-fit">
          <div className="flex items-center gap-3">
            <EcoLinguaLogo size="sm" />
            <div>
              <h2 className="text-base font-bold text-eco-900">EcoLingua Admin</h2>
              <p className="text-xs text-eco-700">Dashboard</p>
            </div>
          </div>
          <nav className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-eco-100 text-eco-900" : "hover:bg-muted"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() =>
              signOut({
                callbackUrl: "/admin/login"
              })
            }
          >
            Đăng xuất
          </Button>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
