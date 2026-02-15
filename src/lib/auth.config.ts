import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types/auth";

/**
 * Edge-safe auth config (no Node.js imports like Prisma/bcrypt).
 * Used by middleware for JWT validation only.
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts (not needed for JWT validation)
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.includes("/manage");

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
