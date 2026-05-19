"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  Clock,
  FilterX,
  Copy,
} from "lucide-react";
import { getServices } from "@/actions/service.actions";
import { getPackages } from "@/actions/package.actions";
import { useParams } from "next/navigation";
import { Pagination } from "@/components/pagination";
import type { Service } from "@/types/models/service";
import { AddPackageDialog } from "./_components/add-package-dialog";
import { DeletePackageDialog } from "./_components/delete-package-dialog";
import { formatNumberWithComma } from "@/utils/utils";
import { SubFeatureGuard } from "@/components/EditableAction";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function PackagesPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const { data: session } = useSession();

  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null);
  const [deletePackageName, setDeletePackageName] = useState<string>("");
  const [packageSearchTerm, setPackageSearchTerm] = useState("");
  const [packageStatusFilter, setPackageStatusFilter] = useState("all");
  const [currentPackagePage, setCurrentPackagePage] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [totalPackages, setTotalPackages] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [packagesPerPage, setPackagesPerPage] = useState(10);

  // Helper function to flatten services with subservices
  const flattenServicesWithSubServices = (servicesList: Service[]) => {
    const flattened: Array<
      Service & { parentServiceId?: string; parentServiceName?: string }
    > = [];
    servicesList.forEach((service) => {
      if (service.subServices && service.subServices.length > 0) {
        service.subServices.forEach((subService) => {
          flattened.push({
            ...service,
            ...subService,
            parentServiceId: service.id,
            parentServiceName: service.name,
          } as any);
        });
      } else {
        flattened.push(service);
      }
    });
    return flattened;
  };

  const fetchServices = async () => {
    try {
      const result = await getServices(branchId);
      if (Array.isArray(result)) {
        const flattenedServices = flattenServicesWithSubServices(result);
        setServices(flattenedServices as Service[]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [branchId]);

  // Fetch packages from API
  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const result = await getPackages(
        branchId,
        currentPackagePage,
        packagesPerPage,
        packageSearchTerm || undefined,
        packageStatusFilter === "all" ? undefined : packageStatusFilter,
      );

      // Handle response structure
      if (result && typeof result === "object") {
        // If response has data array
        if (Array.isArray(result.data)) {
          setPackages(result.data);
          setTotalPackages(result.meta?.totalItems);
          setTotalPages(result.meta?.totalPages || 1);
        }
        // If response is directly the data array
        else if (Array.isArray(result)) {
          setPackages(result);
          setTotalPackages(result.length);
          setTotalPages(Math.ceil(result.length / packagesPerPage));
        }
      } else {
        setPackages([]);
        setTotalPackages(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [
    branchId,
    currentPackagePage,
    packageSearchTerm,
    packageStatusFilter,
    packagesPerPage,
  ]);

  const handleCopyLink = async (packageId: string) => {
    try {
      const bookingEngineUrl =
        process.env.NEXT_PUBLIC_BOOKING_ENGINE_URL ||
        "https://orientalaspa.webconnection.app";
      const spaId = session?.spaIds?.[0] || "default-spa";

      const bookingLink = `${bookingEngineUrl}/${spaId}?branchId=${branchId}&serviceId=${packageId}&serviceType=packages`;
      await navigator.clipboard.writeText(bookingLink);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid w-full items-center gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Packages</h1>
            <p className="text-muted-foreground mt-1">
              Manage service packages and bundled offerings
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPackageId(null);
              setShowPackageDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </div>

        <SubFeatureGuard subFeatureKey="promotions:packages">
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  value={packageSearchTerm}
                  onChange={(e) => {
                    setPackageSearchTerm(e.target.value);
                    setCurrentPackagePage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={packageStatusFilter}
                onValueChange={(value) => {
                  setPackageStatusFilter(value);
                  setCurrentPackagePage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // reset all filter and pagination
                  setPackageSearchTerm("");
                  setPackageStatusFilter("all");
                  setCurrentPackagePage(1);
                  setPackagesPerPage(10);
                }}
              >
                <FilterX className="w-4 h-4" />
              </Button>
            </div>

            {loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : packages.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="line-clamp-1 leading-6">
                            {pkg.name}
                          </CardTitle>
                          <Badge
                            variant={
                              pkg.status === "active" ? "default" : "secondary"
                            }
                          >
                            {pkg.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Package Price
                            </span>
                            <span className="text-lg font-bold text-primary">
                              ฿{formatNumberWithComma(Number(pkg.price))}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pkg.subServices?.length || 0} service
                            {pkg.subServices?.length !== 1 ? "s" : ""} included
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Included Services:
                          </div>
                          {pkg.subServices
                            ?.slice(0, 3)
                            .map((subService: any) => (
                              <div
                                key={subService.id}
                                className="flex items-center justify-between text-sm py-1"
                              >
                                <span className="text-muted-foreground">
                                  {subService.name} (
                                  {subService.service?.name ||
                                    "Unknown Service"}
                                  )
                                </span>

                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {subService.durationMinutes}m
                                  </span>
                                </div>
                              </div>
                            ))}
                          {pkg.subServices?.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{pkg.subServices.length - 3} more service
                              {pkg.subServices.length - 3 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Valid Period
                            </span>
                            <span className="font-medium text-xs">
                              {new Date(pkg.startDate).toLocaleDateString()} -{" "}
                              {new Date(pkg.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => {
                              setEditingPackageId(pkg.id);
                              setShowPackageDialog(true);
                            }}
                          >
                            <Edit className="mr-2 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(pkg.id)}
                            title="Copy booking link"
                            disabled={
                              pkg.status !== "active" ||
                              new Date(pkg.startDate) > new Date() ||
                              new Date(pkg.endDate) < new Date()
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletePackageId(pkg.id);
                              setDeletePackageName(pkg.name);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Package Pagination */}
                <Pagination
                  meta={{
                    totalItems: totalPackages,
                    itemCount: packages.length,
                    itemsPerPage: packagesPerPage,
                    totalPages: totalPages,
                    currentPage: currentPackagePage,
                  }}
                  onPageChange={setCurrentPackagePage}
                  showLimitSelector={true}
                  onLimitChange={setPackagesPerPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No packages found</h3>
                <p className="text-muted-foreground mt-1">
                  {packageSearchTerm || packageStatusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first package"}
                </p>
              </div>
            )}
          </div>
        </SubFeatureGuard>

        {/* Package Dialog */}
        <AddPackageDialog
          open={showPackageDialog}
          onOpenChange={setShowPackageDialog}
          editingPackageId={editingPackageId}
          editingPackage={
            editingPackageId
              ? packages.find((p) => p.id === editingPackageId)
              : undefined
          }
          branchId={branchId}
          subServices={services
            .filter((s) => s?.subServices?.length || 0 > 0)
            .map((service: any) => ({
              id: service.id,
              name: service.name,
              category: service.category?.name || "",
              parentServiceName: service.parentServiceName,
              duration: service.durationMinutes || 0,
              price: service.price
                ? typeof service.price === "number"
                  ? service.price
                  : parseInt(String(service.price), 10)
                : 0,
              status: service.status,
              onlyPackage: service.onlyPackage || false,
            }))}
          onSuccess={(data, isEdit) => {
            setShowPackageDialog(false);
            setEditingPackageId(null);
            // Refetch packages to get updated list
            fetchPackages();
            fetchServices(); // Refetch services to update any changes in sub-services
          }}
        />

        {/* Delete Package Dialog */}
        <DeletePackageDialog
          open={!!deletePackageId}
          onOpenChange={(open) => {
            if (!open) {
              setDeletePackageId(null);
              setDeletePackageName("");
            }
          }}
          packageId={deletePackageId || ""}
          packageName={deletePackageName}
          onConfirmDelete={fetchPackages}
        />
      </div>
    </div>
  );
}
