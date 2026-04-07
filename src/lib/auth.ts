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
import { adminLoginSchema } from "@/lib/validations";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/totp";

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

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
        const precheckCookie = getCookieFromHeader(req?.headers?.cookie, getPrecheckCookieName());
        const precheck = verifyPrecheckToken(precheckCookie);
        if (!precheck || precheck.identifier !== normalizedIdentifier) return null;

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
        if (!user) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (user.twoFactorEnabled) {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "ADMIN");
      }
      return session;
    }
  }
};
