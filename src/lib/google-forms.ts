const GOOGLE_FORMS_HOSTS = new Set(["docs.google.com", "forms.google.com", "forms.gle"]);

function parseInputUrl(raw: string) {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("Đường dẫn không hợp lệ.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Chỉ hỗ trợ link Google Forms dạng http/https.");
  }

  if (!GOOGLE_FORMS_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Vui lòng nhập đúng link Google Forms.");
  }

  return parsed;
}

async function resolveShortGoogleFormLink(url: URL) {
  if (url.hostname.toLowerCase() !== "forms.gle") return url;

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Không thể truy cập link rút gọn.");
    }

    return parseInputUrl(response.url);
  } catch {
    throw new Error("Không thể chuyển link rút gọn forms.gle. Vui lòng dán link đầy đủ từ Google Forms.");
  }
}

function buildEmbedUrl(url: URL) {
  const path = url.pathname;
  const embeddedMatch = path.match(/\/forms\/d\/e\/([^/]+)/i);
  const publicMatch = path.match(/\/forms\/d\/([^/]+)/i);

  let embedPath: string;
  if (embeddedMatch?.[1]) {
    embedPath = `/forms/d/e/${embeddedMatch[1]}/viewform`;
  } else if (publicMatch?.[1]) {
    embedPath = `/forms/d/${publicMatch[1]}/viewform`;
  } else {
    throw new Error("Không nhận diện được link Google Forms.");
  }

  const embedUrl = new URL(`https://docs.google.com${embedPath}`);
  for (const [key, value] of url.searchParams.entries()) {
    // Keep prefill values and other supported params.
    if (key !== "embedded") {
      embedUrl.searchParams.set(key, value);
    }
  }
  embedUrl.searchParams.set("embedded", "true");
  return embedUrl.toString();
}

export async function normalizeGoogleFormLink(rawUrl: string | null | undefined) {
  if (!rawUrl || !rawUrl.trim()) {
    return { originalUrl: null, embedUrl: null };
  }

  const parsed = parseInputUrl(rawUrl);
  const resolved = await resolveShortGoogleFormLink(parsed);
  const canonicalInput = new URL(resolved.toString());
  canonicalInput.hostname = canonicalInput.hostname.toLowerCase() === "forms.google.com" ? "docs.google.com" : canonicalInput.hostname;
  const embedUrl = buildEmbedUrl(canonicalInput);

  return {
    originalUrl: canonicalInput.toString(),
    embedUrl
  };
}
