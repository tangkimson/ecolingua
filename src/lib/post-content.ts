import sanitizeHtmlLib from "sanitize-html";
import { isAllowedAdminImageSource, normalizeImageSource } from "@/lib/post-images";

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

function sanitizeUrl(value: string, forImage = false) {
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  if (!normalized) return "";

  const lower = normalized.toLowerCase();
  if (forImage && isAllowedAdminImageSource(normalized)) return normalizeImageSource(normalized);
  if (lower.startsWith("http://") || lower.startsWith("https://")) return normalized;
  if (!forImage && (lower.startsWith("mailto:") || lower.startsWith("tel:"))) return normalized;
  if (normalized.startsWith("/") || normalized.startsWith("#")) return normalized;
  return "";
}

function sanitizeHtml(content: string) {
  return sanitizeHtmlLib(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "h2",
      "h3",
      "h4",
      "img",
      "code",
      "pre"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"]
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (_tagName: string, attribs: Record<string, string>) => {
        const href = sanitizeUrl(attribs.href || "", false);
        const normalizedTarget = attribs.target === "_blank" ? "_blank" : undefined;
        return {
          tagName: "a",
          attribs: {
            ...(href ? { href } : {}),
            ...(normalizedTarget ? { target: normalizedTarget, rel: "noopener noreferrer" } : {})
          }
        };
      },
      img: (_tagName: string, attribs: Record<string, string>) => {
        const src = sanitizeUrl(attribs.src || "", true);
        return {
          tagName: "img",
          attribs: {
            ...(src ? { src } : {}),
            ...(attribs.alt ? { alt: attribs.alt } : {}),
            ...(attribs.title ? { title: attribs.title } : {})
          }
        };
      }
    },
    exclusiveFilter(frame: { tag: string; attribs: Record<string, string> }) {
      if (frame.tag === "img") {
        const src = frame.attribs.src || "";
        return !src;
      }
      return false;
    }
  });
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
