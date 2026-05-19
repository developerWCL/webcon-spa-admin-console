"use client";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const logout = async () => {
    await nextAuthSignOut({ redirect: true, redirectUrl: "/login" });
  };

  return {
    session,
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout,
  };
}
