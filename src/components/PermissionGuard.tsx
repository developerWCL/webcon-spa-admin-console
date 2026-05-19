"use client";

import React from "react";
import { usePermission } from "@/hooks/usePermission";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { FeatureKey } from "@/constants/permissions";

interface PermissionGuardProps {
  featureKey: FeatureKey;
  children: React.ReactNode;
  accessLevel?: "full" | "view";
  fallback?: React.ReactNode;
}

/**
 * Component to guard features based on user permissions
 * Usage:
 * <PermissionGuard featureKey="reports" accessLevel="full">
 *   <ReportsPage />
 * </PermissionGuard>
 */
export function PermissionGuard({
  featureKey,
  children,
  accessLevel = "full",
  fallback,
}: PermissionGuardProps) {
  const { status } = useSession();
  const { canAccess } = usePermission();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (!canAccess(featureKey, accessLevel)) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Access Denied
            </h1>
            <p className="text-lg text-muted-foreground">
              You don't have permission to access this feature.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
