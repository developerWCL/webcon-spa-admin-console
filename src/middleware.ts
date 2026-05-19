import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  canAccessFeature,
  FEATURE_ROUTES,
  type RoleType,
} from "@/lib/middleware-permissions";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const selectedBranchId = request.cookies.get("selectedBranchId")?.value;
  const pathname = request.nextUrl.pathname;

  // Match dynamic branch dashboard routes: /[branchId]/dashboard/[feature]
  const branchRouteMatch = pathname.match(
    /^\/([^\/]+)\/dashboard\/([^\/]+)(\/.*)?$/i,
  );

  if (branchRouteMatch) {
    // Dynamic branch routes require authentication
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Extract the feature from the URL
    const feature = branchRouteMatch[2].toLowerCase();
    const featureKey = FEATURE_ROUTES[feature];

    // Check permission if feature is recognized
    if (featureKey) {
      const userRoles = (session as any)?.roles as
        | Array<{ id: string; name: string }>
        | undefined;

      if (!canAccessFeature(userRoles, featureKey)) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }

    // Branch route is accessed, user is authenticated and authorized
    return NextResponse.next();
  }

  // Match main dashboard route: /[branchId]/dashboard
  const mainDashboardMatch = pathname.match(/^\/([^\/]+)\/dashboard\/?$/i);
  if (mainDashboardMatch) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check access to main dashboard (everyone with full/view access to "dashboard" can see it)
    const userRoles = (session as any)?.roles as
      | Array<{ id: string; name: string }>
      | undefined;

    if (!canAccessFeature(userRoles, "dashboard")) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    return NextResponse.next();
  }

  // Old /dashboard routes - redirect to branch-specific routes if branch is selected
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Redirect to select-branch if no branch selected
    if (!selectedBranchId) {
      return NextResponse.redirect(new URL("/select-branch", request.url));
    }
    // Redirect old dashboard URL to new branch-specific URL
    const subpath = pathname.replace("/dashboard", "");
    return NextResponse.redirect(
      new URL(`/${selectedBranchId}/dashboard${subpath}`, request.url),
    );
  }

  if (pathname === "/select-branch") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // If branch is already selected, redirect to branch dashboard
    if (selectedBranchId) {
      return NextResponse.redirect(
        new URL(`/${selectedBranchId}/dashboard`, request.url),
      );
    }
  }

  if (pathname === "/login") {
    if (session) {
      if (selectedBranchId) {
        return NextResponse.redirect(
          new URL(`/${selectedBranchId}/dashboard`, request.url),
        );
      } else {
        return NextResponse.redirect(new URL("/select-branch", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_static|public).*)"],
};
