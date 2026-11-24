// Role-based access control configuration
export type RoleType = "admin" | "reception" | "therapist";

export type FeatureKey =
  | "dashboard"
  | "bookings"
  | "customers"
  | "staff"
  | "services"
  | "programmes"
  | "inventory"
  | "daily-management"
  | "promotions"
  | "packages"
  | "reports"
  | "action-logs"
  | "settings" | "service-closure";

export type AccessLevel = "full" | "view" | "hidden";

// Sub-feature permissions for granular control
export type SubFeatureKey = "promotions:promotions" | "promotions:packages";

// Feature configuration: mapping feature keys to their display settings
export const FEATURES = {
  dashboard: {
    name: "Dashboard",
    href: "dashboard",
  },
  bookings: {
    name: "Bookings",
    href: "dashboard/bookings",
  },
  customers: {
    name: "Guest & Members",
    href: "dashboard/guest&members",
  },
  staff: {
    name: "Staff",
    href: "dashboard/staff",
  },
  services: {
    name: "Services",
    href: "dashboard/services",
  },
  packages: {
    name: "Packages",
    href: "dashboard/packages",
  },
  programmes: {
    name: "Programmes",
    href: "dashboard/programmes",
  },

  inventory: {
    name: "Inventory",
    href: "dashboard/inventory",
  },
  "daily-management": {
    name: "Daily Management",
    href: "dashboard/daily-management",
  },


  promotions: {
    name: "Promotions",
    href: "dashboard/promotions",
  },

  reports: {
    name: "Reports",
    href: "dashboard/reports",
  },
  "action-logs": {
    name: "Action Logs",
    href: "dashboard/action-logs",
  },
  settings: {
    name: "Settings",
    href: "dashboard/settings",
  },
  "service-closure": {
    name: "Closure Management",
    href: "dashboard/closures",
  },
} as const;

// Sub-feature configuration
export const SUB_FEATURES = {
  "promotions:promotions": {
    name: "Promotions",
    parentFeature: "promotions",
  },
  "promotions:packages": {
    name: "Packages",
    parentFeature: "promotions",
  },
} as const;

// Role-based permissions
export const ROLE_PERMISSIONS: Record<
  RoleType,
  Record<FeatureKey, AccessLevel>
> = {
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
    packages: "full",
    reports: "full",
    "action-logs": "full",
    settings: "full",
    "service-closure": "full",
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
    packages: "hidden",
    reports: "hidden",
    "action-logs": "hidden",
    settings: "hidden",
    "service-closure": "hidden",
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
    packages: "hidden",
    reports: "hidden",
    "action-logs": "hidden",
    settings: "hidden",
    "service-closure": "hidden",
  },
};

// Sub-feature permissions for granular control within features
export const SUB_FEATURE_PERMISSIONS: Record<
  RoleType,
  Record<SubFeatureKey, AccessLevel>
> = {
  admin: {
    "promotions:promotions": "full",
    "promotions:packages": "full",
  },
  reception: {
    "promotions:promotions": "full",
    "promotions:packages": "hidden", // Receptionists can only see promotions
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
  roles: Array<{ id: string; name: string }>,
  featureKey: FeatureKey,
  accessLevel: "full" | "view" = "full",
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

    // If requesting specific access level, check if it matches or is higher
    if (accessLevel === "full" && featureAccess === "full") {
      return true;
    }
    if (
      accessLevel === "view" &&
      (featureAccess === "full" || featureAccess === "view")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get user's access level for a specific feature
 */
export function getFeatureAccessLevel(
  roles: Array<{ id: string; name: string }>,
  featureKey: FeatureKey,
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

  // Get the highest access level among all roles
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

/**
 * Get list of accessible features for a user
 */
export function getAccessibleFeatures(
  roles: Array<{ id: string; name: string }>,
): FeatureKey[] {
  const accessibleFeatures: FeatureKey[] = [];

  for (const feature of Object.keys(FEATURES) as FeatureKey[]) {
    if (canAccessFeature(roles, feature)) {
      accessibleFeatures.push(feature);
    }
  }

  return accessibleFeatures;
}

/**
 * Check if a user has access to a sub-feature
 */
export function canAccessSubFeature(
  roles: Array<{ id: string; name: string }>,
  subFeatureKey: SubFeatureKey,
  accessLevel: "full" | "view" = "full",
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
    const subFeaturePermissions = SUB_FEATURE_PERMISSIONS[roleType];

    if (!subFeaturePermissions) {
      continue;
    }

    const subFeatureAccess = subFeaturePermissions[subFeatureKey];

    // If requesting specific access level, check if it matches or is higher
    if (accessLevel === "full" && subFeatureAccess === "full") {
      return true;
    }
    if (
      accessLevel === "view" &&
      (subFeatureAccess === "full" || subFeatureAccess === "view")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get user's access level for a specific sub-feature
 */
export function getSubFeatureAccessLevel(
  roles: Array<{ id: string; name: string }>,
  subFeatureKey: SubFeatureKey,
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

  // Get the highest access level among all roles
  let maxAccessLevel: AccessLevel = "hidden";

  for (const role of roles) {
    const roleType = role.name.toLowerCase() as RoleType;
    const subFeaturePermissions = SUB_FEATURE_PERMISSIONS[roleType];

    if (!subFeaturePermissions) {
      continue;
    }

    const subFeatureAccess = subFeaturePermissions[subFeatureKey];

    if (subFeatureAccess === "full") {
      return "full";
    }
    if (subFeatureAccess === "view" && maxAccessLevel === "hidden") {
      maxAccessLevel = "view";
    }
  }

  return maxAccessLevel;
}
