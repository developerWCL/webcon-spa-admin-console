"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MapPin, Users, DoorOpen, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { getBranches, selectBranch } from "@/actions/branch.actions";
import { toast } from "sonner";
import { Branch } from "@/types";

export default function SelectBranchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Fetch branches accessible to the user
    if (status === "authenticated" && session?.user?.id) {
      fetchUserBranches();
    }
  }, [status, session]);

  const fetchUserBranches = async () => {
    try {
      setLoading(true);
      const result = await getBranches();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch branches");
      }
      const branchList = result.data || [];
      setBranches(branchList);

      // If user has only one branch, auto-select it
      if (branchList && branchList.length === 1) {
        handleSelectBranch(branchList[0].id);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = async (branchId: string) => {
    try {
      setSelecting(branchId);

      // Store selected branch in session storage
      sessionStorage.setItem("selectedBranchId", branchId);
      const selectedBranch = branches.find((b) => b.id === branchId);

      const branchName = selectedBranch?.name || "Branch";

      if (selectedBranch) {
        sessionStorage.setItem("selectedBranchName", selectedBranch.name);
      }

      toast.success(`Selected branch: ${branchName}`);

      // Redirect to dashboard with branch ID in URL
      router.push(`/${branchId}/dashboard`);
    } catch (error) {
      console.error("Error selecting branch:", error);
      toast.error("Failed to select branch. Please try again.");
      setSelecting(null);
    }
  };

  const handleLogout = async () => {
    await logoutAction("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-secondary/20 to-accent/10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Bar */}
      <div className="bg-white sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary p-2 rounded-lg">
              <Image
                src="/webconnection/spa-logo.png"
                alt="Web Connection Spa"
                width={100}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Select Your Branch
              </h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {session.user?.firstName} {session.user?.lastName}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleLogout}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0 transition-all duration-200 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="max-w-6xl mx-auto">
          {/* Intro Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Choose Your Spa Location
            </h2>
            <p className="text-muted-foreground text-sm">
              Select the branch you would like to manage today
            </p>
          </div>

          {branches.length === 0 ? (
            <Card className="border-2 border-dashed bg-secondary/40 border-primary/20">
              <CardContent className="pt-16 pb-16">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-primary/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Branches Available
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    You don't have access to any branches yet. Please contact
                    your administrator.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <Card
                  key={branch.id}
                  className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group bg-card border-border/50 overflow-hidden"
                  onClick={() => !selecting && handleSelectBranch(branch.id)}
                >
                  {/* Card Badge */}
                  <div className="h-1 bg-gradient-to-r from-primary to-primary/50 group-hover:from-primary group-hover:to-primary transition-all"></div>

                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-colors flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {branch.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1.5 text-muted-foreground">
                          {branch.location}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3 mb-5 pb-4 border-b border-border/30">
                      {branch.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground min-w-fit">
                            Phone:
                          </span>
                          <span className="text-muted-foreground truncate">
                            {branch.phone}
                          </span>
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground min-w-fit">
                            Email:
                          </span>
                          <span className="text-muted-foreground truncate">
                            {branch.email}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    {/* <div className="grid grid-cols-2 gap-3 mb-5">
                      {branch.staff && (
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">
                            {branch.staff}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Staff Members
                          </p>
                        </div>
                      )}
                      {branch.rooms && (
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">
                            {branch.rooms}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rooms
                          </p>
                        </div>
                      )}
                    </div> */}

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={selecting !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBranch(branch.id);
                      }}
                      size="sm"
                    >
                      {selecting === branch.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        "Select Branch"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
