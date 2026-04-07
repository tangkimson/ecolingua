import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import * as OTPAuth from "otpauth";

const TOTP_ISSUER = "EcoLingua Admin";

function encryptionKey() {
  const source = process.env.TOTP_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!source) {
    throw new Error("Missing TOTP_ENCRYPTION_KEY or NEXTAUTH_SECRET for 2FA encryption.");
  }
  return createHash("sha256").update(source).digest();
}

export function normalizeTotpCode(code: string) {
  return code.replace(/\s+/g, "").trim();
}

export function generateTotpSecret() {
  return new OTPAuth.Secret().base32;
}

export function buildOtpAuthUri(email: string, secret: string) {
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });
  return totp.toString();
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptTotpSecret(payload: string) {
  const [ivB64, tagB64, cipherB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !cipherB64) return null;

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}

export function verifyTotpCode(secret: string, code: string) {
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });
  return totp.validate({ token: normalizeTotpCode(code), window: 1 }) !== null;
}
