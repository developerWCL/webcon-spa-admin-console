import { useSession } from "next-auth/react";
import {
  canAccessFeature,
  getFeatureAccessLevel,
  canAccessSubFeature,
  getSubFeatureAccessLevel,
  type FeatureKey,
  type SubFeatureKey,
  type AccessLevel,
} from "@/constants/permissions";

/**
 * Hook to check user permissions for features
 * Usage: const { canAccess, accessLevel } = usePermission();
 */
export function usePermission() {
  const { data: session } = useSession();
  const userRoles = session?.roles as
    | Array<{ id: string; name: string }>
    | undefined;

  return {
    /**
     * Check if user can access a feature at a specific level
     */
    canAccess: (featureKey: FeatureKey, level: "full" | "view" = "full") => {
      return canAccessFeature(userRoles || [], featureKey, level);
    },

    /**
     * Get the access level for a feature
     */
    getAccessLevel: (featureKey: FeatureKey): AccessLevel => {
      return getFeatureAccessLevel(userRoles || [], featureKey);
    },

    /**
     * Check if user has admin role
     */
    isAdmin: () => {
      return (
        userRoles?.some((role) => role.name.toLowerCase() === "admin") ?? false
      );
    },

    /**
     * Check if user is a receptionist
     */
    isReceptionist: () => {
      return (
        userRoles?.some((role) => role.name.toLowerCase() === "reception") ??
        false
      );
    },

    /**
     * Check if user is a therapist
     */
    isTherapist: () => {
      return (
        userRoles?.some((role) => role.name.toLowerCase() === "therapist") ??
        false
      );
    },

    /**
     * Check if access to a feature is view-only
     */
    isViewOnly: (featureKey: FeatureKey): boolean => {
      return getFeatureAccessLevel(userRoles || [], featureKey) === "view";
    },

    /**
     * Check if user has full access to a feature (not view-only)
     */
    hasFullAccess: (featureKey: FeatureKey): boolean => {
      return getFeatureAccessLevel(userRoles || [], featureKey) === "full";
    },

    /**
     * Check if user has any access to a feature
     */
    hasAccess: (featureKey: FeatureKey): boolean => {
      const accessLevel = getFeatureAccessLevel(userRoles || [], featureKey);
      return accessLevel !== "hidden";
    },

    /**
     * Check if user can access a sub-feature
     */
    canAccessSubFeature: (
      subFeatureKey: SubFeatureKey,
      level: "full" | "view" = "full",
    ) => {
      return canAccessSubFeature(userRoles || [], subFeatureKey, level);
    },

    /**
     * Get the access level for a sub-feature
     */
    getSubFeatureAccessLevel: (subFeatureKey: SubFeatureKey): AccessLevel => {
      return getSubFeatureAccessLevel(userRoles || [], subFeatureKey);
    },

    /**
     * Get all user roles
     */
    getUserRoles: () => userRoles || [],
  };
}
