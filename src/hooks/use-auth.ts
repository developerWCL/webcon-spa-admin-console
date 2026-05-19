import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/lib/token-manager";

/**
 * Hook to protect routes that require authentication
 * Redirects to /login if user is not authenticated
 */
export function useProtectedRoute() {
  const router = useRouter();

  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);
}

/**
 * Hook to get the current authenticated staff
 */
export function useAuthenticatedStaff() {
  return tokenManager.getStaffData();
}
