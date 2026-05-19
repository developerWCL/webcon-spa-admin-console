"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { deleteBranch } from "@/actions/branch.actions";
import { Branch } from "@/types";

interface DeleteBranchDialogProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteBranch?: () => void;
}

export const DeleteBranchDialog = ({
  branch,
  open,
  onOpenChange,
  onDeleteBranch,
}: DeleteBranchDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!branch?.id) return;

    setIsSubmitting(true);
    try {
      const result = await deleteBranch(branch.id);

      if (result.success) {
        toast.success("Branch deleted successfully");
        onOpenChange(false);
        onDeleteBranch?.();
      } else {
        toast.error(result.error || "Failed to delete branch");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the branch");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Branch</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{branch?.name}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
