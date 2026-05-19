"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Staff as StaffMember, Role } from "@/types";
import { toast } from "sonner";

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  roles: Role[];
  onSubmit: (id: string, data: Partial<StaffMember>) => Promise<void>;
  refresh: (page: number) => Promise<void>;
}

export function EditStaffDialog({
  open,
  onOpenChange,
  staff,
  roles,
  onSubmit,
  refresh,
}: EditStaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<
    (Partial<StaffMember> & { roleId?: string }) | null
  >(null);

  // Initialize form data when staff changes
  const currentFormData =
    formData ||
    (staff
      ? {
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          isActive: staff.isActive,
          roleId: staff.roles?.[0]?.id || "",
        }
      : null);

  if (!staff) return null;

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFormData(null);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFormData) return;

    try {
      setIsSubmitting(true);
      await onSubmit(staff.id, currentFormData);
      // toast.success("Staff member updated successfully");
      await refresh(1);
      handleOpenChange(false);
    } catch (error) {
      // toast.error(
      //   error instanceof Error ? error.message : "Failed to update staff",
      // );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{"Edit Staff Member"}</DialogTitle>
          <DialogDescription>
            {"Update staff member information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{"First Name"}</Label>
              <Input
                id="firstName"
                value={currentFormData?.firstName || ""}
                onChange={(e) =>
                  setFormData({
                    ...currentFormData,
                    firstName: e.target.value,
                  })
                }
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{"Last Name"}</Label>
              <Input
                id="lastName"
                value={currentFormData?.lastName || ""}
                onChange={(e) =>
                  setFormData({
                    ...currentFormData,
                    lastName: e.target.value,
                  })
                }
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{"Email"}</Label>
            <Input
              id="email"
              type="email"
              value={currentFormData?.email || ""}
              onChange={(e) =>
                setFormData({
                  ...currentFormData,
                  email: e.target.value,
                })
              }
              placeholder="john@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{"Status"}</Label>
              <Select
                value={currentFormData?.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({
                    ...currentFormData,
                    isActive: value === "active",
                  })
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{"Active"}</SelectItem>
                  <SelectItem value="inactive">{"Inactive"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{"Role"}</Label>
              <Select
                value={currentFormData?.roleId || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...currentFormData,
                    roleId: value,
                  })
                }
              >
                <SelectTrigger id="role" className="w-full capitalize">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.id}
                        className="capitalize"
                      >
                        {role.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      {"No roles available"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {"Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
