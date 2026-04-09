import { createHash } from "node:crypto";

type CloudinaryImageUploadResult = {
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
};

type CloudinaryEnv = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

function cloudinaryEnv(): CloudinaryEnv {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "";
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || "";
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "ecolingua/posts";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.");
  }

  return { cloudName, apiKey, apiSecret, folder };
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

function buildSignature(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");
}

export async function uploadImageToCloudinary(buffer: Buffer, mimeType: string): Promise<CloudinaryImageUploadResult> {
  const { cloudName, apiKey, apiSecret, folder } = cloudinaryEnv();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = buildSignature({ folder, timestamp }, apiSecret);

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }));
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
    cache: "no-store"
  });

  const payload = (await response.json()) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    bytes?: number;
    error?: { message?: string };
  };

  if (!response.ok || !payload.public_id || !(payload.secure_url || payload.url)) {
    throw new Error(payload.error?.message || "Cloudinary upload failed.");
  }

  return {
    url: payload.secure_url || payload.url || "",
    publicId: payload.public_id,
    width: typeof payload.width === "number" ? payload.width : null,
    height: typeof payload.height === "number" ? payload.height : null,
    bytes: typeof payload.bytes === "number" ? payload.bytes : null
  };
}

export async function deleteImageFromCloudinary(publicId: string) {
  const cleanPublicId = publicId.trim();
  if (!cleanPublicId) return;

  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = buildSignature({ public_id: cleanPublicId, timestamp }, apiSecret);

  const form = new FormData();
  form.append("public_id", cleanPublicId);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Cloudinary destroy request failed.");
  }
}
