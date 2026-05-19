"use client";

import React, { Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { getBranches } from "@/actions/branch.actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import {
  Calendar,
  CalendarClock,
  Check,
  DoorOpen,
  FileText,
  Gift,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  Sparkles,
  User,
  UserCog,
  Users,
  X,
  ArrowLeft,
  ListChecks,
  ChartLine,
  Scroll,
  HandHeart,
} from "lucide-react";
import Image from "next/image";
import {
  canAccessFeature,
  getFeatureAccessLevel,
  FEATURES,
  type FeatureKey,
} from "@/constants/permissions";

const iconMap: Record<FeatureKey, any> = {
  dashboard: LayoutDashboard,
  bookings: Calendar,
  customers: Users,
  staff: UserCog,
  services: HandHeart,
  programmes: ListChecks,
  inventory: DoorOpen,
  "daily-management": CalendarClock,
  promotions: Gift,
  packages: Package,
  reports: ChartLine,
  "action-logs": Scroll,
  settings: Settings,
};

export default function BranchDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const branchId = params.branchId as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(
    null,
  );
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigationWithBranch, setNavigationWithBranch] = useState<any[]>([]);

  // Update navigation when session or branchId changes
  useEffect(() => {
    const userRoles = session?.roles || [];
    const allFeatureKeys = Object.keys(FEATURES) as FeatureKey[];

    const filteredNav = allFeatureKeys
      .filter((key) => canAccessFeature(userRoles, key, "view"))
      .map((key) => {
        const feature = FEATURES[key];
        const accessLevel = getFeatureAccessLevel(userRoles, key);
        return {
          key,
          name: feature.name,
          href: `/${branchId}/${feature.href}`,
          icon: iconMap[key],
          disabled: false,
          accessLevel,
        };
      });

    setNavigationWithBranch(filteredNav);
  }, [session, branchId]);

  useEffect(() => {
    // Set selected branch from URL params
    setSelectedBranch(branchId);

    // Load branch name from session storage
    const branchName = sessionStorage.getItem("selectedBranchName");
    if (branchName) {
      setSelectedBranchName(branchName);
    }

    // Fetch available branches
    fetchBranches();
  }, [branchId]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const result = await getBranches();
      if (result.success && result.data) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (newBranchId: string) => {
    const branch = branches.find((b) => b.id === newBranchId);
    if (branch) {
      sessionStorage.setItem("selectedBranchId", newBranchId);
      sessionStorage.setItem("selectedBranchName", branch.name);
      setSelectedBranch(newBranchId);
      setSelectedBranchName(branch.name);

      // Navigate to new branch dashboard
      router.push(`/${newBranchId}/dashboard`);
    }
  };

  const handleSwitchBranch = () => {
    router.push("/select-branch");
  };

  const handleLogout = async () => {
    try {
      await logoutAction("");
    } catch (error) {
      // Redirect errors are expected and should propagate
      if (isRedirectError(error)) {
        throw error;
      }
      console.error("Logout error:", error);
      alert("An error occurred during logout");
    }
  };

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-background">
        <Toaster />
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6">
              <Link
                href={`/${branchId}/dashboard`}
                className="flex items-center gap-3"
              >
                <Image
                  src={session?.metadata?.logo_url || "/logo.png"}
                  alt="Logo"
                  width={208}
                  height={67}
                  className="object-contain"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigationWithBranch.length > 0 ? (
                navigationWithBranch.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-primary"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => setSidebarOpen(false)}
                      title={
                        item.accessLevel === "view"
                          ? "View only access"
                          : undefined
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.name}</span>
                      {item.accessLevel === "view" && (
                        <span className="ml-auto text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          View
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-2.5 text-sm text-muted-foreground">
                  {session ? "No features available" : "Loading..."}
                </div>
              )}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Avatar className="w-9 h-9">
                  <AvatarImage src="/avatars/admin.jpg" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {session?.user?.firstName?.[0]}
                    {session?.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.firstName} {session?.user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 border-b border-border">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                {/* Branch Selector */}
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedBranch || ""}
                    onValueChange={handleBranchChange}
                    disabled={loading || branches.length === 0}
                  >
                    <SelectTrigger className="bg-background w-full">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <SelectValue placeholder="Select branch w-full" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <span className="font-medium">
                            {branch.name}{" "}
                            {branch.location && (
                              <span className="text-xs text-muted-foreground">
                                ({branch.location})
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/avatars/admin.jpg" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {session?.user?.firstName?.[0]}
                          {session?.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium">
                        {session?.user?.firstName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{"My Account"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={`/${branchId}/dashboard/settings`}>
                      <DropdownMenuItem>
                        <User className="mr-2 w-4 h-4" />
                        <span>{"Profile"}</span>
                      </DropdownMenuItem>
                    </Link>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      <span>{"Log out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </Suspense>
  );
}
