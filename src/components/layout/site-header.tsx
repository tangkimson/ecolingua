"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Megaphone, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { FACEBOOK_FANPAGE_URL, NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EcoLinguaLogo } from "@/components/brand/ecolingua-logo";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const mobileMenuId = useId();
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  useEffect(() => {
    function syncHash() {
      setCurrentHash(window.location.hash || "");
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuToggleRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  function isActiveLink(href: string) {
    const [basePath, hash] = href.split("#");
    const normalizedHref = (basePath || "/").replace(/\/+$/, "") || "/";

    if (hash) {
      return normalizedPath === normalizedHref && currentHash === `#${hash}`;
    }

    if (normalizedHref === "/") {
      return normalizedPath === "/" && !currentHash;
    }

    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-eco-100/80 bg-white/85 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="group inline-flex items-center gap-3">
          <EcoLinguaLogo size="md" className="transition-transform duration-200 group-hover:scale-[1.02]" />
          <span>
            <span className="block text-base font-extrabold uppercase tracking-wide text-eco-900">EcoLingua Vietnam</span>
            <span className="block text-xs font-medium text-eco-700/90">Ngôn ngữ cho hành động khí hậu</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActiveLink(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold transition-all",
                  active ? "bg-eco-100 text-eco-800" : "text-foreground hover:bg-eco-50 hover:text-eco-700"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="secondary" className="rounded-full px-4" asChild>
            <a href={FACEBOOK_FANPAGE_URL} target="_blank" rel="noopener noreferrer" aria-label="Theo dõi Fanpage EcoLingua Vietnam">
              <Megaphone className="size-4" />
              Theo dõi Fanpage
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="yellow" className="rounded-full px-6 shadow-sm" asChild>
            <Link href="/tham-gia">Đăng ký ngay</Link>
          </Button>
        </div>

        <button
          ref={menuToggleRef}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex rounded-full border border-eco-200 bg-white p-2.5 text-eco-800 shadow-sm transition-colors hover:bg-eco-50 lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls={mobileMenuId}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div id={mobileMenuId} className="border-t border-eco-100 bg-white/95 lg:hidden">
          <div className="container py-4">
            <div className="surface-card flex flex-col gap-2 p-3">
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-eco-50/70 p-2.5">
                <EcoLinguaLogo size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-eco-900">EcoLingua Vietnam</p>
                  <p className="truncate text-xs text-eco-700">Ngôn ngữ cho hành động khí hậu</p>
                </div>
              </div>
              {NAV_LINKS.map((link) => {
                const active = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      active ? "bg-eco-100 text-eco-800" : "text-foreground hover:bg-eco-50 hover:text-eco-700"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Button variant="yellow" className="mt-2 w-full" asChild>
                <Link href="/tham-gia" onClick={() => setOpen(false)}>
                  Đăng ký ngay
                </Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <a
                  href={FACEBOOK_FANPAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  aria-label="Theo dõi Fanpage EcoLingua Vietnam"
                >
                  <Megaphone className="size-4" />
                  Theo dõi Fanpage
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
