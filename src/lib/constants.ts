export const SITE_NAME = "EcoLingua Vietnam";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const FACEBOOK_FANPAGE_URL = "https://www.facebook.com/profile.php?id=61580753343470";
export const INSTAGRAM_URL = "https://www.instagram.com/ecolingua.vn";

export const NAV_LINKS = [
  { label: "Trang Chủ", href: "/" },
  { label: "Giới Thiệu", href: "/gioi-thieu" },
  { label: "Hoạt Động", href: "/#hoat-dong" },
  { label: "Tham Gia", href: "/tham-gia" },
  { label: "Quyên Góp", href: "/quyen-gop" },
  { label: "Tin Tức", href: "/tin-tuc" },
  { label: "Liên Hệ", href: "/lien-he" }
] as const;
