import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import "@/styles/globals.css";

const beVietnam = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: "Kết nối ngôn ngữ và tri thức môi trường để cộng đồng cùng hành động bền vững.",
  openGraph: {
    title: SITE_NAME,
    description: "Kết nối ngôn ngữ và tri thức môi trường để cộng đồng cùng hành động bền vững.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "vi_VN"
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Kết nối ngôn ngữ và tri thức môi trường để cộng đồng cùng hành động bền vững."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${beVietnam.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
