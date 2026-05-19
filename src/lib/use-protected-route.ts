"use client";

import { useAuth } from "./auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export const useProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !pathname.startsWith("/(auth)")) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  return { isLoading, isAuthenticated };
};
