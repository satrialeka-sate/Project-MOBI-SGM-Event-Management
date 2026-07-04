import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import type { UserRole } from "../generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Google],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      if (!profile?.email) return false;

      const user = await prisma.user.findUnique({
        where: { email: profile.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          level: true,
          scope: true,
          regionId: true,
          isActive: true,
          googleId: true,
        },
      });

      // Reject if email not registered in the system
      if (!user) return "/login?error=EmailNotFound";

      // Reject if account is disabled
      if (!user.isActive) return "/login?error=AccountDisabled";

      // Update googleId, image, and lastLoginAt on every successful login
      const updateData: Record<string, unknown> = {
        lastLoginAt: new Date(),
      };

      if (profile.image) {
        updateData.image = profile.image as string;
      }

      // Store googleId on first login if not already set
      if (!user.googleId && account?.providerAccountId) {
        updateData.googleId = account.providerAccountId;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData as {
          lastLoginAt?: Date;
          image?: string;
          googleId?: string;
        },
      });

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        // On sign in, fetch user data from DB
        const user = await prisma.user.findUnique({
          where: { email: profile.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            level: true,
            scope: true,
            regionId: true,
          },
        });

        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = user.role;
          token.level = user.level;
          token.scope = user.scope;
          token.regionId = user.regionId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.level = token.level as string;
        session.user.scope = token.scope as string;
        session.user.regionId = token.regionId as string;
      }
      return session;
    },
  },
});
