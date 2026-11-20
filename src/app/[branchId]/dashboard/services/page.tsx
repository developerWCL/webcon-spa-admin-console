"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ManageCategoriesDialog } from "./_components/manage-categories-dialog";
import { AddServiceDialog } from "./_components/add-service-dialog";
import { ServicesFilters } from "./_components/services-filters";
import { ServicesGrid } from "./_components/services-grid";
import { ServicesSkeleton } from "./_components/services-skeleton";
import { EmptyState } from "./_components/empty-state";
import { ReorderServicesModal } from "./_components/reorder-services-modal";
import { getServiceCategories, getServices } from "@/actions/service.actions";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export default function ServicesPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = React.use(params);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState<any>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadingCategories(true);
    setLoadingServices(true);
    try {
      const [categoriesData, servicesData] = await Promise.all([
        getServiceCategories(branchId),
        getServices(
          branchId,
          currentPage,
          itemsPerPage,
          searchTerm,
          selectedCategory !== "all" ? selectedCategory : undefined,
        ),
      ]);
      if (categoriesData && categoriesData.length > 0) {
        setServiceCategories(categoriesData);
      }
      // Handle both paginated and non-paginated responses
      if (servicesData) {
        if (Array.isArray(servicesData)) {
          setServices(servicesData);
          setPaginationMeta(null);
        } else if (servicesData.data && Array.isArray(servicesData.data)) {
          setServices(servicesData.data);
          setPaginationMeta(servicesData.meta || null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setServices([]);
      setPaginationMeta(null);
    } finally {
      setLoadingCategories(false);
      setLoadingServices(false);
    }
  }, [branchId, currentPage, itemsPerPage, searchTerm, selectedCategory]);

  // Fetch all services for reorder modal (without pagination)
  const fetchAllServices = useCallback(async () => {
    try {
      const servicesData = await getServices(branchId);
      if (servicesData) {
        if (Array.isArray(servicesData)) {
          setAllServices(servicesData);
        } else if (servicesData.data && Array.isArray(servicesData.data)) {
          setAllServices(servicesData.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch all services:", error);
    }
  }, [branchId]);

  // Fetch categories and services from API
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredServices = services;

  const handleAddService = async (data: any) => {
    // Refetch services to get updated list
    try {
      setLoadingServices(true);
      const servicesData = await getServices(branchId);
      if (servicesData) {
        if (Array.isArray(servicesData)) {
          setServices(servicesData);
        } else if (servicesData.data && Array.isArray(servicesData.data)) {
          setServices(servicesData.data);
        }
      }
    } catch (error) {
      console.error("Failed to refresh services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleAddCategory = (data: any) => {
    // TODO: Call your API with data
    // await createCategory(data)
  };

  const handleOpenReorderModal = async () => {
    await fetchAllServices();
    setReorderModalOpen(true);
  };

  const handleReorderComplete = () => {
    // Refetch services to get updated order
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-2">
            Manage spa services, treatments, and pricing options
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleOpenReorderModal}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Reorder Services
          </Button>
          <ManageCategoriesDialog
            categories={serviceCategories}
            onAddCategory={handleAddCategory}
          />
          <AddServiceDialog
            categories={serviceCategories}
            branchId={branchId}
            onAddService={handleAddService}
          />
        </div>
      </div>

      <ReorderServicesModal
        open={reorderModalOpen}
        onOpenChange={setReorderModalOpen}
        services={allServices}
        onOrderUpdated={handleReorderComplete}
      />

      <ServicesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        setCurrentPage={setCurrentPage}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={serviceCategories}
        onItemsPerPageChange={setItemsPerPage}
      />
      {/* Show skeleton while loading */}
      {loadingServices && loadingCategories ? (
        <ServicesSkeleton />
      ) : (
        <>
          {/* Empty state when no services */}
          {filteredServices.length === 0 ? (
            <EmptyState
              title="No services found"
              description={
                searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your filters or search term to find services"
                  : "Get started by creating your first service"
              }
            />
          ) : (
            <ServicesGrid
              services={filteredServices}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onLimitChange={setItemsPerPage}
              branchId={branchId}
              categories={serviceCategories}
              onServiceUpdated={handleAddService}
              paginationMeta={paginationMeta}
            />
          )}
        </>
      )}
    </div>
  );
}
