import { SiteFooter } from "@/components/layout/site-footer";
import { FanpageFloatingButton } from "@/components/layout/fanpage-floating-button";
import { SiteHeader } from "@/components/layout/site-header";
import { TopBar } from "@/components/layout/top-bar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold text-eco-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Bỏ qua đến nội dung chính
      </a>
      <TopBar />
      <SiteHeader />
      <main id="main-content">{children}</main>
      <FanpageFloatingButton />
      <SiteFooter />
    </>
  );
}
