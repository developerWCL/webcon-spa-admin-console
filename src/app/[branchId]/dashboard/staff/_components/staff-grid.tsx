"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Loader2, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Staff as StaffMember } from "@/types";
import { Pagination, type PaginationMeta } from "@/components/pagination";
import { StaffCard } from "./staff-card";

interface StaffGridProps {
  staff: StaffMember[];
  searchQuery: string;
  statusFilter: string;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewDetails: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onAddStaff: () => void;
  paginationMeta?: PaginationMeta | null;
}

export function StaffGrid({
  staff,
  searchQuery,
  statusFilter,
  isLoading,
  error,
  currentPage,
  itemsPerPage,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onLimitChange,
  onViewDetails,
  onEdit,
  onDelete,
  onAddStaff,
  paginationMeta: apiPaginationMeta,
}: StaffGridProps) {
  // Server-side filtering is applied via API, so display staff as-is
  const displayStaff = staff;

  // Use pagination metadata from API if available, otherwise calculate locally
  let paginationMeta: PaginationMeta;

  if (apiPaginationMeta) {
    // Use API-provided metadata
    paginationMeta = apiPaginationMeta;
  } else {
    // Fallback to calculating locally for client-side pagination
    const totalPages = Math.ceil(displayStaff.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    paginationMeta = {
      totalItems: displayStaff.length,
      itemCount: Math.min(itemsPerPage, displayStaff.length - startIndex),
      itemsPerPage,
      totalPages: Math.max(1, totalPages),
      currentPage,
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {"Staff Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {"Manage therapists, schedules, and team performance"}
          </p>
        </div>
        <Button onClick={onAddStaff}>
          <Plus className="w-4 h-4 mr-2" />
          {"Add Staff Member"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{"All Status"}</SelectItem>
                  <SelectItem value="active">{"Active"}</SelectItem>
                  {/* <SelectItem value="on-leave">{"On Leave"}</SelectItem> */}
                  <SelectItem value="inactive">{"Inactive"}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // reset all filters and pagination
                  onSearchChange("");
                  onStatusFilterChange("all");
                  onPageChange(1);
                  onLimitChange(10);
                }}
              >
                <FilterX className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && displayStaff.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center py-8">
              No staff members found
            </p>
          </CardContent>
        </Card>
      )}

      {/* Staff Cards Grid */}
      {!isLoading && displayStaff.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayStaff.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
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
        </>
      )}
    </div>
  );
}
