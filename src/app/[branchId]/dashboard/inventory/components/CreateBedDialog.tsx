"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { createBedSchema, type CreateBedFormData } from "@/schemas/bed.schema";
import { createBed, updateBed } from "@/actions/beds.actions";

interface Room {
  id: string;
  name: string;
  type: string;
}

interface CreateBedDialogProps {
  rooms: Room[];
  onBedCreate?: (bed: CreateBedFormData) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: Partial<CreateBedFormData>;
  editBedId?: string | null;
}

export function CreateBedDialog({
  rooms,
  onBedCreate,
  open,
  onOpenChange,
  defaultValues,
  editBedId,
}: CreateBedDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const branchId = params.branchId as string;
  const isEditMode = !!editBedId;

  const form = useForm<CreateBedFormData>({
    resolver: zodResolver(createBedSchema),
    defaultValues: {
      name: "",
      bedId: "",
      type: "bed",
      roomId: "",
      ...((typeof window !== "undefined" &&
        (window as any).editBedDefaultValues) ||
        {}),
    },
    values: undefined,
  });

  // If defaultValues prop changes, reset the form
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        bedId: defaultValues.bedId || "",
        type: defaultValues.type || "bed",
        roomId: defaultValues.roomId || "",
      });
    }
  }, [defaultValues]);

  const handleSubmit = async (data: CreateBedFormData) => {
    try {
      setIsLoading(true);

      let result;
      if (isEditMode) {
        result = await updateBed(editBedId, branchId, data);
      } else {
        result = await createBed(branchId, data);
      }

      if (!result.success) {
        toast.error(
          result.error ||
            (isEditMode ? "Failed to update bed" : "Failed to create bed"),
        );
        return;
      }

      toast.success(
        isEditMode ? "Bed updated successfully" : "Bed created successfully",
      );
      onBedCreate?.(data);
      if (onOpenChange) onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(
        editBedId ? "Update bed error:" : "Create bed error:",
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editBedId ? "Edit Bed" : "Add New Bed"}</DialogTitle>
          <DialogDescription>
            {editBedId
              ? "Update bed or chair details."
              : "Create a new bed or chair - can be assigned to a room/area or standalone"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Bed 9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bed ID and Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bed ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BED-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bed">Bed</SelectItem>
                            <SelectItem value="chair">Chair</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Assign to Room/Area */}
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Room/Area</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) =>
                          field.onChange(value || undefined)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="No room (Standalone)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            No room (Standalone)
                          </SelectItem>
                          {rooms?.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} - {room.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange && onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? editBedId
                    ? "Updating..."
                    : "Creating..."
                  : editBedId
                    ? "Update Bed"
                    : "Add Bed"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
