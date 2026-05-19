"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Staff as StaffMember } from "@/types";

interface StaffDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
}

export function StaffDetailsDialog({
  open,
  onOpenChange,
  staff,
}: StaffDetailsDialogProps) {
  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {`${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>
                {staff.firstName} {staff.lastName}
              </DialogTitle>
              <DialogDescription>{staff.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">{"Email"}</Label>
              <p className="font-medium mt-1 break-words">{staff.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {"Status"}
              </Label>
              <Badge
                variant={staff.isActive ? "default" : "outline"}
                className="mt-1"
              >
                {staff.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                {"Created"}
              </Label>
              <p className="font-medium mt-1">
                {staff.createdAt
                  ? new Date(staff.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {"Last Updated"}
              </Label>
              <p className="font-medium mt-1">
                {staff.updatedAt
                  ? new Date(staff.updatedAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
          {staff.branches && staff.branches.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {"Branches"}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {staff.branches.map((branch) => (
                  <Badge key={branch.id} variant="secondary">
                    {branch.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {staff.roles && staff.roles.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">{"Roles"}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {staff.roles.map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {"Close"}
          </Button>
          <Button>{"Edit Profile"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
