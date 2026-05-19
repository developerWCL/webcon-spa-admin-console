// Token management utilities for staff authentication
// Tokens are stored in HTTP-only cookies (set by backend)
// This file manages staff data in localStorage only

const STAFF_DATA_KEY = "staff_data";

export const tokenManager = {
  // HTTP-only cookies are handled by the backend
  // Frontend doesn't directly manage tokens

  setToken(token: string, expiresIn?: string): void {
    // Tokens are set by backend via Set-Cookie header
    // This method is kept for compatibility but doesn't store the token
    // Just store expiry time for reference
    if (typeof window !== "undefined" && expiresIn) {
      const expiryTime = new Date().getTime() + parseInt(expiresIn) * 1000;
      sessionStorage.setItem("token_expiry", expiryTime.toString());
    }
  },

  getToken(): string | null {
    // Token is in HTTP-only cookie, not accessible from JavaScript
    // Return true if user appears to be authenticated
    if (typeof window !== "undefined") {
      const expiry = sessionStorage.getItem("token_expiry");
      if (expiry) {
        const now = new Date().getTime();
        if (now <= parseInt(expiry)) {
          return "authenticated"; // Token exists in cookie
        } else {
          // Token expired
          this.clear();
          return null;
        }
      }
    }
    return null;
  },

  setStaffData(staff: any): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STAFF_DATA_KEY, JSON.stringify(staff));
    }
  },

  getStaffData(): any | null {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(STAFF_DATA_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  },

  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STAFF_DATA_KEY);
      sessionStorage.removeItem("token_expiry");
      // HTTP-only cookie is cleared by backend on logout
    }
  },

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },
};
