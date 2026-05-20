"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreVertical, Edit, Clock, Trash2, Package, Copy } from "lucide-react";
import { AddServiceDialog } from "./add-service-dialog";
import { deleteService } from "@/actions/service.actions";
import { toast } from "sonner";
import { ServiceCategory, SubService } from "@/types";
import { ServiceTranslation } from "@/schemas/service.schema";
import { useLanguages } from "@/hooks/useLanguages";
import { formatNumberWithComma } from "@/utils/utils";
import { useSession } from "next-auth/react";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  category?: ServiceCategory;
  subServices?: SubService[];
  status: "active" | "inactive" | "seasonal";
  maxConcurrentBookings?: number;
  maxBookingsPerDay?: number;
  imageUrl?: string | null;
  translations?: ServiceTranslation[];
  branchId?: string;
  categories?: ServiceCategory[];
  onServiceUpdated?: (data: any) => void;
  media?: any[];
}

export const ServiceCard = ({
  id,
  name,
  description,
  category,
  subServices = [],
  status,
  imageUrl,
  translations = [],
  branchId,
  categories = [],
  onServiceUpdated,
  maxConcurrentBookings,
  maxBookingsPerDay,
  media = [],
}: ServiceCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  const { data: session } = useSession();

  // Get primary language
  const primaryLang = languages.find((lang) => lang.isPrimary);

  // Get translated name and description
  const translatedName =
    translations?.find((t) => t.languageCode === primaryLang?.code)?.name ||
    name;
  const translatedDescription =
    translations?.find((t) => t.languageCode === primaryLang?.code)
      ?.description || description;

  // Get category name in primary language
  const categoryName =
    category?.translations?.find((t) => t.languageCode === primaryLang?.code)
      ?.name || category?.name;

  // Get minimum price from subServices and not only package services
  const nonPackageServices = subServices.filter((s) => !s.onlyPackage);
  const minPrice =
    nonPackageServices.length > 0
      ? Math.min(
          ...nonPackageServices.map((s) =>
            typeof s.price === "string" ? parseFloat(s.price) : s.price,
          ),
        )
      : 0;

  const handleDeleteService = async () => {
    setIsDeleting(true);
    try {
      await deleteService(id);
      toast.success("Service deleted successfully");
      setShowDeleteConfirm(false);

      // Call the callback to refresh the service list
      if (onServiceUpdated) {
        onServiceUpdated({ deleted: true, id });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete service",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const bookingEngineUrl =
        process.env.NEXT_PUBLIC_BOOKING_ENGINE_URL ||
        "https://spa.webconnection.app";
      // bookingEngineUrl/spaId?branchId=branchId&serviceId=id&serviceType=service
      const spaId = session?.spaIds?.[0] || "default-spa";

      const bookingLink = `${bookingEngineUrl}/${spaId}?branchId=${branchId}&serviceId=${id}&serviceType=services`;
      await navigator.clipboard.writeText(bookingLink);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="line-clamp-1">{translatedName}</CardTitle>
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            {categoryName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Starting Price
              </span>
              <span className="text-lg font-bold text-primary">
                ฿{minPrice.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {subServices.length} variant{subServices.length > 1 ? "s" : ""}{" "}
              available
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Available Variants:
            </div>
            {subServices.length > 0 ? (
              <>
                {subServices.slice(0, 3).map((service) => {
                  const serviceName =
                    service.translations?.find(
                      (t) => t.languageCode === primaryLang?.code,
                    )?.name || service.name;
                  return (
                    <div
                      key={service.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="text-muted-foreground flex items-center gap-1">
                        {serviceName}{" "}
                        {service.onlyPackage && (
                          <Package className="w-4 h-4 text-primary" />
                        )}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes}m
                        </span>
                        <span>
                          ฿
                          {typeof service.price === "string"
                            ? formatNumberWithComma(parseFloat(service.price))
                            : formatNumberWithComma(service.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {subServices.length > 3 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{subServices.length - 3} more variant
                    {subServices.length - 3 > 1 ? "s" : ""}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                No variants available
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {translatedDescription}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setShowEditDialog(true);
              }}
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              title="Copy booking link"
              disabled={status !== "active" || name === "PACKAGE ONLY"}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {branchId && (
        <AddServiceDialog
          categories={categories}
          branchId={branchId}
          onAddService={onServiceUpdated}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          editServiceId={id}
          editServiceData={{
            id,
            name,
            description,
            categoryId: category?.id || "",
            status,
            imageUrl,
            translations,
            subServices,
            maxConcurrentBookings,
            maxBookingsPerDay,
            media,
          }}
        />
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{translatedName}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteService}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
