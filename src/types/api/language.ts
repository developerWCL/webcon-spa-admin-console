/**
 * Language API Types
 *
 * Types for language-related API responses
 */

/**
 * Individual language object
 */
export interface Language {
  id: string;
  code: string;
  name: string;
  description?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
