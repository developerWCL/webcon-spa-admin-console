# Role-Based Access Control (RBAC) Implementation

## Overview
Frontend permission system with role-based dynamic access control has been implemented for the Orientala SPA dashboard.

## Roles & Permissions

### Admin
- ✅ All features accessible with full access
- Features: Dashboard, Bookings, Customers, Staff, Services, Programmes, Inventory, Daily Management, Promotions & Packages, Reports, Settings

### Reception
- ✅ Dashboard (full access)
- ✅ Bookings (full access)
- ✅ Customers (full access)
- ✅ Inventory Management (full access)
- ✅ Promotions & Packages (full access - Promotions only)
- ❌ Staff, Services, Programmes, Daily Management, Reports, Settings (hidden)

### Therapist
- ✅ Dashboard (full access)
- ✅ Bookings (view only)
- ✅ Customers (full access)
- ❌ Staff, Services, Programmes, Inventory, Daily Management, Promotions & Packages, Reports, Settings (hidden)

## Files Created/Modified

### New Files
1. **`src/constants/permissions.ts`**
   - Defines role-based permissions configuration
   - Exports: `canAccessFeature()`, `getFeatureAccessLevel()`, `getAccessibleFeatures()`
   - Contains `ROLE_PERMISSIONS` mapping

2. **`src/hooks/usePermission.ts`**
   - Custom React hook for permission checking
   - Methods: `canAccess()`, `getAccessLevel()`, `isAdmin()`, `isReceptionist()`, `isTherapist()`

3. **`src/components/PermissionGuard.tsx`**
   - Component wrapper to protect features
   - Shows access denied page for unauthorized users
   - Supports fallback UI

### Modified Files
1. **`src/app/[branchId]/dashboard/layout.tsx`**
   - Integrated role-based filtering for navigation
   - Dynamic menu generation based on user roles
   - Visual indicator for "view-only" access items

## Usage Examples

### 1. Check Permission in Hook
```typescript
"use client";
import { usePermission } from "@/hooks/usePermission";

export function MyComponent() {
  const { canAccess, getAccessLevel, isAdmin } = usePermission();

  if (canAccess("reports")) {
    return <ReportsSection />;
  }

  if (isAdmin()) {
    return <AdminPanel />;
  }

  return <DefaultView />;
}
```

### 2. Protect a Page with Guard Component
```typescript
import { PermissionGuard } from "@/components/PermissionGuard";
import ReportsPage from "./page";

export default function ProtectedReportsPage() {
  return (
    <PermissionGuard featureKey="reports" accessLevel="full">
      <ReportsPage />
    </PermissionGuard>
  );
}
```

### 3. Check Access Level
```typescript
const { getAccessLevel } = usePermission();

const bookingAccessLevel = getAccessLevel("bookings");
// Returns: "full", "view", or "hidden"

if (bookingAccessLevel === "view") {
  // Show read-only view
} else if (bookingAccessLevel === "full") {
  // Show editable view
}
```

### 4. Role-based Checks
```typescript
const { isAdmin, isReceptionist, isTherapist } = usePermission();

if (isAdmin()) {
  // Show admin-only features
}
```

## How It Works

1. **Session Integration**: User roles come from `session.roles` (from NextAuth login)
2. **Permission Lookup**: `canAccessFeature()` checks `ROLE_PERMISSIONS` config
3. **Access Levels**: Three levels - `"full"`, `"view"`, `"hidden"`
4. **Automatic Filtering**: Dashboard layout automatically filters navigation items
5. **Visual Indicators**: "View" only access shows a badge in the menu

## Extending the System

To add new features or modify permissions:

1. **Add new feature** in `src/constants/permissions.ts`:
```typescript
export const FEATURES = {
  // ... existing features
  "new-feature": {
    name: "New Feature",
    href: "dashboard/new-feature",
  },
};
```

2. **Add icon** in layout:
```typescript
const iconMap: Record<FeatureKey, any> = {
  // ... existing icons
  "new-feature": NewFeatureIcon,
};
```

3. **Update role permissions** in `ROLE_PERMISSIONS`:
```typescript
export const ROLE_PERMISSIONS: Record<RoleType, Record<FeatureKey, AccessLevel>> = {
  Admin: {
    "new-feature": "full",
  },
  Reception: {
    "new-feature": "hidden",
  },
  Therapist: {
    "new-feature": "view",
  },
};
```

4. **Protect the page** using `PermissionGuard` component

## Notes
- Roles are defined by the backend and come through the auth session
- Role names must match exactly: "Admin", "Reception", "Therapist"
- The system is case-sensitive
- Hidden features don't appear in the navigation menu
- "View-only" access is indicated with a badge in the menu
