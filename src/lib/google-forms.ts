const GOOGLE_FORMS_HOSTS = new Set(["docs.google.com", "forms.gle"]);

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
  const segments = url.pathname.split("/").filter(Boolean);
  const formsIndex = segments.indexOf("forms");
  const dIndex = segments.indexOf("d");
  const eIndex = segments.indexOf("e");

  let embedPath = "";
  if (formsIndex === 0 && dIndex === 1 && eIndex === 2 && segments[3]) {
    // /forms/d/e/<id>/viewform
    embedPath = `/forms/d/e/${segments[3]}/viewform`;
  } else if (formsIndex === 0 && dIndex === 1 && segments[2]) {
    // /forms/d/<id>/...
    embedPath = `/forms/d/${segments[2]}/viewform`;
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
  const embedUrl = buildEmbedUrl(resolved);

  return {
    originalUrl: resolved.toString(),
    embedUrl
  };
}
