/**
 * Auth-related Page Types
 *
 * Types for authentication pages and login flows.
 */

import type { PageProps, PageParams, PageSearchParams } from "./app-router";

/**
 * Login page search params (for redirect URLs, etc.)
 */
export interface LoginPageSearchParams extends PageSearchParams {
  callbackUrl?: string;
  error?: string;
  code?: string;
}

/**
 * Login page props
 */
export interface LoginPageProps extends PageProps<
  PageParams,
  LoginPageSearchParams
> {}

/**
 * Forgot password page search params
 */
export interface ForgotPasswordPageSearchParams extends PageSearchParams {
  email?: string;
}

/**
 * Reset password page search params
 */
export interface ResetPasswordPageSearchParams extends PageSearchParams {
  token?: string;
}

/**
 * Auth layout page params
 */
export interface AuthLayoutParams extends PageParams {}
