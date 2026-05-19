"use client";

import { StaffContent } from "./staff-content";
import {
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from "@/actions/staff.actions";
import { Role, Staff, CreateStaffRequest } from "@/types";
import { toast } from "sonner";

interface StaffPageClientProps {
  branchId: string;
  staffData: Staff[];
  roles: Role[];
  error: string | null;
  paginationMeta: any;
}

export function StaffPageClient({
  branchId,
  staffData,
  roles,
  error,
  paginationMeta,
}: StaffPageClientProps) {
  const handleAddStaff = async (formData: CreateStaffRequest) => {
    formData.branchIds = [branchId];
    const result = await createStaffMember(formData);
    if (result.success) {
      toast.success("Staff member added successfully");
    } else {
      toast.error(`Failed to add staff member, ${result.error}`);
      console.error("Failed to create staff:", result.error);
    }
  };

  const handleEditStaff = async (id: string, formData: Partial<Staff>) => {
    const result = await updateStaffMember(id, {
      ...formData,
      roleIds: formData.roleId ? [formData.roleId] : undefined,
    });
    if (result.success) {
      toast.success("Staff member updated successfully");
    } else {
      toast.error(`Failed to update staff member, ${result.error}`);
      console.error("Failed to update staff:", result.error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const result = await deleteStaffMember(id);
    if (result.success) {
      toast.success("Staff member deleted successfully");
    } else {
      toast.error(`Failed to delete staff member, ${result.error}`);
      console.error("Failed to delete staff:", result.error);
    }
  };

  return (
    <StaffContent
      branchId={branchId}
      initialStaffData={staffData}
      roles={roles}
      error={error}
      onAddStaff={handleAddStaff}
      onEditStaff={handleEditStaff}
      onDeleteStaff={handleDeleteStaff}
      paginationMeta={paginationMeta}
    />
  );
}
