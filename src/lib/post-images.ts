const LOCAL_POST_UPLOAD_PREFIX = "/uploads/posts/";
const DEFAULT_MAX_IMAGES_PER_POST = 10;

function stripHash(value: string) {
  return value.trim().split("#", 1)[0] ?? "";
}

function isLocalPostUploadPath(value: string) {
  return value.startsWith(LOCAL_POST_UPLOAD_PREFIX);
}

function collectTrustedHosts() {
  const hosts = new Set<string>();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const authUrl = process.env.NEXTAUTH_URL;
  for (const raw of [siteUrl, authUrl]) {
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).host.toLowerCase());
    } catch {
      // Ignore malformed optional env values.
    }
  }

  if (typeof window !== "undefined" && window.location.host) {
    hosts.add(window.location.host.toLowerCase());
  }

  const cloudinaryCloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (cloudinaryCloudName) {
    hosts.add("res.cloudinary.com");
  }

  return hosts;
}

function isCloudinaryUploadPath(pathname: string) {
  const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  if (!cloudName) return false;
  const normalizedPath = pathname.replace(/\/{2,}/g, "/");
  return normalizedPath.startsWith(`/${cloudName}/image/upload/`);
}

export function normalizeImageSource(value: string) {
  return stripHash(value);
}

export function isAllowedAdminImageSource(value: string) {
  const normalized = normalizeImageSource(value);
  if (!normalized) return false;

  if (/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i.test(normalized)) {
    return true;
  }

  if (isLocalPostUploadPath(normalized)) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol)) return false;

    const isAllowedPath = isLocalPostUploadPath(parsed.pathname) || isCloudinaryUploadPath(parsed.pathname);
    if (!isAllowedPath) return false;

    const trustedHosts = collectTrustedHosts();
    if (!trustedHosts.size) return false;
    return trustedHosts.has(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}

export function extractImageSourcesFromHtml(content: string) {
  const sources: string[] = [];
  const imageTagRegex = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

  let match = imageTagRegex.exec(content);
  while (match) {
    const src = String(match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (src) sources.push(src);
    match = imageTagRegex.exec(content);
  }

  return sources;
}

export function findDisallowedImageSources(content: string, allowedLegacySources: Set<string> = new Set()) {
  const uniqueSources = new Set(extractImageSourcesFromHtml(content).map(normalizeImageSource));
  const invalidSources: string[] = [];

  for (const source of uniqueSources) {
    if (!source) continue;
    if (isAllowedAdminImageSource(source) || allowedLegacySources.has(source)) continue;
    invalidSources.push(source);
  }

  return invalidSources;
}

export function countUniqueImageSources(content: string) {
  return new Set(extractImageSourcesFromHtml(content).map(normalizeImageSource).filter(Boolean)).size;
}

export function exceedsMaxImagesPerPost(content: string, maxImages = DEFAULT_MAX_IMAGES_PER_POST) {
  return countUniqueImageSources(content) > maxImages;
}
