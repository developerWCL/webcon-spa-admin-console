"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  StaffDayOffFormData,
  staffDayOffSchema,
  dayOffReasonEnum,
} from "@/schemas/staff-dayoff.schema";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createStaffDayOff,
  updateStaffDayOff,
} from "@/actions/daily-management.actions";
import { toast } from "sonner";
import { useParams } from "next/navigation";

const REASON_LABELS: Record<string, string> = {
  sick_leave: "Sick Leave",
  personal: "Personal",
  vacation: "Vacation",
  medical_appointment: "Medical Appointment",
  family_emergency: "Family Emergency",
  other: "Other",
};

interface AddStaffDayOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  staffMembers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  }>;
  editingDayOff?: {
    id: string;
    date: string;
    staffId: string;
    reason: string;
    status: string;
    note?: string;
  } | null;
}

export function AddStaffDayOffDialog({
  open,
  onOpenChange,
  onSave,
  staffMembers = [],
  editingDayOff = null,
}: AddStaffDayOffDialogProps) {
  const params = useParams();
  const branchId = params.branchId as string;
  const isEditing = !!editingDayOff;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    control,
  } = useForm<StaffDayOffFormData>({
    resolver: zodResolver(staffDayOffSchema),
    defaultValues: {
      date: "",
      staffId: "",
      reason: "other",
      status: "pending",
      note: "",
    },
  });

  const staffName = watch("staffId");
  const status = watch("status");
  const reason = watch("reason");

  // Update form values when editing data changes
  React.useEffect(() => {
    if (editingDayOff) {
      setValue("date", editingDayOff.date);
      setValue("staffId", editingDayOff.staffId);
      setValue("reason", editingDayOff.reason as any);
      setValue("status", editingDayOff.status as any);
      setValue("note", editingDayOff.note || "");
    } else {
      reset();
    }
  }, [editingDayOff, setValue, reset]);

  const onSubmit = async (data: StaffDayOffFormData) => {
    try {
      let result;
      if (isEditing && editingDayOff) {
        result = await updateStaffDayOff(branchId, editingDayOff.id, data);
      } else {
        result = await createStaffDayOff(branchId, data);
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Staff day-off updated successfully"
            : "Staff day-off created successfully",
        );
        reset();
        onOpenChange(false);
        onSave?.();
      } else {
        toast.error(result.error || "Failed to save staff day-off");
      }
    } catch (error) {
      console.error("Error saving staff day-off:", error);
      toast.error("An error occurred while saving staff day-off");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Staff Day-Off" : "Add Staff Day-Off"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 w-full">
          <div className="space-y-2 w-full">
            <Label htmlFor="dayoff-date">Date</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "!w-full justify-between text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.date && "border-red-500",
                      )}
                    >
                      {field.value
                        ? format(new Date(field.value), "PPP")
                        : "Pick a date"}
                      <CalendarIcon className="mr-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="dayoff-staff">Staff Member</Label>
            <Select
              value={staffName}
              onValueChange={(value) => setValue("staffId", value)}
            >
              <SelectTrigger
                id="dayoff-staff"
                className={`!w-full ${errors.staffId ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={`${staff.id}`}>
                    {staff.firstName} {staff.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.staffId && (
              <p className="text-sm text-red-500">{errors.staffId.message}</p>
            )}
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="dayoff-reason">Reason</Label>
            <div className="w-full">
              <Select
                value={reason}
                onValueChange={(value) => setValue("reason", value as any)}
              >
                <SelectTrigger
                  id="dayoff-reason"
                  className={`w-full ${errors.reason ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {dayOffReasonEnum.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {REASON_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="dayoff-note">Note (Optional)</Label>
            <Textarea
              id="dayoff-note"
              placeholder="Add any additional notes..."
              {...register("note")}
              className={`min-h-16 ${errors.note ? "border-red-500" : ""}`}
            />
            {errors.note && (
              <p className="text-sm text-red-500">{errors.note.message}</p>
            )}
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="dayoff-status">Status</Label>
            <div className="flex w-full">
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue(
                    "status",
                    value as "pending" | "approved" | "rejected",
                  )
                }
              >
                <SelectTrigger
                  id="dayoff-status"
                  className={`!w-full ${errors.status ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Day-Off"
                  : "Save Day-Off"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
