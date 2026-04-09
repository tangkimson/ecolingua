import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import {
  getPrecheckCookieName,
  isLikelyEmailIdentifier,
  normalizeAdminIdentifier,
  verifyPrecheckToken
} from "@/lib/admin-login-flow";
import { prisma } from "@/lib/prisma";
import { clearAuthFailures, getAuthLockStatus, registerAuthFailure } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validations";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/totp";

const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const ADMIN_SESSION_UPDATE_AGE_SECONDS = 15 * 60;

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

function getForwardedIp(headers: Record<string, string | string[] | undefined> | undefined) {
  const xForwardedForRaw = headers?.["x-forwarded-for"];
  const xForwardedFor = Array.isArray(xForwardedForRaw) ? xForwardedForRaw[0] : xForwardedForRaw;
  if (xForwardedFor) return xForwardedFor.split(",")[0]?.trim() || "unknown";

  const xRealIpRaw = headers?.["x-real-ip"];
  const xRealIp = Array.isArray(xRealIpRaw) ? xRealIpRaw[0] : xRealIpRaw;
  return xRealIp || "unknown";
}

function authAttemptKey(identifier: string, ip: string) {
  return `admin-login:${identifier}:${ip}`;
}

export const authOptions: NextAuthOptions = {
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
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const normalizedIdentifier = normalizeAdminIdentifier(parsed.data.identifier);
        const sourceHeaders = req?.headers as Record<string, string | string[] | undefined> | undefined;
        const ip = getForwardedIp(sourceHeaders);
        const loginKey = authAttemptKey(normalizedIdentifier, ip);
        const lockStatus = await getAuthLockStatus(loginKey);
        if (lockStatus.locked) return null;

        const precheckCookie = getCookieFromHeader(req?.headers?.cookie, getPrecheckCookieName());
        const precheck = verifyPrecheckToken(precheckCookie);
        if (!precheck || precheck.identifier !== normalizedIdentifier) {
          await registerAuthFailure(loginKey);
          return null;
        }

        const user = isLikelyEmailIdentifier(normalizedIdentifier)
          ? await prisma.adminUser.findUnique({
              where: { email: normalizedIdentifier }
            })
          : await prisma.adminUser.findFirst({
              where: {
                email: {
                  startsWith: `${normalizedIdentifier}@`,
                  mode: "insensitive"
                }
              }
            });
        if (!user) {
          await registerAuthFailure(loginKey);
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          await registerAuthFailure(loginKey);
          return null;
        }

        if (user.twoFactorEnabled) {
          if (!user.twoFactorSecret || !parsed.data.totpCode) {
            await registerAuthFailure(loginKey);
            return null;
          }

          try {
            const secret = decryptTotpSecret(user.twoFactorSecret);
            if (!secret || !verifyTotpCode(secret, parsed.data.totpCode)) {
              await registerAuthFailure(loginKey);
              return null;
            }
          } catch {
            await registerAuthFailure(loginKey);
            return null;
          }
        }

        await clearAuthFailures(loginKey);

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
