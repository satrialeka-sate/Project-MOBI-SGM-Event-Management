import type { NextAuthConfig } from "next-auth";
import { ROLES } from "@/constants/roles";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      // Public paths
      const publicPaths = ["/login", "/api/auth"];
      if (publicPaths.some((path) => nextUrl.pathname.startsWith(path))) {
        return true;
      }

      // Protected routes require login
      if (nextUrl.pathname.startsWith("/dashboard")) {
        if (!isLoggedIn) return false;
      }

      // Role-based access control for dashboard sections
      const roleAccess: Record<string, string[]> = {
        "/dashboard/admin": [ROLES.ADMIN],
        "/dashboard/permitter": [ROLES.ADMIN, ROLES.PERMITTER],
        "/dashboard/spg": [ROLES.ADMIN, ROLES.SPG],
        "/dashboard/supervisor": [ROLES.ADMIN, ROLES.SUPERVISOR],
      };

      for (const [path, allowedRoles] of Object.entries(roleAccess)) {
        if (nextUrl.pathname.startsWith(path)) {
          if (!allowedRoles.includes(role ?? "")) {
            return Response.redirect(new URL("/unauthorized", nextUrl));
          }
          return true;
        }
      }

      // Allow all other routes if authenticated
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.regionId = user.regionId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.regionId = token.regionId as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
