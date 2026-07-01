import { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "@/constants/prisma-enums";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: UserRole;
    level?: string;
    scope?: string;
    regionId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      level: string;
      scope: string;
      regionId: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    level: string;
    scope: string;
    regionId: string;
  }
}
