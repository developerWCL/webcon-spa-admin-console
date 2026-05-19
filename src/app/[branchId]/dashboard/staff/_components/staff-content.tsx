"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { CreateStaffRequest, Staff as StaffMember } from "@/types";
import type { Role } from "@/types";
import { getStaffMembers } from "@/actions/staff.actions";
import { StaffForm } from "./staff-form";
import { StaffGrid } from "./staff-grid";
import { StaffDetailsDialog } from "./staff-details-dialog";
import { DeleteStaffDialog } from "./delete-staff-dialog";

interface StaffContentProps {
  branchId: string;
  initialStaffData: StaffMember[];
  roles: Role[];
  isLoading?: boolean;
  error?: string | null;
  onAddStaff: (formData: CreateStaffRequest) => Promise<void>;
  onEditStaff: (id: string, formData: Partial<StaffMember>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  paginationMeta?: any;
}

export function StaffContent({
  branchId,
  initialStaffData,
  roles,
  isLoading: initialIsLoading = false,
  error: initialError = null,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  paginationMeta: initialPaginationMeta,
}: StaffContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [staffData, setStaffData] = useState(initialStaffData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refetch staff data
  const refetchStaff = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      try {
        // Convert statusFilter to isActive boolean
        let isActiveFilter: boolean | undefined;
        if (statusFilter !== "all") {
          isActiveFilter = statusFilter === "active";
        }

        const result = await getStaffMembers(
          branchId,
          page,
          itemsPerPage,
          searchQuery,
          isActiveFilter,
        );

        if (result.success && result.data) {
          setStaffData(result.data);
          setPaginationMeta(result.meta || null);
          setError(null);
        } else {
          setError(result.error || "Failed to load staff");
          setStaffData([]);
          setPaginationMeta(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load staff";
        setError(errorMessage);
        setStaffData([]);
        setPaginationMeta(null);
      } finally {
        setIsLoading(false);
      }
    },
    [branchId, itemsPerPage, searchQuery, statusFilter],
  );

  // Fetch staff data with filters
  useEffect(() => {
    refetchStaff(currentPage);
  }, [
    branchId,
    currentPage,
    itemsPerPage,
    searchQuery,
    statusFilter,
    refetchStaff,
  ]);

  const handleViewDetails = useCallback((member: StaffMember) => {
    setSelectedStaff(member);
    setShowDetailsDialog(true);
  }, []);

  const handleEditClick = useCallback((member: StaffMember) => {
    setSelectedStaff(member);
    setIsFormDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((member: StaffMember) => {
    setStaffToDelete(member);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      setIsDeleting(true);
      await onDeleteStaff(staffToDelete.id);
      // toast.success("Staff member deleted successfully");
      setDeleteConfirmOpen(false);
      setStaffToDelete(null);
      // Refetch staff list
      await refetchStaff(1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete staff member",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to page 1 when changing limit
  };

  const handleAddStaffSubmit = async (
    formData: CreateStaffRequest | Partial<StaffMember>,
  ) => {
    try {
      if (selectedStaff) {
        // Edit mode
        await onEditStaff(selectedStaff.id, formData as Partial<StaffMember>);
      } else {
        // Create mode
        await onAddStaff(formData as CreateStaffRequest);
      }
      setIsFormDialogOpen(false);
      setSelectedStaff(null);
      // Refetch staff list by resetting to page 1
      await refetchStaff(1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save staff member",
      );
    }
  };

  const handleFormDialogOpenChange = (open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setSelectedStaff(null);
    }
  };

  return (
    <>
      <StaffGrid
        staff={staffData}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        isLoading={isLoading}
        error={error}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onPageChange={setCurrentPage}
        onLimitChange={handleLimitChange}
        onViewDetails={handleViewDetails}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onAddStaff={() => {
          setSelectedStaff(null);
          setIsFormDialogOpen(true);
        }}
        paginationMeta={paginationMeta}
      />
      {/* Dialogs */}
      <StaffForm
        isOpen={isFormDialogOpen}
        onOpenChange={handleFormDialogOpenChange}
        onSubmit={handleAddStaffSubmit}
        roles={roles}
        branchId={branchId}
        initialData={selectedStaff}
      />
      <StaffDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        staff={selectedStaff}
      />
      <DeleteStaffDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        staff={staffToDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
    // <div className="space-y-6">
    //   <Tabs defaultValue="staff" className="space-y-4">
    //     <TabsList>
    //       <TabsTrigger value="staff">{"Staff Directory"}</TabsTrigger>
    //       <TabsTrigger value="schedule">{"Schedule"}</TabsTrigger>
    //     </TabsList>

    //     <TabsContent value="staff" className="space-y-4">
    //       <StaffGrid
    //         staff={staffData}
    //         searchQuery={searchQuery}
    //         statusFilter={statusFilter}
    //         isLoading={isLoading}
    //         error={error}
    //         onSearchChange={setSearchQuery}
    //         onStatusFilterChange={setStatusFilter}
    //         onViewDetails={handleViewDetails}
    //         onDelete={handleDeleteClick}
    //         onAddStaff={() => setIsCreateDialogOpen(true)}
    //       />
    //     </TabsContent>

    //     <TabsContent value="schedule">
    //       <ScheduleTab />
    //     </TabsContent>
    //   </Tabs>

    // </div>
  );
}
