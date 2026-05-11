import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      employeeId?: string;
      departmentId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    permissions: string[];
    employeeId?: string | null;
    departmentId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    employeeId?: string;
    departmentId?: string;
  }
}
