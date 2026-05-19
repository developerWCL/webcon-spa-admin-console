/**
 * Branch API Types
 *
 * Request and response types for branch-related API operations.
 */

export interface CreateBranchRequest {
  name: string;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  spaId: string;
}

export interface UpdateBranchRequest {
  name?: string;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}
