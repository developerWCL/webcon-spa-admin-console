"use client";

import { ServiceCard } from "./service-card";
import { Pagination, type PaginationMeta } from "@/components/pagination";

interface ServiceTranslation {
  id: string;
  languageCode: string;
  name: string;
  description?: string;
}

interface SubService {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | number;
  status: string;
  translations?: ServiceTranslation[];
}

interface CategoryTranslation {
  id: string;
  languageCode: string;
  name: string;
  description?: string | null;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  translations?: CategoryTranslation[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  category?: Category;
  subServices?: SubService[];
  status: "active" | "inactive" | "seasonal";
  imageUrl?: string | null;
  translations?: ServiceTranslation[];
  maxConcurrentBookings?: number;
  maxBookingsPerDay?: number;
  media?: any[];
}

interface ServicesGridProps {
  services: Service[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  branchId?: string;
  categories?: Category[];
  onServiceUpdated?: (data: any) => void | Promise<void>;
  paginationMeta?: PaginationMeta | null;
}

export const ServicesGrid = ({
  services,
  currentPage,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  branchId,
  categories,
  onServiceUpdated,
  paginationMeta: apiPaginationMeta,
}: ServicesGridProps) => {
  // Use pagination metadata from API if available, otherwise calculate locally
  let paginationMeta: PaginationMeta;

  if (apiPaginationMeta) {
    // Use API-provided metadata
    paginationMeta = apiPaginationMeta;
  } else {
    // Fallback to calculating locally for client-side pagination
    const totalPages = Math.ceil(services.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    paginationMeta = {
      totalItems: services.length,
      itemCount: Math.min(itemsPerPage, services.length - startIndex),
      itemsPerPage,
      totalPages: Math.max(1, totalPages),
      currentPage,
    };
  }

  // Only paginate locally if we don't have API pagination
  const displayServices = apiPaginationMeta
    ? services
    : services.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      );

  return (
    <div className="space-y-8">
      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayServices.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            name={service.name}
            description={service.description}
            category={service.category}
            subServices={service.subServices}
            status={service.status}
            branchId={branchId}
            imageUrl={service.imageUrl}
            translations={service.translations}
            maxConcurrentBookings={service.maxConcurrentBookings}
            maxBookingsPerDay={service.maxBookingsPerDay}
            categories={categories}
            onServiceUpdated={onServiceUpdated}
            media={service.media}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        meta={paginationMeta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        showLimitSelector={true}
        className="mt-8"
      />
    </div>
  );
};
