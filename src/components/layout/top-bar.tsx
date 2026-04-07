import { Clock3, ExternalLink, Mail, MapPin, Megaphone } from "lucide-react";
import { FACEBOOK_FANPAGE_URL } from "@/lib/constants";

export function TopBar() {
  return (
    <div className="bg-gradient-to-r from-eco-900 via-eco-800 to-eco-700 py-2 text-xs text-white">
      <div className="container flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
            <MapPin className="size-3.5" />
            TP. HCM - Hoạt động trên toàn quốc
          </span>
          <a
            href="mailto:ecolinguavietnam@gmail.com"
            className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-eco-50 hover:text-white hover:underline"
          >
            <Mail className="size-3.5" />
            ecolinguavietnam@gmail.com
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            Cập nhật hằng tuần
          </span>
          <a
            href={FACEBOOK_FANPAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 font-semibold text-amber-200 transition-colors hover:bg-white/15 hover:text-amber-100"
          >
            <Megaphone className="size-3.5" />
            Fanpage: Ecolingua Vietnam
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
