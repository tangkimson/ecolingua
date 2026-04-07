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
  const host = headerStore.get("host");
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
