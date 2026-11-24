"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClosuresTable } from "./_components/closures-table";
import { CreateClosureDialog } from "./_components/create-closure-dialog";
import { EmptyState } from "./_components/empty-state";
import { ClosuresSkeleton } from "./_components/closures-skeleton";
import { toast } from "sonner";
import { getServices } from "@/actions/service.actions";
import { getPackages } from "@/actions/package.actions";
import { getProgrammesAction } from "@/actions/programme.action";
import {
  createServiceClosure,
  deleteServiceClosure,
  getServiceClosure,
  updateServiceClosure,
  type ServiceClosure,
} from "@/actions/service-closure.actions";

interface CatalogueItem {
  id: string;
  name: string;
}

export default function ClosuresPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = React.use(params);
  const [closures, setClosures] = useState<ServiceClosure[]>([]);
  const [services, setServices] = useState<CatalogueItem[]>([]);
  const [packages, setPackages] = useState<CatalogueItem[]>([]);
  const [programmes, setProgrammes] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchClosures = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getServiceClosure();
      if (!result.success) throw new Error(result.error || "Failed to fetch closures");
      const data = result.data;
      setClosures(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Failed to fetch closures:", error);
      toast.error("Failed to load closures");
      setClosures([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const fetchCatalogue = useCallback(async () => {
    try {
      const [servicesData, packagesData, programmesData] = await Promise.all([
        getServices(branchId, 1, 100),
        getPackages(branchId, 1, 100),
        getProgrammesAction(branchId, { limit: 100, page: 1 }),
      ]);

      setServices(
        (servicesData?.data || servicesData || []).map((item: any) => ({
          id: item.id,
          name: item.name,
        }))
      );
      setPackages(
        (packagesData?.data || packagesData || []).map((item: any) => ({
          id: item.id,
          name: item.name,
        }))
      );
      setProgrammes(
        (programmesData?.data?.data || programmesData || []).map(
          (item: any) => ({
            id: item.id,
            name: item.name,
          })
        )
      );
    } catch (error) {
      console.error("Failed to fetch catalogue:", error);
    }
  }, [branchId]);

  useEffect(() => {
    fetchClosures();
    fetchCatalogue();
  }, [fetchClosures, fetchCatalogue]);

  const handleCreateClosure = async (data: any) => {
    try {
      const serviceIds = data.closeAllServices
        ? services.map((item) => item.id)
        : data.serviceIds || [];
      const packageIds = data.closeAllServices
        ? packages.map((item) => item.id)
        : data.packageIds || [];
      const programmeIds = data.closeAllServices
        ? programmes.map((item) => item.id)
        : data.programmeIds || [];

      const startDate = data.startDate || data.closeDate;
      const endDate = data.endDate || data.closeDate;
      const startTime = data.startTime || data.closeTime;
      const endTime = data.endTime;

      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      if (
        Number.isNaN(startDateTime.getTime()) ||
        Number.isNaN(endDateTime.getTime())
      ) {
        throw new Error("Invalid start or end date/time");
      }

      if (endDateTime <= startDateTime) {
        throw new Error("End date/time must be after start date/time");
      }

      const startClosure = startDateTime.toISOString();
      const endClosure = endDateTime.toISOString();

      const results = await createServiceClosure({
        services: serviceIds,
        packages: packageIds,
        programmes: programmeIds,
        startClosure,
        endClosure,
        reason: data.reason,
        isCloseAll: data.closeAllServices,
      });

      if (!results.success) {
        throw new Error(results.error || "Failed to create service closure");
      }

      setCreateDialogOpen(false);
      await fetchClosures();
      toast.success(
        `Service closure created successfully`
      );
    } catch (error) {
      console.error("Failed to create service closure:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create service closure"
      );
      throw error;
    }
  };

  const handleDeleteClosure = async (closureId: string) => {
    try {
      const result = await deleteServiceClosure(closureId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete closure");
      }

      await fetchClosures();
      toast.success("Closure deleted successfully");
    } catch (error) {
      console.error("Failed to delete closure:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete closure"
      );
    }
  };

  const handleEditClosure = async (closureId: string, data: any) => {
    try {
      const startDate = data.startDate || data.closeDate;
      const endDate = data.endDate || data.closeDate;
      const startTime = data.startTime || data.closeTime;
      const endTime = data.endTime;

      if (!startDate || !endDate || !startTime || !endTime) {
        throw new Error("Invalid start or end date/time");
      }

      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      if (
        Number.isNaN(startDateTime.getTime()) ||
        Number.isNaN(endDateTime.getTime())
      ) {
        throw new Error("Invalid start or end date/time");
      }

      if (endDateTime <= startDateTime) {
        throw new Error("End date/time must be after start date/time");
      }

      const serviceIds = data.closeAllServices
        ? services.map((item) => item.id)
        : data.serviceIds || [];
      const packageIds = data.closeAllServices
        ? packages.map((item) => item.id)
        : data.packageIds || [];
      const programmeIds = data.closeAllServices
        ? programmes.map((item) => item.id)
        : data.programmeIds || [];

      const result = await updateServiceClosure(closureId, {
        services: serviceIds,
        packages: packageIds,
        programmes: programmeIds,
        startClosure: startDateTime.toISOString(),
        endClosure: endDateTime.toISOString(),
        reason: data.reason,
        isCloseAll: data.closeAllServices,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update closure");
      }

      await fetchClosures();
      toast.success("Closure updated successfully");
    } catch (error) {
      console.error("Failed to update closure:", error);
      toast.error("Failed to update closure");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Closure Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage temporary closures for one or multiple services
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Closure
        </Button>
      </div>

      <CreateClosureDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        services={services}
        packages={packages}
        programmes={programmes}
        onCreateClosure={handleCreateClosure}
      />

      {loading ? (
        <ClosuresSkeleton />
      ) : closures.length === 0 ? (
        <EmptyState
          title="No closures scheduled"
          description="Create a closure to temporarily close one or more services"
        />
      ) : (
        <ClosuresTable
          closures={closures}
          services={services}
          packages={packages}
          programmes={programmes}
          onDelete={handleDeleteClosure}
          onEdit={handleEditClosure}
        />
      )}
    </div>
  );
}
