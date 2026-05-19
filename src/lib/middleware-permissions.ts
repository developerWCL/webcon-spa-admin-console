/**
 * Permission checking utilities for middleware
 * These are used server-side to validate access before rendering pages
 */

export type RoleType = "admin" | "reception" | "therapist";
export type AccessLevel = "full" | "view" | "hidden";

// Map URL feature paths to feature keys
export const FEATURE_ROUTES: Record<string, string> = {
  dashboard: "dashboard",
  bookings: "bookings",
  customers: "customers",
  staff: "staff",
  services: "services",
  programmes: "programmes",
  inventory: "inventory",
  "daily-management": "daily-management",
  promotions: "promotions",
  reports: "reports",
  settings: "settings",
};

// Role-based permissions (mirror of client-side config)
export const ROLE_PERMISSIONS: Record<RoleType, Record<string, AccessLevel>> = {
  admin: {
    dashboard: "full",
    bookings: "full",
    customers: "full",
    staff: "full",
    services: "full",
    programmes: "full",
    inventory: "full",
    "daily-management": "full",
    promotions: "full",
    reports: "full",
    settings: "full",
  },
  reception: {
    dashboard: "full",
    bookings: "full",
    customers: "full",
    staff: "hidden",
    services: "hidden",
    programmes: "hidden",
    inventory: "full",
    "daily-management": "hidden",
    promotions: "full",
    reports: "hidden",
    settings: "hidden",
  },
  therapist: {
    dashboard: "full",
    bookings: "view",
    customers: "full",
    staff: "hidden",
    services: "hidden",
    programmes: "hidden",
    inventory: "hidden",
    "daily-management": "hidden",
    promotions: "hidden",
    reports: "hidden",
    settings: "hidden",
  },
};

// Sub-feature permissions
export const SUB_FEATURE_PERMISSIONS: Record<
  RoleType,
  Record<string, AccessLevel>
> = {
  admin: {
    "promotions:promotions": "full",
    "promotions:packages": "full",
  },
  reception: {
    "promotions:promotions": "full",
    "promotions:packages": "hidden",
  },
  therapist: {
    "promotions:promotions": "hidden",
    "promotions:packages": "hidden",
  },
};

/**
 * Check if a user has access to a feature based on their roles
 */
export function canAccessFeature(
  roles: Array<{ id: string; name: string }> | undefined,
  featureKey: string,
): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  // Admin role always has access
  const hasAdminRole = roles.some(
    (role) => role.name.toLowerCase() === "admin",
  );
  if (hasAdminRole) {
    return true;
  }

  // Check each role for access level
  for (const role of roles) {
    const roleType = role.name.toLowerCase() as RoleType;
    const rolePermissions = ROLE_PERMISSIONS[roleType];

    if (!rolePermissions) {
      continue;
    }

    const featureAccess = rolePermissions[featureKey];

    if (featureAccess && featureAccess !== "hidden") {
      return true;
    }
  }

  return false;
}

/**
 * Get the most restrictive access level across all roles
 * Returns "hidden" if any role denies access
 */
export function getFeatureAccessLevel(
  roles: Array<{ id: string; name: string }> | undefined,
  featureKey: string,
): AccessLevel {
  if (!roles || roles.length === 0) {
    return "hidden";
  }

  // Admin role always has full access
  const hasAdminRole = roles.some(
    (role) => role.name.toLowerCase() === "admin",
  );
  if (hasAdminRole) {
    return "full";
  }

  let maxAccessLevel: AccessLevel = "hidden";

  for (const role of roles) {
    const roleType = role.name.toLowerCase() as RoleType;
    const rolePermissions = ROLE_PERMISSIONS[roleType];

    if (!rolePermissions) {
      continue;
    }

    const featureAccess = rolePermissions[featureKey];

    if (featureAccess === "full") {
      return "full";
    }
    if (featureAccess === "view" && maxAccessLevel === "hidden") {
      maxAccessLevel = "view";
    }
  }

  return maxAccessLevel;
}
