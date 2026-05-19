"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Package,
  Gift,
  Percent,
  Calendar,
  Users,
  TrendingUp,
  Search,
  MoreVertical,
  Upload,
  ImageIcon,
  X,
  Clock,
  FilterX,
} from "lucide-react";
import { getServices } from "@/actions/service.actions";
import { getPackages } from "@/actions/package.actions";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/pagination";
import type { Service } from "@/types/models/service";
import AddPromotionDialog from "./_components/add-promotion-dialog";

import { deletePromotion, getPromotions } from "@/actions/promotion.actions";
import { Promotion } from "@/types/models";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { toast } from "sonner";

export default function PromotionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "promotions";
  const [activeTab, setActiveTab] = useState(initialTab);
  const params = useParams();
  const branchId = params.branchId as string;

  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
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

  const [searchTerm, setSearchTerm] = useState("");
  const [promotionStatusFilter, setPromotionStatusFilter] = useState("all");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null,
  );
  const [totalPromotions, setTotalPromotions] = useState(0);
  const [promotionPage, setPromotionPage] = useState(1);
  const [promotionsPerPage, setPromotionsPerPage] = useState(10);
  const [promotionTotalPages, setPromotionTotalPages] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Helper function to flatten services with subservices
  // Fetch promotions from API
  const fetchPromotions = async () => {
    try {
      setLoadingPromotions(true);
      const result = await getPromotions(
        branchId,
        promotionPage,
        promotionsPerPage,
        searchTerm || undefined,
        promotionStatusFilter === "all" ? undefined : promotionStatusFilter,
      );

      if (result && typeof result === "object") {
        if (Array.isArray(result.data)) {
          setPromotions(result.data);
          setTotalPromotions(result.meta?.totalItems);
          setPromotionTotalPages(result.meta?.totalPages || 1);
        } else if (Array.isArray(result)) {
          setPromotions(result);
          setTotalPromotions(result.length);
          setPromotionTotalPages(Math.ceil(result.length / promotionsPerPage));
        }
      } else {
        setPromotions([]);
        setTotalPromotions(0);
        setPromotionTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
      setPromotions([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    branchId,
    promotionPage,
    searchTerm,
    promotionStatusFilter,
    promotionsPerPage,
  ]);
  const flattenServicesWithSubServices = (servicesList: Service[]) => {
    const flattened: Array<
      Service & { parentServiceId?: string; parentServiceName?: string }
    > = [];
    servicesList.forEach((service) => {
      if (service.subServices && service.subServices.length > 0) {
        // If service has subservices, create an item for each subservice
        service.subServices.forEach((subService) => {
          flattened.push({
            ...service,
            ...subService,
            parentServiceId: service.id,
            parentServiceName: service.name,
          } as any);
        });
      } else {
        // If no subservices, add the service as-is
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
  // Fetch services from API
  useEffect(() => {
    fetchServices();
  }, [branchId]);

  // Sync tab changes to URL
  useEffect(() => {
    if (activeTab !== (searchParams.get("tab") || "promotions")) {
      router.push(`?tab=${activeTab}`);
    }
  }, [activeTab, router, searchParams]);

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

  const onConfirmDeletePromotion = async () => {
    setShowDeleteDialog(false);
    setSelectedPromotion(null);
    try {
      await deletePromotion(selectedPromotion!.id);
      toast.success("Promotion deleted successfully");
      fetchPromotions();
    } catch {
      toast.error("Failed to delete promotion. Please try again.");
    }
  };

  const onClosePromotionDialog = () => {
    setShowPromotionDialog(false);
    setSelectedPromotion(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid w-full items-center gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Promotions & Packages</h1>
            <p className="text-muted-foreground mt-1">
              Manage discount codes, promotions and service packages
            </p>
          </div>
          <div className="flex gap-2">
            {/* <Button variant="outline">
            <Gift className="mr-2 h-4 w-4" />
            Import
          </Button> */}
            <Button
              onClick={() => {
                setEditingPackageId(null);
                if (activeTab === "promotions") {
                  setShowPromotionDialog(true);
                } else {
                  setShowPackageDialog(true);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create {activeTab === "promotions" ? "Promotion" : "Package"}
            </Button>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPromotionPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={promotionStatusFilter}
            onValueChange={(value) => {
              setPromotionStatusFilter(value);
              setPromotionPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // reset all filter and pagination
              setSearchTerm("");
              setPromotionStatusFilter("all");
              setPromotionPage(1);
              setPromotionsPerPage(10);
            }}
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </div>

        {loadingPromotions ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : promotions.length > 0 ? (
          <>
            <div className="grid gap-4">
              {promotions.map((promo) => (
                <Card key={promo.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{promo.name}</CardTitle>
                          <Badge
                            variant={
                              promo.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {promo.status?.charAt(0).toUpperCase() +
                              promo.status?.slice(1)}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {promo.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu
                        open={openDropdownId === promo.id}
                        onOpenChange={(open) =>
                          setOpenDropdownId(open ? promo.id : null)
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setShowPromotionDialog(true);
                              setSelectedPromotion(promo);
                              setOpenDropdownId(null);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => {
                              setShowDeleteDialog(true);
                              setSelectedPromotion(promo);
                              setOpenDropdownId(null);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Percent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Discount
                          </p>
                          <p className="font-semibold">
                            {promo.discountType === "percentage"
                              ? `${promo.discountValue}%`
                              : promo.discountType === "fixed"
                                ? `${promo.discountValue} THB`
                                : promo.discountValue}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Code</p>
                          <p className="font-semibold font-mono">
                            {promo.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Valid At
                          </p>
                          <p className="font-semibold">
                            {new Date(promo.startDate).toLocaleDateString()} -{" "}
                            {new Date(promo.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Usage</p>
                          <p className="font-semibold">
                            {promo.maxUsed && promo.maxUsed > 0
                              ? `${promo.used || 0} / ${promo.maxUsed}`
                              : `${promo.used || 0}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    {promo.activeDays && promo.activeDays.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Active Schedule
                          </span>
                        </div>
                        <div className="space-y-2">
                          {promo.activeDays.map(
                            (d: string | any, index: number) => {
                              // Handle string, JSON string, and object formats
                              let dayData = d;

                              // If it's a string, try to parse it as JSON
                              if (typeof d === "string" && d.startsWith("{")) {
                                try {
                                  dayData = JSON.parse(d);
                                } catch {
                                  // If parsing fails, treat as simple day string
                                  dayData = { day: d, allDay: true };
                                }
                              } else if (typeof d === "string") {
                                // Simple string day like "mon", "tue"
                                dayData = { day: d, allDay: true };
                              }

                              const dayKey = dayData?.day || dayData;
                              const normalizedDayKey = String(dayKey)
                                .toLowerCase()
                                .trim();

                              const dayIndex = [
                                "sun",
                                "mon",
                                "tue",
                                "wed",
                                "thu",
                                "fri",
                                "sat",
                              ].indexOf(normalizedDayKey);

                              const dayLabels = [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                              ];

                              const dayLabel =
                                dayIndex >= 0
                                  ? dayLabels[dayIndex]
                                  : normalizedDayKey.charAt(0).toUpperCase() +
                                    normalizedDayKey.slice(1);

                              const isAllDay = !dayData?.allDay
                                ? false
                                : dayData?.allDay !== false;
                              const timeDisplay =
                                !isAllDay &&
                                dayData?.startTime &&
                                dayData?.endTime
                                  ? `${dayData.startTime} - ${dayData.endTime}`
                                  : "All Day";

                              return (
                                <div
                                  key={`${normalizedDayKey}-${index}`}
                                  className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                >
                                  <span className="text-sm font-medium">
                                    {dayLabel}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {timeDisplay}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination
              meta={{
                totalItems: totalPromotions,
                itemCount: promotions.length,
                itemsPerPage: promotionsPerPage,
                totalPages: promotionTotalPages,
                currentPage: promotionPage,
              }}
              onPageChange={setPromotionPage}
              showLimitSelector={true}
              onLimitChange={setPromotionsPerPage}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No promotions found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm || promotionStatusFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first promotion"}
            </p>
          </div>
        )}

        {/* Create Promotion Dialog */}
        <AddPromotionDialog
          open={showPromotionDialog}
          onClose={onClosePromotionDialog}
          setOpen={setShowPromotionDialog}
          selectedPromotionId={selectedPromotion?.id || null}
          refreshPromotions={fetchPromotions}
        />

        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Promotion"
          description={`Are you sure you want to delete the promotion "${selectedPromotion?.name}"? This action cannot be undone.`}
          onConfirm={() => {
            onConfirmDeletePromotion();
          }}
        />
      </div>
    </div>
  );
}
