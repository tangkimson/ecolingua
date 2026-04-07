"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-bold text-eco-800">Admin Dashboard</h2>
          <nav className="mt-4 space-y-2 text-sm">
            <Link href="/admin" className="block rounded px-3 py-2 hover:bg-muted">
              Tổng quan
            </Link>
            <Link href="/admin/posts" className="block rounded px-3 py-2 hover:bg-muted">
              Quản lý bài viết
            </Link>
            <Link href="/admin/leads" className="block rounded px-3 py-2 hover:bg-muted">
              Danh sách đăng ký
            </Link>
            <Link href="/admin/settings" className="block rounded px-3 py-2 hover:bg-muted">
              Cài đặt
            </Link>
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
