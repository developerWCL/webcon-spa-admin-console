"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Staff as StaffMember } from "@/types";

interface DeleteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteStaffDialog({
  open,
  onOpenChange,
  staff,
  isDeleting,
  onConfirm,
}: DeleteStaffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Remove Staff Member"}</DialogTitle>
          <DialogDescription>
            {"Are you sure you want to remove "}
            <span className="font-semibold">
              {staff?.firstName} {staff?.lastName}
            </span>
            {"? This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {"Cancel"}
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting..." : "Remove Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
