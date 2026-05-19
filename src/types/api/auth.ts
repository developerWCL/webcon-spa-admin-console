/**
 * Authentication API Request and Response Types
 *
 * Types for all authentication-related API endpoints.
 */

import type { User, Role, Permission } from "../models";

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response with auth tokens and user data
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: string;
  staff: User;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Forgot password response
 */
export interface ForgotPasswordResponse {
  message: string;
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Reset password response
 */
export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: string;
}

/**
 * Logout request
 */
export interface LogoutRequest {
  refreshToken?: string;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  message: string;
  success: boolean;
}

/**
 * Get current user response
 */
export interface CurrentUserResponse {
  user: User;
  roles: Role[];
  permissions: Permission[];
}
