import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_SECRET: z.string().optional(),
  PRECHECK_HMAC_SECRET: z.string().optional(),
  TOTP_ENCRYPTION_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  CAPTCHA_BYPASS: z.string().optional()
});

let envChecked = false;

function sameHost(left: string, right: string) {
  try {
    return new URL(left).host === new URL(right).host;
  } catch {
    return false;
  }
}

export function assertSecurityEnv() {
  if (envChecked) return;

  const parsed = baseEnvSchema.parse(process.env);
  if (parsed.NODE_ENV !== "production") {
    envChecked = true;
    return;
  }

  const requiredSecrets = [
    ["NEXTAUTH_SECRET", parsed.NEXTAUTH_SECRET],
    ["PRECHECK_HMAC_SECRET", parsed.PRECHECK_HMAC_SECRET],
    ["TOTP_ENCRYPTION_KEY", parsed.TOTP_ENCRYPTION_KEY],
    ["TURNSTILE_SECRET_KEY", parsed.TURNSTILE_SECRET_KEY],
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", parsed.NEXT_PUBLIC_TURNSTILE_SITE_KEY],
    ["NEXTAUTH_URL", parsed.NEXTAUTH_URL],
    ["NEXT_PUBLIC_SITE_URL", parsed.NEXT_PUBLIC_SITE_URL]
  ] as const;

  const missing = requiredSecrets.filter(([, value]) => !value || !value.trim()).map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing required production env variables: ${missing.join(", ")}`);
  }

  if (parsed.CAPTCHA_BYPASS === "true") {
    throw new Error("CAPTCHA_BYPASS=true is not allowed in production.");
  }

  if (!sameHost(parsed.NEXTAUTH_URL!, parsed.NEXT_PUBLIC_SITE_URL!)) {
    throw new Error("NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL must use the same host in production.");
  }

  envChecked = true;
}
