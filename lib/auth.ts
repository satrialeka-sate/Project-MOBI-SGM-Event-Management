import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import type { UserRole } from "../generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google,
    Credentials({
      credentials: {
        identifier: { label: "Email or Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = String(credentials.identifier ?? "");
        const password = String(credentials.password ?? "");

        if (!identifier || !password) return null;
        if (password.length < 8) return null;

        // Determine if identifier is email or username
        const isEmail = identifier.includes("@");

        // Find user by email or username
        const user = isEmail
          ? await prisma.user.findUnique({ where: { email: identifier } })
          : await prisma.user.findUnique({ where: { username: identifier } });

        if (!user) return null;
        if (!user.password) return null;
        if (!user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          level: user.level,
          scope: user.scope,
          regionId: user.regionId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

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
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "credentials" && user) {
        // Credentials sign-in — use user object from authorize
        token.id = user.id!;
        token.email = user.email!;
        token.name = user.name!;
        token.role = user.role! as UserRole;
        token.level = user.level! as string;
        token.scope = user.scope! as string;
        token.regionId = user.regionId! as string;
      } else if (account && profile?.email) {
        // Google sign-in — fetch user data from DB
        const dbUser = await prisma.user.findUnique({
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

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.level = dbUser.level;
          token.scope = dbUser.scope;
          token.regionId = dbUser.regionId;
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
