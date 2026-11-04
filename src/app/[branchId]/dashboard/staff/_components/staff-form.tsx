"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { staffFormSchema, type StaffFormData } from "@/schemas/staff.schema";
import { Branch, CreateStaffRequest, Role, Staff } from "@/types";
import { getBranches } from "@/actions/branch.actions";
import { useSession } from "next-auth/react";

interface StaffFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: CreateStaffRequest | Partial<Staff>) => Promise<void>;
  roles: Role[];
  branchId?: string;
  initialData?: Staff | null;
}

export function StaffForm({
  isOpen,
  onOpenChange,
  onSubmit,
  roles,
  branchId,
  initialData,
}: StaffFormProps) {
  const isEditMode = !!initialData;
  const [branches, setBranches] = useState<Branch[]>([]);
  const {data: session} = useSession();
    const branchIds = useMemo(() =>{
    return session?.branchIds || [];
  }, [session?.branchIds]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setError,
    setValue,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: isEditMode
      ? {
          firstName: initialData?.firstName || "",
          lastName: initialData?.lastName || "",
          email: initialData?.email || "",
          password: "",
          role: initialData?.roles?.[0]?.id || "",
          phone: initialData?.phone || "",
          specialties: initialData?.specialties || "",
          workingHours: initialData?.workingHours || "",
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "",
          phone: "",
          specialties: "",
          workingHours: "",
        },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (isEditMode && initialData) {
      reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        password: "",
        role: initialData.roles?.[0]?.id || "",
        phone: initialData.phone || "",
        specialties: initialData.specialties || "",
        workingHours: initialData.workingHours || "",
      });
    } else if (!isEditMode) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "",
        phone: "",
        specialties: "",
        workingHours: "",
      });
    }
  }, [initialData, isEditMode, reset]);

    useEffect(() => {
      if (session?.spaIds?.[0]) {
        loadData();
      }
    }, [session?.spaIds?.[0]]);
  
    async function loadData() {
      const [branchesRes] = await Promise.all([
        getBranches(),
      ]);
      setBranches(branchesRes.data || []);
    }

  const branchAvailable = useMemo(() => {
    return branches.filter(branch => branchIds.includes(branch.id));
  }, [branches, branchIds]);

  const onSubmitForm = async (data: StaffFormData) => {
    // Validate password is required for create mode
    if (!isEditMode && !data.password) {
      setError("password", {
        type: "manual",
        message: "Password is required",
      });
      return;
    }

    try {
      if (isEditMode && initialData) {
        // Edit mode
        await onSubmit({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          specialties: data.specialties,
          workingHours: data.workingHours,
          branchIds: data.branchIds || [],
          roleId: data.role,
          ...(data.password && { password: data.password }),
        });
      } else {
        // Create mode
        await onSubmit({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password || "",
          phone: data.phone,
          roleIds: [data.role],
          specialties: data.specialties,
          workingHours: data.workingHours,
          branchIds: data.branchIds,
          isActive: true,
        });
      }
      reset();
      onOpenChange(false);
    } catch (error) {}
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Staff Member" : "Add New Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update staff member information"
              : "Fill in the details to add a new team member"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{"First Name"}</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{"Last Name"}</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{"Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@spa.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                  disabled={isEditMode}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {"Password"}
                  {isEditMode && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (optional)
                    </span>
                  )}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    isEditMode
                      ? "Leave empty to keep current password"
                      : "••••••••"
                  }
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">{"Role"}</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="role"
                        className={`${errors.role ? "border-destructive" : ""} w-full capitalize`}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem
                            key={r.id}
                            value={r.id}
                            className="capitalize"
                          >
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-sm text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>
             {branchAvailable.length > 0 && (
              <div className="space-y-2">
                <Label>Assign to Branches</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {branchAvailable.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`branch-${branch.id}`}
                        checked={watch("branchIds")?.includes(branch.id)}
                        onCheckedChange={() => {
                          const currentBranchIds = watch("branchIds") || [];
                          if (currentBranchIds.includes(branch.id)) {
                            setValue(
                              "branchIds",
                              currentBranchIds.filter((id) => id !== branch.id)
                            );
                          } else {
                            setValue("branchIds", [...currentBranchIds, branch.id]);
                          }
                        }}
                      />
                      <Label
                        htmlFor={`branch-${branch.id}`}
                        className="font-normal cursor-pointer"
                      >
                        {branch.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">{"Phone"}</Label>
              <Input
                id="phone"
                placeholder="+1-555-0000"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">{"Specialties"}</Label>
              <Input
                id="specialties"
                placeholder="Swedish Massage, Aromatherapy..."
                {...register("specialties")}
                className={errors.specialties ? "border-destructive" : ""}
              />
              {errors.specialties && (
                <p className="text-sm text-destructive">
                  {errors.specialties.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHours">{"Working Hours"}</Label>
              <Input
                id="workingHours"
                placeholder="Mon-Fri: 9:00 AM - 6:00 PM"
                {...register("workingHours")}
                className={errors.workingHours ? "border-destructive" : ""}
              />
              {errors.workingHours && (
                <p className="text-sm text-destructive">
                  {errors.workingHours.message}
                </p>
              )}
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
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Staff Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
