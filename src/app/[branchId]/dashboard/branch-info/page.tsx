"use client";

import React, { useState, useEffect } from "react";
import { AddBranchDialog } from "./_components/add-branch-dialog";
import { UpdateBranchDialog } from "./_components/update-branch-dialog";
import { DeleteBranchDialog } from "./_components/delete-branch-dialog";
import { BranchesTable } from "./_components/branches-table";
import { BranchesSkeleton } from "./_components/branches-skeleton";
import { EmptyState } from "./_components/empty-state";
import { getAllBranches } from "@/actions/branch.actions";
import { Building2 } from "lucide-react";
import { Branch } from "@/types";
import { useSession } from "next-auth/react";

export default function BranchInfoPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { data: session } = useSession();
  const { branchId } = React.use(params);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const spaId = session?.spaIds?.[0] || "";

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const result = await getAllBranches();
      if (result.success && result.data) {
        setBranches(result.data);
      } else {
        console.error("Failed to fetch branches:", result.error);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = () => {
    fetchBranches();
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setUpdateDialogOpen(true);
  };

  const handleDeleteBranch = (branch: Branch) => {
    setDeletingBranch(branch);
    setDeleteDialogOpen(true);
  };

  const handleUpdateBranch = () => {
    setUpdateDialogOpen(false);
    setEditingBranch(null);
    fetchBranches();
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    setDeletingBranch(null);
    fetchBranches();
  };

  const handleUpdateDialogOpenChange = (open: boolean) => {
    setUpdateDialogOpen(open);
    if (!open) {
      // Reset editing branch when dialog closes
      setEditingBranch(null);
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      // Reset deleting branch when dialog closes
      setDeletingBranch(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground mt-2">
            Manage your spa branch locations, contact information, and operating
            details
          </p>
        </div>
        <AddBranchDialog spaId={spaId} onAddBranch={handleAddBranch} />
      </div>

      {/* Show skeleton while loading */}
      {loading ? (
        <BranchesSkeleton />
      ) : (
        <>
          {/* Empty state when no branches */}
          {branches.length === 0 ? (
            <EmptyState
              title="No branches found"
              description="Get started by creating your first branch location"
              icon={<Building2 className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <BranchesTable
              branches={branches}
              onEdit={handleEditBranch}
              onDelete={handleDeleteBranch}
            />
          )}
        </>
      )}

      {/* Update Dialog */}
      <UpdateBranchDialog
        branch={editingBranch}
        open={updateDialogOpen}
        onOpenChange={handleUpdateDialogOpenChange}
        onUpdateBranch={handleUpdateBranch}
      />

      {/* Delete Dialog */}
      <DeleteBranchDialog
        branch={deletingBranch}
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onDeleteBranch={handleDeleteConfirm}
      />
    </div>
  );
}
