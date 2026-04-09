import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import {
  getPrecheckCookieName,
  normalizeAdminIdentifier,
  verifyPrecheckToken
} from "@/lib/admin-login-flow";
import { prisma } from "@/lib/prisma";
import { simpleRateLimit } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validations";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/totp";
import { assertSecurityEnv } from "@/lib/env";

const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const ADMIN_SESSION_UPDATE_AGE_SECONDS = 15 * 60;
const DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOeRz2R7sRKqGZo4PMBVXgS5aXoaZySUO";
const OTP_RATE_LIMIT_MAX = 6;
const OTP_RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const OTP_RATE_LIMIT_PREFIX = "admin-otp";

function getCookieFromHeader(headerValue: string | undefined, cookieName: string) {
  if (!headerValue) return null;
  const parts = headerValue.split(";").map((entry) => entry.trim());
  for (const entry of parts) {
    if (entry.startsWith(`${cookieName}=`)) {
      return decodeURIComponent(entry.slice(cookieName.length + 1));
    }
  }
  return null;
}

function getClientIpFromHeaders(headers: Record<string, string | string[] | undefined>) {
  const xForwardedFor = headers["x-forwarded-for"];
  const forwardedRaw = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
  if (forwardedRaw) {
    const ip = forwardedRaw.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const xRealIp = headers["x-real-ip"];
  const realIp = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  return realIp || "unknown";
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    updateAge: ADMIN_SESSION_UPDATE_AGE_SECONDS
  },
  jwt: {
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  },
  pages: {
    signIn: "/admin/login"
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        identifier: { label: "Email hoặc Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        assertSecurityEnv();
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const normalizedIdentifier = normalizeAdminIdentifier(parsed.data.identifier);
        const precheckCookie = getCookieFromHeader(req?.headers?.cookie, getPrecheckCookieName());
        const precheck = verifyPrecheckToken(precheckCookie);
        if (!precheck || precheck.identifier !== normalizedIdentifier) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: normalizedIdentifier }
        });
        if (!user) {
          await compare(parsed.data.password, DUMMY_HASH);
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (user.twoFactorEnabled) {
          const clientIp = getClientIpFromHeaders(req?.headers || {});
          const otpRate = await simpleRateLimit(
            `${OTP_RATE_LIMIT_PREFIX}:${normalizedIdentifier}:${clientIp}`,
            OTP_RATE_LIMIT_MAX,
            OTP_RATE_LIMIT_WINDOW_MS
          );
          if (!otpRate.success) return null;

          if (!user.twoFactorSecret || !parsed.data.totpCode) return null;

          try {
            const secret = decryptTotpSecret(user.twoFactorSecret);
            if (!secret || !verifyTotpCode(secret, parsed.data.totpCode)) return null;
          } catch {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "ADMIN";
        token.email = user.email;
      }

      const tokenId = typeof token.id === "string" ? token.id : "";
      const tokenEmail = typeof token.email === "string" ? token.email : "";
      let adminUser: { id: string; email: string; role: string } | null = null;

      if (tokenId) {
        adminUser = await prisma.adminUser.findUnique({
          where: { id: tokenId },
          select: { id: true, email: true, role: true }
        });
      } else if (tokenEmail) {
        adminUser = await prisma.adminUser.findUnique({
          where: { email: tokenEmail.toLowerCase() },
          select: { id: true, email: true, role: true }
        });
      }

      if (!adminUser || adminUser.role !== "ADMIN") {
        delete token.id;
        delete token.role;
        delete token.email;
        return token;
      }

      token.id = adminUser.id;
      token.role = adminUser.role;
      token.email = adminUser.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "");
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
      }
      return session;
    }
  }
};
