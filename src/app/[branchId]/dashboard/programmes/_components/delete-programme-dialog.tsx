"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteProgrammeAction } from "@/actions/programme.action";

interface DeleteProgrammeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programme: {
    id: string | number;
    name: string;
  } | null;
  branchId: string;
  onDeleteSuccess?: () => void;
}

export function DeleteProgrammeDialog({
  open,
  onOpenChange,
  programme,
  branchId,
  onDeleteSuccess,
}: DeleteProgrammeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!programme) return;

    setIsDeleting(true);
    try {
      const result = await deleteProgrammeAction(
        String(programme.id),
        branchId,
      );

      if (result.success) {
        toast.success("Programme deleted successfully");
        onOpenChange(false);
        onDeleteSuccess?.();
      } else {
        toast.error(result.error || "Failed to delete programme");
      }
    } catch (error) {
      console.error("Error deleting programme:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete Programme</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{programme?.name}"
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
