import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const PRECHECK_COOKIE_NAME = "admin_login_precheck";
const PRECHECK_MAX_AGE_SECONDS = 5 * 60;

type PrecheckPayload = {
  identifier: string;
  verifiedAt: number;
  nonce: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getPrecheckSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.TOTP_ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing NEXTAUTH_SECRET (or TOTP_ENCRYPTION_KEY) for admin login precheck.");
  return secret;
}

function signPayload(payloadB64: string) {
  return createHmac("sha256", getPrecheckSecret()).update(payloadB64).digest("base64url");
}

export function normalizeAdminIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function isLikelyEmailIdentifier(identifier: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

export function buildPrecheckToken(identifier: string) {
  const payload: PrecheckPayload = {
    identifier: normalizeAdminIdentifier(identifier),
    verifiedAt: Date.now(),
    nonce: randomBytes(16).toString("hex")
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyPrecheckToken(token: string | undefined | null) {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = signPayload(payloadB64);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payloadB64)) as PrecheckPayload;
    if (!parsed?.identifier || !parsed.verifiedAt) return null;
    const ageMs = Date.now() - Number(parsed.verifiedAt);
    if (ageMs < 0 || ageMs > PRECHECK_MAX_AGE_SECONDS * 1000) return null;
    return {
      identifier: normalizeAdminIdentifier(parsed.identifier),
      verifiedAt: Number(parsed.verifiedAt)
    };
  } catch {
    return null;
  }
}

export function getPrecheckCookieName() {
  return PRECHECK_COOKIE_NAME;
}

export function getPrecheckMaxAgeSeconds() {
  return PRECHECK_MAX_AGE_SECONDS;
}
