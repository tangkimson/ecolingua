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

export function normalizePostContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "<p></p>";
  if (isLikelyHtml(trimmed)) return trimmed;

  const blocks = trimmed.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}
