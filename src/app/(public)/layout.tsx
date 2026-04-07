import { SiteFooter } from "@/components/layout/site-footer";
import { FanpageFloatingButton } from "@/components/layout/fanpage-floating-button";
import { SiteHeader } from "@/components/layout/site-header";
import { TopBar } from "@/components/layout/top-bar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <main>{children}</main>
      <FanpageFloatingButton />
      <SiteFooter />
    </>
  );
}
