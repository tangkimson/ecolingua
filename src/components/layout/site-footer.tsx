import Link from "next/link";
import { ArrowUpRight, Globe, Mail, Megaphone, Phone } from "lucide-react";
import { FACEBOOK_FANPAGE_URL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="bg-gradient-to-br from-eco-950 via-eco-900 to-eco-800 text-white">
      <div className="container grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-xl font-bold text-white">EcoLingua Vietnam</h3>
          <p className="mt-3 text-sm text-eco-100">Ngôn ngữ cho hành động môi trường.</p>
          <p className="mt-3 text-sm leading-relaxed text-eco-200">
            Sáng kiến phi lợi nhuận kết nối tri thức khí hậu với cộng đồng qua dịch thuật, giáo dục và truyền thông.
          </p>
          <div className="mt-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
            Community-first education
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white">Hoạt động</h4>
          <ul className="mt-3 space-y-2 text-sm text-eco-100">
            <li>Dịch thuật khí hậu</li>
            <li>EcoLingua Academy</li>
            <li>Green Communications Lab</li>
            <li>Mạng lưới hành động địa phương</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Tham gia</h4>
          <ul className="mt-3 space-y-2 text-sm text-eco-100">
            <li>
              <Link href="/tham-gia" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">
                Đăng ký tình nguyện viên
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
            <li>
              <Link href="/lien-he" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">
                Hợp tác doanh nghiệp
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
            <li>
              <Link href="/quyen-gop" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">
                Ủng hộ hoạt động
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Kết nối</h4>
          <p className="mt-3 text-sm text-eco-100">Email: ecolinguavietnam@gmail.com</p>
          <p className="text-sm text-eco-100">Phạm vi: 63 tỉnh thành</p>
          <div className="mt-4 flex gap-2">
            <a
              href={FACEBOOK_FANPAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Fanpage EcoLingua Vietnam"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-eco-100 transition-colors hover:bg-white/20"
            >
              <Megaphone className="size-4" />
            </a>
            {[Globe, Phone, Mail].map((Icon, index) => (
              <span key={index} className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-eco-100">
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-eco-100">
        © {new Date().getFullYear()} EcoLingua Vietnam. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
