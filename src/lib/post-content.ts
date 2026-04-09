import sanitizeHtmlLib from "sanitize-html";

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

function sanitizePostHtml(content: string) {
  return sanitizeHtmlLib(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "a",
      "img",
      "span"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "style"],
      span: ["style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"]
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"]
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    parseStyleAttributes: true,
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/i, /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/i],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/i, /^rgba\((\s*\d+\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/i],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
        "text-align": [/^(left|right|center|justify)$/],
        display: [/^(inline|block|inline-block)$/],
        width: [/^\d{1,3}%$/, /^\d{1,4}px$/],
        "max-width": [/^\d{1,3}%$/, /^\d{1,4}px$/],
        height: [/^(auto|\d{1,4}px)$/],
        transform: [/^rotate\(-?\d{1,3}deg\)$/],
        "transform-origin": [/^(left|center|right|top|bottom)(\s+(left|center|right|top|bottom))?$/],
        margin: [/^(auto|0|\d{1,4}px)(\s+(auto|0|\d{1,4}px)){0,3}$/]
      }
    },
    transformTags: {
      a: (_tagName, attrs) => {
        const target = attrs.target === "_blank" ? "_blank" : undefined;
        const rel = target ? "noopener noreferrer nofollow" : attrs.rel;
        const attribs: Record<string, string> = {};
        if (attrs.href) attribs.href = attrs.href;
        if (attrs.title) attribs.title = attrs.title;
        if (target) attribs.target = target;
        if (rel) attribs.rel = rel;
        return {
          tagName: "a",
          attribs
        };
      }
    }
  });
}

export function normalizePostContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "<p></p>";
  if (isLikelyHtml(trimmed)) return sanitizePostHtml(trimmed);

  const blocks = trimmed.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}
