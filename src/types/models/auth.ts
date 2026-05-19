/**
 * Authentication and Authorization Models
 *
 * Core entities related to user authentication and authorization.
 * These types represent data structures that come from the backend
 * and are extended in auth.ts for NextAuth configuration.
 */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  accessToken?: string;
  expiresIn?: string;
  roles?: Role[];
  branchIds?: string[];
  spaIds?: string[];
  permissions?: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Session {
  user: Omit<User, "accessToken" | "expiresIn"> & {
    email: string;
  };
  accessToken?: string;
  expiresIn?: string;
}
