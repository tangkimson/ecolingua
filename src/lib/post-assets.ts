import { parseCoverImageTransform } from "@/lib/image-presentation";
import { extractImageSourcesFromHtml } from "@/lib/post-images";

export type PostImageAsset = {
  url: string;
  publicId: string;
  kind: "cover" | "content";
};

function extractCloudinaryPublicId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    const path = parsed.pathname;
    const uploadMarker = "/image/upload/";
    const markerIndex = path.indexOf(uploadMarker);
    if (markerIndex < 0) return null;

    let tail = path.slice(markerIndex + uploadMarker.length);
    const tailParts = tail.split("/").filter(Boolean);
    if (tailParts.length === 0) return null;

    if (/^v\d+$/.test(tailParts[0] || "")) {
      tailParts.shift();
    }
    tail = tailParts.join("/");
    if (!tail) return null;

    return tail.replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return null;
  }
}

function fromUrls(urls: Array<{ url: string; kind: "cover" | "content" }>) {
  const unique = new Map<string, PostImageAsset>();

  for (const entry of urls) {
    const cleanUrl = entry.url.trim();
    if (!cleanUrl) continue;
    const publicId = extractCloudinaryPublicId(cleanUrl);
    if (!publicId) continue;

    unique.set(publicId, {
      url: cleanUrl,
      publicId,
      kind: entry.kind
    });
  }

  return Array.from(unique.values());
}

export function extractPostImageAssets(coverImage: string, content: string) {
  const coverSrc = parseCoverImageTransform(coverImage).src;
  const contentImages = extractImageSourcesFromHtml(content);

  const urls: Array<{ url: string; kind: "cover" | "content" }> = [];
  if (coverSrc) urls.push({ url: coverSrc, kind: "cover" });
  for (const src of contentImages) {
    urls.push({ url: src, kind: "content" });
  }

  return fromUrls(urls);
}

export function parsePersistedPostImageAssets(value: unknown): PostImageAsset[] {
  if (!Array.isArray(value)) return [];
  const assets: PostImageAsset[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Partial<PostImageAsset>;
    if (typeof entry.url !== "string" || typeof entry.publicId !== "string") continue;
    const kind = entry.kind === "cover" ? "cover" : "content";
    assets.push({ url: entry.url, publicId: entry.publicId, kind });
  }

  return assets;
}
