import { headers } from "next/headers";

const SANITIZE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

export function sanitizeText(value: string) {
  return value.replace(/[&<>"']/g, (char) => SANITIZE_MAP[char]);
}

export function getClientIp() {
  const headerStore = headers();
  const xForwardedFor = headerStore.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0]?.trim() || "unknown";
  return headerStore.get("x-real-ip") || "unknown";
}

export function isTrustedOrigin() {
  const headerStore = headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const referer = headerStore.get("referer");
  if (!host) return false;

  const allowedHosts = new Set<string>([host]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const authUrl = process.env.NEXTAUTH_URL;

  try {
    if (siteUrl) allowedHosts.add(new URL(siteUrl).host);
  } catch {
    // Ignore malformed optional env.
  }
  try {
    if (authUrl) allowedHosts.add(new URL(authUrl).host);
  } catch {
    // Ignore malformed optional env.
  }

  try {
    if (origin) {
      const originUrl = new URL(origin);
      return allowedHosts.has(originUrl.host);
    }

    if (referer) {
      const refererUrl = new URL(referer);
      return allowedHosts.has(refererUrl.host);
    }

    return false;
  } catch {
    return false;
  }
}
