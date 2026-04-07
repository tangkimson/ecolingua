import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const beVietnam = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "EcoLingua Vietnam",
  description: "Kết nối ngôn ngữ và tri thức môi trường để cộng đồng cùng hành động bền vững"
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
