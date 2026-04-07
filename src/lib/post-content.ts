function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isLikelyHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content.trim());
}

function sanitizeStyle(styleValue: string) {
  const value = styleValue.trim();
  if (!value) return "";
  if (/(expression|@import|javascript:|url\s*\()/i.test(value)) return "";
  if (!/^[a-z0-9:;#%(),.\-\s/]+$/i.test(value)) return "";
  return value;
}

function sanitizeUrl(value: string, forImage = false) {
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  if (!normalized) return "";

  const lower = normalized.toLowerCase();
  if (forImage && lower.startsWith("data:image/")) return normalized;
  if (lower.startsWith("http://") || lower.startsWith("https://")) return normalized;
  if (!forImage && (lower.startsWith("mailto:") || lower.startsWith("tel:"))) return normalized;
  if (normalized.startsWith("/") || normalized.startsWith("#")) return normalized;
  return "";
}

function sanitizeHtml(content: string) {
  let safe = content;

  // Strip high-risk tags entirely.
  safe = safe.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|frame|frameset)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  safe = safe.replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|frame|frameset)\b[^>]*\/?>/gi, "");

  // Remove inline event handlers (onclick, onerror, ...).
  safe = safe.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Sanitize href values.
  safe = safe.replace(/\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_full, dQuoted, sQuoted, unquoted) => {
    const raw = String(dQuoted ?? sQuoted ?? unquoted ?? "");
    const cleaned = sanitizeUrl(raw, false);
    return cleaned ? ` href="${cleaned}"` : "";
  });

  // Sanitize src values.
  safe = safe.replace(/\s+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_full, dQuoted, sQuoted, unquoted) => {
    const raw = String(dQuoted ?? sQuoted ?? unquoted ?? "");
    const cleaned = sanitizeUrl(raw, true);
    return cleaned ? ` src="${cleaned}"` : "";
  });

  // Sanitize inline style while keeping safe formatting for authored content.
  safe = safe.replace(/\s+style\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_full, dQuoted, sQuoted, unquoted) => {
    const raw = String(dQuoted ?? sQuoted ?? unquoted ?? "");
    const cleaned = sanitizeStyle(raw);
    return cleaned ? ` style="${cleaned}"` : "";
  });

  return safe;
}

export function normalizePostContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "<p></p>";
  if (isLikelyHtml(trimmed)) return sanitizeHtml(trimmed);

  const blocks = trimmed.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}
