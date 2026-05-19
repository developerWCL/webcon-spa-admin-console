import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { StaffLoginSchema } from "@/schemas/auth.schema";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    accessToken: string;
    expiresIn: string;
    roles?: Array<{
      id: string;
      name: string;
    }>;
    branchIds?: string[];
    spaIds?: string[];
    permissions?: Array<{
      id: string;
      name: string;
    }>;
    metadata?: Record<string, any>;
  }

  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
    };
    accessToken?: string;
    expiresIn?: string;
    roles?: Array<{
      id: string;
      name: string;
    }>;
    branchIds?: string[];
    spaIds?: string[];
    permissions?: Array<{
      id: string;
      name: string;
    }>;
    metadata?: Record<string, any>;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "staff@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const validatedFields = StaffLoginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!validatedFields.success) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/staff-auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(validatedFields.data),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          return {
            id: data.staff.id,
            email: data.staff.email,
            name: `${data.staff.firstName} ${data.staff.lastName}`,
            firstName: data.staff.firstName,
            lastName: data.staff.lastName,
            isActive: data.staff.isActive,
            accessToken: data.accessToken,
            expiresIn: data.expiresIn,
            roles: (data.staff.roles || []).map((r: any) => ({
              id: r.id,
              name: r.name,
            })),
            branchIds: data.staff.branches?.map((b: any) => b.id) || [],
            spaIds:
              data.staff.branches?.map((b: any) => b.spa?.id).filter(Boolean) ||
              [],
            permissions:
              data.staff.roles?.flatMap((r: any) => r.permissions || []) || [],
            metadata: data.staff.branches?.[0]?.spa?.metadata || {}, // Include spa metadata if available
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isActive = user.isActive;
        token.accessToken = user.accessToken;
        token.expiresIn = user.expiresIn;
        token.roles = user.roles || [];
        token.branchIds = user.branchIds || [];
        token.spaIds = user.spaIds || [];
        token.permissions = user.permissions || [];
        token.metadata = user.metadata || {};
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.isActive = token.isActive as boolean;
        (session as any).accessToken = token.accessToken as string;
        (session as any).expiresIn = token.expiresIn as string;
        (session as any).roles = token.roles as any[];
        (session as any).branchIds = token.branchIds as string[];
        (session as any).spaIds = token.spaIds as string[];
        (session as any).permissions = token.permissions as any[];
        (session as any).metadata = token.metadata as Record<string, any>;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
});
