"use client";

import React from "react";
import { usePermission } from "@/hooks/usePermission";
import { FeatureKey, SubFeatureKey } from "@/constants/permissions";

interface EditableActionProps {
  featureKey: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render edit/add buttons based on access level
 * Hides the content if user has view-only access
 *
 * Usage:
 * <EditableAction featureKey="bookings">
 *   <Button onClick={handleAdd}>Add Booking</Button>
 *   <Button onClick={handleEdit}>Edit</Button>
 * </EditableAction>
 */
export function EditableAction({
  featureKey,
  children,
  fallback,
}: EditableActionProps) {
  const { hasFullAccess } = usePermission();

  if (!hasFullAccess(featureKey)) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface SubFeatureGuardProps {
  subFeatureKey: SubFeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render content based on sub-feature access
 * Usage:
 * <SubFeatureGuard subFeatureKey="promotions:packages">
 *   <PackagesSection />
 * </SubFeatureGuard>
 */
export function SubFeatureGuard({
  subFeatureKey,
  children,
  fallback,
}: SubFeatureGuardProps) {
  const { canAccessSubFeature } = usePermission();

  if (!canAccessSubFeature(subFeatureKey)) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface ViewOnlyAlertProps {
  featureKey?: FeatureKey;
  subFeatureKey?: SubFeatureKey;
}

/**
 * Component to show a notice when user has view-only access
 *
 * Usage:
 * <ViewOnlyAlert featureKey="bookings" />
 * <ViewOnlyAlert subFeatureKey="promotions:promotions" />
 */
export function ViewOnlyAlert({
  featureKey,
  subFeatureKey,
}: ViewOnlyAlertProps) {
  const { isViewOnly, getSubFeatureAccessLevel } = usePermission();

  const isViewOnlyMode = featureKey
    ? isViewOnly(featureKey)
    : subFeatureKey
      ? getSubFeatureAccessLevel(subFeatureKey) === "view"
      : false;

  if (!isViewOnlyMode) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-3">
      <div className="text-blue-600 font-semibold">👁️</div>
      <div>
        <p className="text-sm font-medium text-blue-900">View-Only Access</p>
        <p className="text-xs text-blue-700">
          You have read-only access to this feature. Add and edit actions are
          disabled.
        </p>
      </div>
    </div>
  );
}
