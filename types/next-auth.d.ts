import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    level?: string;
    scope?: string;
    regionId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      level: string;
      scope: string;
      regionId: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    level: string;
    scope: string;
    regionId: string;
  }
}
