import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Public paths — always allow
      const publicPaths = ["/login", "/register", "/api/auth", "/api/regions"];
      if (publicPaths.some((path) => nextUrl.pathname.startsWith(path))) {
        return true;
      }

      // Root path — redirect to dashboard if logged in, or login if not
      if (nextUrl.pathname === "/") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return Response.redirect(new URL("/login", nextUrl));
      }

      // All other routes require authentication
      if (!isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
