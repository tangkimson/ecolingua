import { ExternalLink, Megaphone } from "lucide-react";
import { FACEBOOK_FANPAGE_URL } from "@/lib/constants";

export function FanpageFloatingButton() {
  return (
    <a
      href={FACEBOOK_FANPAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Theo dõi Fanpage EcoLingua Vietnam"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-14px_rgba(24,119,242,0.95)] transition-transform hover:-translate-y-0.5 hover:bg-[#166FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1877F2] md:bottom-6 md:right-6"
    >
      <Megaphone className="size-4 shrink-0" />
      <span className="hidden sm:inline">Theo dõi Fanpage</span>
      <ExternalLink className="hidden size-3.5 sm:inline" />
    </a>
  );
}
