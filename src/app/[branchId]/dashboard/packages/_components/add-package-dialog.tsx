"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Search,
  Info,
  ImageIcon,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CreatePackageSchema } from "@/schemas/package.schema";
import type {
  CreatePackageFormValues,
  UpdatePackageFormValues,
} from "@/types/forms";
import { createPackage, updatePackage } from "@/actions/package.actions";
import {
  generateMediaUploadUrls,
  uploadImageToS3,
} from "@/actions/media.actions";
import { getServices } from "@/actions/service.actions";
import { getBranches } from "@/actions/branch.actions";
import { useLanguages } from "@/hooks/useLanguages";
import { PriceChangeConfirmationDialog } from "../../services/_components/price-change-confirmation-dialog";
import { MultiSelect } from "@/components/ui/multi-select";

interface Service {
  id: string;
  name: string;
  category?: string;
  status: "active" | "inactive";
}

interface SubService {
  id: string;
  name: string;
  category: string;
  parentServiceName?: string;
  duration: number;
  price: number;
  status: "active" | "inactive";
  onlyPackage?: boolean;
}

interface Package {
  id: string;
  branchId: string;
  name: string;
  price?: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  subServices: SubService[];
  media?: Array<{ id: string; url: string }>;
  translations?: Array<{
    languageCode: string;
    name: string;
    description: string;
  }>;
}

interface AddPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPackageId: string | null;
  editingPackage?: Package;
  branchId: string;
  subServices: SubService[];
  onSuccess: (data: CreatePackageFormValues, isEdit: boolean) => void;
}

export function AddPackageDialog({
  open,
  onOpenChange,
  editingPackageId,
  editingPackage,
  branchId,
  subServices,
  onSuccess,
}: AddPackageDialogProps) {
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [serviceCategory, setServiceCategory] = useState("all");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSubServiceIds, setInitialSubServiceIds] = useState<string[]>(
    [],
  );
  const [newSubServiceTabIndex, setNewSubServiceTabIndex] = useState<
    Record<number, string>
  >({});
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicePopoverOpen, setServicePopoverOpen] = useState<
    Record<number, boolean>
  >({});
  const [serviceSearch, setServiceSearch] = useState<Record<number, string>>(
    {},
  );
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([
    branchId,
  ]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Price change confirmation state
  const [showPriceChangeDialog, setShowPriceChangeDialog] = useState(false);
  const [priceChangeData, setPriceChangeData] = useState<{
    oldPrices: Record<number, number>;
    newPrices: Record<number, number>;
  }>({ oldPrices: {}, newPrices: {} });
  const [pendingFormData, setPendingFormData] =
    useState<CreatePackageFormValues | null>(null);
  const [priceChangeAction, setPriceChangeAction] = useState<
    "overwrite" | "keep-custom" | null
  >(null);

  const getDefaultNewSubServiceTranslations = () => {
    if (languages.length === 0) return [];
    return languages.map((lang) => ({
      languageCode: lang.code,
      name: "",
      description: "",
    }));
  };

  const form = useForm<CreatePackageFormValues>({
    resolver: zodResolver(CreatePackageSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      startDate: "",
      endDate: "",
      status: "active",
      subServiceIds: [],
      newSubServices: [],
      translations: languages.map((lang) => ({
        languageCode: lang.code,
        name: "",
        description: "",
      })),
      mediaIds: [],
    },
  });

  const {
    fields: newSubServiceFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "newSubServices" as any,
  });

  useEffect(() => {
    if (languages.length > 0) {
      form.setValue(
        "translations",
        languages.map((lang) => ({
          languageCode: lang.code,
          name: "",
          description: "",
        })),
      );
    }
  }, [languages, form]);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        const fetchedServices = await getServices(branchId);
        if (fetchedServices && Array.isArray(fetchedServices)) {
          setServices(
            fetchedServices.map((service: any) => ({
              id: service.id,
              name: service.name,
              category: service.category,
              status: service.status || "active",
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };

    if (open && branchId) {
      fetchServices();
    }
  }, [open, branchId]);

  // Fetch branches on component mount (create mode only)
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const result = await getBranches();
        if (result.success && result.data) {
          setBranches(
            result.data.map((branch) => ({
              id: branch.id,
              name: branch.name,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load branches:", error);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    if (!editingPackageId) {
      loadBranches();
    } else {
      setIsLoadingBranches(false);
    }
  }, [editingPackageId]);

  React.useEffect(() => {
    if (editingPackageId && editingPackage && languages.length > 0) {
      // Handle translations - ensure it's an array
      const existingTranslations = Array.isArray(editingPackage.translations)
        ? editingPackage.translations
        : [];

      const translationsMap = new Map(
        existingTranslations.map((t: any) => [t.languageCode, t]),
      );

      const primaryLang = languages.find((lang) => lang.isPrimary);
      const primaryTranslation = primaryLang
        ? translationsMap.get(primaryLang.code)
        : null;

      const mappedTranslations = languages.map((lang) => {
        const existing = translationsMap.get(lang.code);
        return (
          existing || {
            languageCode: lang.code,
            name: "",
            description: "",
          }
        );
      });

      const subServiceIds =
        editingPackage.subServices?.map((s: any) => s.id) || [];

      form.reset({
        name: editingPackage.name || primaryTranslation?.name || "",
        description: primaryTranslation?.description || "",
        price: editingPackage.price,
        startDate: editingPackage.startDate,
        endDate: editingPackage.endDate,
        status: editingPackage.status,
        subServiceIds: subServiceIds,
        newSubServices: [],
        translations: mappedTranslations,
        mediaIds: [],
      });

      // Store initial sub-service IDs to prevent auto-calculation on first load
      setInitialSubServiceIds(subServiceIds);

      // Load existing media if available
      setRemovedMediaIds([]);
    } else if (!editingPackageId && languages.length > 0) {
      form.reset({
        name: "",
        description: "",
        price: "",
        startDate: "",
        endDate: "",
        status: "active",
        subServiceIds: [],
        newSubServices: [],
        translations: languages.map((lang) => ({
          languageCode: lang.code,
          name: "",
          description: "",
        })),
        mediaIds: [],
      });
      setImageUrls([]);
      setRemovedMediaIds([]);
      setInitialSubServiceIds([]);
    }
  }, [editingPackageId, editingPackage, branchId, form, languages]);

  const handleClose = () => {
    form.reset();
    setServiceSearchTerm("");
    setServiceCategory("all");
    setImageUrls([]);
    setRemovedMediaIds([]);
    setIsSubmitting(false);
    setInitialSubServiceIds([]);
    setNewSubServiceTabIndex({});
    setServicePopoverOpen({});
    setServiceSearch({});
    onOpenChange(false);
  };

  const handleAddNewSubService = () => {
    append({
      serviceId: services.find((s) => s.name === "PACKAGE ONLY")?.id || "",
      name: "",
      durationMinutes: "45",
      price: "",
      status: "active",
      translations: getDefaultNewSubServiceTranslations(),
    } as any);
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64String: string): Blob => {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const MAX_IMAGES = 5;
      const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes

      // Check if adding these files would exceed the limit
      if (imageUrls.length + files.length > MAX_IMAGES) {
        toast.error("Image limit exceeded", {
          description: `You can upload a maximum of ${MAX_IMAGES} images. You already have ${imageUrls.length} image(s).`,
        });
        return;
      }

      Array.from(files).forEach((file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File "${file.name}" is too large`, {
            description: `Maximum file size is 500 KB. Your file is ${(file.size / 1024).toFixed(2)} KB.`,
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          setImageUrls([...imageUrls, base64String]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreatePackageFormValues) => {
    // Check for price changes in edit mode
    if (editingPackageId && editingPackage) {
      const oldPrice = parseFloat(editingPackage.price || "0");
      const newPrice = parseFloat(data.price || "0");
      if (Math.abs(oldPrice - newPrice) > 0.01) {
        // Price has changed, show confirmation dialog
        setPriceChangeData({
          oldPrices: { 0: oldPrice },
          newPrices: { 0: newPrice },
        });
        setPendingFormData(data);
        setShowPriceChangeDialog(true);
        return; // Don't continue with submission yet
      }
    }

    // Proceed with normal submission
    await performSubmit(data);
  };

  const performSubmit = async (data: CreatePackageFormValues) => {
    setIsSubmitting(true);
    try {
      // Find primary language
      const primaryLang = languages.find((lang) => lang.isPrimary);

      // Step 1: Collect existing media IDs (from editingPackage) + Upload new images to S3
      let mediaIds: string[] = [];

      // In edit mode, start with existing media IDs (excluding removed ones)
      if (
        editingPackageId &&
        editingPackage?.media &&
        Array.isArray(editingPackage.media)
      ) {
        mediaIds = editingPackage.media
          .filter((m: any) => !removedMediaIds.includes(m.id))
          .map((m: any) => m.id);
      }

      // Upload new images if any
      if (imageUrls && imageUrls.length > 0) {
        try {
          // Prepare image metadata
          const imagesToUpload: Array<{
            filename: string;
            mimeType: string;
            size: number;
          }> = [];

          for (let i = 0; i < imageUrls.length; i++) {
            const base64String = imageUrls[i];
            // Convert base64 to blob to get size
            const blob = base64ToBlob(base64String);
            const filename = `package-image-${i + 1}-${Date.now()}.jpg`;

            imagesToUpload.push({
              filename,
              mimeType: "image/jpeg",
              size: blob.size,
            });
          }

          // Generate presigned URLs
          const uploadUrls = await generateMediaUploadUrls(imagesToUpload);

          // Upload each image to S3
          for (let i = 0; i < imageUrls.length; i++) {
            const base64String = imageUrls[i];
            const blob = base64ToBlob(base64String);
            const uploadUrl = uploadUrls[i];

           // Convert blob to Uint8Array then to regular array for server action transmission
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const fileArray = Array.from(uint8Array);
            await uploadImageToS3(uploadUrl.url, fileArray, "image/jpeg");
            mediaIds.push(uploadUrl.mediaId);
          }
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error("Failed to upload images", {
            description:
              error instanceof Error ? error.message : "Please try again.",
          });
          // Continue with package creation even if image upload fails
        }
      }

      // Step 2: Reformat data for API
      const reformattedData = {
        ...data,
        branchId: editingPackageId ? branchId : selectedBranchIds,
        name: data.name, // Use primary language name as root
        mediaIds, // Include mediaIds
        translations: data.translations
          .map((t, index) => {
            // For primary language, use the root name/description fields
            if (primaryLang && t.languageCode === primaryLang.code) {
              return {
                languageCode: t.languageCode,
                name: data.name || t.name || "",
                description: data.description || t.description || "",
              };
            }
            // For other languages, use translation values
            return {
              languageCode: t.languageCode,
              name: t.name || "",
              description: t.description || "",
            };
          })
          .filter((t) => {
            // Always include primary language
            if (primaryLang && t.languageCode === primaryLang.code) return true;
            // Only include optional languages if they have data
            if (t.name || t.description) return true;
            return false;
          }),
      };
      const startDate = new Date(data.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(data.endDate);
      endDate.setHours(23, 59, 59, 999);
      // Step 3: Create or update package with mediaIds
      if (editingPackageId) {
        await updatePackage(editingPackageId, branchId, {
          ...(reformattedData as UpdatePackageFormValues),
          startDate,
          endDate,
          isOverride: priceChangeAction === "overwrite" ? true : false,
        });
        toast.success("Package updated successfully!", {
          description: `${data.name} has been updated.`,
        });
        onSuccess(reformattedData, true);
      } else {
        // Create package with selectedBranchIds in create mode
        await createPackage(branchId, selectedBranchIds, {
          ...reformattedData,
          startDate,
          endDate,
        });
        toast.success("Package created successfully!", {
          description: `${data.name} has been added to your packages.`,
        });
        onSuccess(reformattedData, false);
      }
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Please try again.";
      toast.error(
        editingPackageId
          ? "Failed to update package"
          : "Failed to create package",
        {
          description: errorMessage,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter sub-services for selection
  const filteredSubServices = subServices.filter(
    (service) =>
      service.status === "active" &&
      service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) &&
      (serviceCategory === "all" || service.category === serviceCategory),
  );

  // Get unique categories (filter out empty ones)
  const serviceCategories = Array.from(
    new Set(
      subServices
        .filter((s) => s.status === "active" && s.category)
        .map((s) => s.category),
    ),
  );

  const selectedServices = form.watch("subServiceIds");
  const translations = form.watch("translations") || [];
  const currentPrice = form.watch("price");

  // Detect price changes when editing
  useEffect(() => {
    if (open && editingPackageId && editingPackage && currentPrice) {
      const oldPrice = parseFloat(editingPackage.price || "0");
      const newPrice = parseFloat(currentPrice);
      if (Math.abs(oldPrice - newPrice) > 0.01) {
        setPriceChangeData({
          oldPrices: { 0: oldPrice },
          newPrices: { 0: newPrice },
        });
      }
    }
  }, [currentPrice, open, editingPackageId, editingPackage]);

  // Auto-calculate price from selected services (only on create or when user changes services)
  useEffect(() => {
    if (selectedServices && selectedServices.length > 0) {
      // For create mode, always auto-calculate
      // For edit mode, only auto-calculate if services have changed from initial
      const hasServiceChanged =
        editingPackageId === null ||
        selectedServices.join(",") !== initialSubServiceIds.join(",");

      if (hasServiceChanged) {
        const totalPrice = selectedServices.reduce((sum, serviceId) => {
          const service = subServices.find((s) => s.id === serviceId);
          return sum + (service?.price || 0);
        }, 0);

        form.setValue("price", totalPrice.toString());
      }
    } else if (editingPackageId === null) {
      // In create mode, clear price if no services selected
      form.setValue("price", "");
    }
  }, [
    selectedServices,
    subServices,
    form,
    editingPackageId,
    initialSubServiceIds,
  ]);

  // Handler for price change confirmation
  const handlePriceChangeConfirm = async (
    formData: CreatePackageFormValues,
    action: "overwrite" | "keep-custom",
  ) => {
    // For now, both actions proceed with submission (backend will handle the pricing strategy)
    setPriceChangeAction(action);
    setShowPriceChangeDialog(false);
    await performSubmit(formData);
  };

  const handlePriceChangeCancel = () => {
    setShowPriceChangeDialog(false);
    setPendingFormData(null);
    setPriceChangeAction(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl flex flex-col px-0"
        style={{ width: "90vw", maxWidth: "800px", maxHeight: "90vh" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl px-8">
            {editingPackageId ? "Edit Package" : "Create New Package"}
          </DialogTitle>
          <DialogDescription className="px-8">
            {editingPackageId
              ? "Update package details and included sub-services"
              : "Create a bundled package with 1-10 sub-services"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-8">
          {/* Info Tip Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                Tip: Build your perfect spa package
              </p>
              <p>
                Combine 1-10 sub-services to create an attractive bundled offer
                for your guests
              </p>
            </div>
          </div>

          {isLoadingLanguages ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Branch Multi-Select (Create Mode Only) */}
                {!editingPackageId && (
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <Label htmlFor="branchIds" className="font-medium">
                      Select Branches <span className="text-red-500">*</span>
                    </Label>
                    <MultiSelect
                      items={branches}
                      selectedIds={selectedBranchIds}
                      onSelectionChange={setSelectedBranchIds}
                      placeholder="Select one or more branches..."
                      searchPlaceholder="Search branches..."
                      emptyMessage="No branches found."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This package will be created for all selected branches
                    </p>
                  </div>
                )}

                {/* Section 1: Package Details (Multi-Language) */}
                <div className="space-y-4">
                  <Tabs
                    defaultValue={
                      languages.find((lang) => lang.isPrimary)?.code ||
                      languages[0]?.code
                    }
                    className="w-full"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                          1
                        </div>
                        <h3 className="font-semibold text-lg">
                          Package Details
                        </h3>
                      </div>
                      {languages.length > 1 && (
                        <TabsList className="grid grid-cols-2">
                          {languages.map((lang) => (
                            <TabsTrigger key={lang.code} value={lang.code}>
                              {lang.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      )}
                    </div>

                    {languages.map((lang, index) => (
                      <TabsContent
                        key={lang.code}
                        value={lang.code}
                        className="space-y-4 mt-4"
                      >
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <FormField
                            control={form.control}
                            name={
                              lang.isPrimary
                                ? "name"
                                : `translations.${index}.name`
                            }
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium">
                                  Package Name{" "}
                                  {lang.isPrimary && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      lang.isPrimary
                                        ? "e.g., Relaxation Bundle, VIP Spa Day"
                                        : "Optional translation"
                                    }
                                    {...field}
                                    className="bg-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={
                              lang.isPrimary
                                ? "description"
                                : `translations.${index}.description`
                            }
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium">
                                  Description{" "}
                                  {lang.isPrimary && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe what's included in this package..."
                                    {...field}
                                    className="bg-white h-24"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Section 2: Sub-Services Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Sub-Services</h3>
                      <p className="text-sm text-muted-foreground">
                        Select existing sub-services and/or create new ones
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    {/* Section 2a: Select Existing Sub-Services */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-700">
                        Select Existing Sub-Services
                      </h4>

                      {/* Service Filter Controls */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search sub-services..."
                            value={serviceSearchTerm}
                            onChange={(e) =>
                              setServiceSearchTerm(e.target.value)
                            }
                            className="pl-10 bg-white"
                          />
                        </div>
                        <Select
                          value={serviceCategory}
                          onValueChange={setServiceCategory}
                        >
                          <SelectTrigger className="w-48 bg-white">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {serviceCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sub-Services List */}
                      <FormField
                        control={form.control}
                        name="subServiceIds"
                        render={() => (
                          <FormItem>
                            <div className="border border-gray-200 rounded-lg divide-y max-h-72 overflow-y-auto bg-white">
                              {filteredSubServices.length > 0 ? (
                                filteredSubServices.map((service) => (
                                  <div
                                    key={service.id}
                                    className="flex items-center gap-3 p-4 hover:bg-blue-50 transition-colors"
                                  >
                                    <FormField
                                      control={form.control}
                                      name="subServiceIds"
                                      render={({ field }) => (
                                        <Checkbox
                                          checked={field.value?.includes(
                                            service.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  service.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value: string) =>
                                                      value !== service.id,
                                                  ),
                                                );
                                          }}
                                        />
                                      )}
                                    />
                                    <Label className="flex-1 flex items-center justify-between cursor-pointer py-1">
                                      <div>
                                        <div className="flex gap-2 items-center">
                                          <p className="font-medium text-gray-900">
                                            {service.name}
                                            {" ("}
                                            {service.parentServiceName}
                                            {")"}
                                          </p>{" "}
                                          <Badge
                                            variant="default"
                                            className={`ml-2 px-2 py-1 rounded-full ${
                                              service?.onlyPackage
                                                ? "bg-green-100 text-green-700"
                                                : "bg-blue-100 text-blue-700"
                                            }`}
                                          >
                                            {service?.onlyPackage
                                              ? "Package Only"
                                              : "General"}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {service.category} •{" "}
                                          {service.duration} mins
                                        </p>
                                      </div>
                                      <span className="text-sm font-semibold text-primary bg-blue-50 px-2 py-1 rounded">
                                        ฿{service.price.toLocaleString()}
                                      </span>
                                    </Label>
                                  </div>
                                ))
                              ) : (
                                <div className="p-6 text-center text-muted-foreground">
                                  <p className="text-sm">
                                    No active sub-services found
                                  </p>
                                  <p className="text-xs mt-1">
                                    Try adjusting your search filters
                                  </p>
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-base px-3 py-1"
                        >
                          {selectedServices.length} selected
                        </Badge>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t pt-4"></div>

                    {/* Section 2b: Create New Sub-Services */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-700">
                          Create New Sub-Services
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {newSubServiceFields.length} to create
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {newSubServiceFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors space-y-3 bg-white"
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-gray-700">
                                New Sub-Service {index + 1}
                              </p>
                              {newSubServiceFields.length > 0 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Service Select */}
                              <div className="col-span-2 space-y-2">
                                <Label className="text-xs font-medium">
                                  Service
                                </Label>
                                <Controller
                                  name={
                                    `newSubServices.${index}.serviceId` as any
                                  }
                                  control={form.control}
                                  render={({ field }) => {
                                    const selectedService = services.find(
                                      (s) => s.id === field.value,
                                    );
                                    const filteredServices = services.filter(
                                      (service) =>
                                        service.name
                                          .toLowerCase()
                                          .includes(
                                            (
                                              serviceSearch[index] || ""
                                            ).toLowerCase(),
                                          ),
                                    );

                                    return (
                                      <Popover
                                        open={
                                          servicePopoverOpen[index] || false
                                        }
                                        onOpenChange={(open) =>
                                          setServicePopoverOpen((prev) => ({
                                            ...prev,
                                            [index]: open,
                                          }))
                                        }
                                      >
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between bg-white"
                                            disabled
                                          >
                                            <span className="truncate text-left">
                                              {isLoadingServices
                                                ? "Loading services..."
                                                : selectedService
                                                  ? selectedService.name
                                                  : "Select service"}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="p-0 w-167"
                                          align="start"
                                          side="bottom"
                                          sideOffset={4}
                                        >
                                          <Command shouldFilter={false}>
                                            <CommandInput
                                              placeholder="Search service name..."
                                              onValueChange={(value) =>
                                                setServiceSearch((prev) => ({
                                                  ...prev,
                                                  [index]: value,
                                                }))
                                              }
                                              className="h-9 border-b"
                                            />
                                            <CommandList className="max-h-60 overflow-y-auto">
                                              {filteredServices.length === 0 ? (
                                                <CommandEmpty>
                                                  No services found matching "
                                                  {serviceSearch[index] || ""}"
                                                </CommandEmpty>
                                              ) : (
                                                <CommandGroup heading="Services">
                                                  {filteredServices.map(
                                                    (service) => (
                                                      <CommandItem
                                                        key={service.id}
                                                        value={service.id}
                                                        onSelect={() => {
                                                          field.onChange(
                                                            field.value ===
                                                              service.id
                                                              ? ""
                                                              : service.id,
                                                          );
                                                          setServicePopoverOpen(
                                                            (prev) => ({
                                                              ...prev,
                                                              [index]: false,
                                                            }),
                                                          );
                                                          setServiceSearch(
                                                            (prev) => ({
                                                              ...prev,
                                                              [index]: "",
                                                            }),
                                                          );
                                                        }}
                                                      >
                                                        <Check
                                                          className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value ===
                                                              service.id
                                                              ? "opacity-100"
                                                              : "opacity-0",
                                                          )}
                                                        />
                                                        {service.name}
                                                      </CommandItem>
                                                    ),
                                                  )}
                                                </CommandGroup>
                                              )}
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    );
                                  }}
                                />
                              </div>

                              {/* Language Tabs */}
                              <div className="col-span-2 space-y-2">
                                <Tabs
                                  value={
                                    newSubServiceTabIndex[index] ||
                                    languages.find((lang) => lang.isPrimary)
                                      ?.code ||
                                    languages[0]?.code
                                  }
                                  onValueChange={(value) => {
                                    setNewSubServiceTabIndex((prev) => ({
                                      ...prev,
                                      [index]: value,
                                    }));
                                  }}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-xs font-medium">
                                      Name
                                    </Label>
                                    {languages.length > 1 && (
                                      <TabsList className="h-auto bg-transparent border-0 p-0">
                                        {languages.map((lang) => (
                                          <TabsTrigger
                                            key={lang.code}
                                            value={lang.code}
                                            className="text-xs px-2 py-1"
                                          >
                                            {lang.name}
                                          </TabsTrigger>
                                        ))}
                                      </TabsList>
                                    )}
                                  </div>
                                  {languages.map((lang, langIndex) => (
                                    <TabsContent
                                      key={lang.code}
                                      value={lang.code}
                                    >
                                      {lang.isPrimary ? (
                                        <FormField
                                          control={form.control}
                                          name={
                                            `newSubServices.${index}.name` as any
                                          }
                                          render={({ field }) => (
                                            <FormItem className="space-y-2">
                                              <FormControl>
                                                <Input
                                                  placeholder="e.g., Swedish Massage, Hot Stone"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      ) : (
                                        <FormField
                                          control={form.control}
                                          name={
                                            `newSubServices.${index}.translations.${langIndex}.name` as any
                                          }
                                          render={({ field }) => (
                                            <FormItem className="space-y-2">
                                              <FormControl>
                                                <Input
                                                  placeholder="Optional translation"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      )}
                                    </TabsContent>
                                  ))}
                                </Tabs>
                              </div>

                              {/* Duration */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">
                                  Duration (mins)
                                </Label>
                                <Controller
                                  name={
                                    `newSubServices.${index}.durationMinutes` as any
                                  }
                                  control={form.control}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      placeholder="45"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(
                                          e.target.value.toString(),
                                        );
                                      }}
                                    />
                                  )}
                                />
                              </div>

                              {/* Price */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">
                                  Price (THB)
                                </Label>
                                <FormField
                                  name={`newSubServices.${index}.price` as any}
                                  control={form.control}
                                  render={({ field }) => (
                                   <FormItem className="">
                                      <FormLabel className="text-xs font-medium">
                                        Price (THB)
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="500"
                                          step="0.01"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(
                                              e.target.value as string,
                                            );
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      <p className="text-xs text-muted-foreground">
                                        0 is allowed for only package services
                                      </p>
                                    </FormItem>
                                  )}
                                />
                                <p className="text-xs text-muted-foreground">
                                  0 is allowed for only package services
                                </p>
                              </div>

                              {/* Status */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">
                                  Status
                                </Label>
                                <Controller
                                  name={`newSubServices.${index}.status` as any}
                                  control={form.control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="bg-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">
                                          Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                          Inactive
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddNewSubService}
                        className="border-dashed border-2 w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Sub-Service
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Price */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                      3
                    </div>
                    <h3 className="font-semibold text-lg">Package Price</h3>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">
                            Price (THB) <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 1500, 2500, 5000"
                              step="0.01"
                              {...field}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormDescription>
                            Total package price for all customers
                            (auto-calculated from selected services)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 4: Package Images */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                      4
                    </div>
                    <h3 className="font-semibold text-lg">Package Images</h3>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {(imageUrls && imageUrls.length > 0) ||
                    (editingPackageId && editingPackage?.media?.length > 0) ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {/* Show existing package images when editing */}
                          {editingPackageId &&
                            editingPackage?.media &&
                            editingPackage.media.map(
                              (image: any, index: number) =>
                                !removedMediaIds.includes(image.id) && (
                                  <div
                                    key={`existing-${index}`}
                                    className="relative group overflow-hidden rounded-lg"
                                  >
                                    <img
                                      src={image.url}
                                      alt={`Existing ${index + 1}`}
                                      className="w-full h-24 object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRemovedMediaIds([
                                          ...removedMediaIds,
                                          image.id,
                                        ])
                                      }
                                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                      <span className="text-white text-sm font-medium">
                                        Remove
                                      </span>
                                    </button>
                                  </div>
                                ),
                            )}
                          {/* Show newly uploaded images */}
                          {imageUrls.map((image, index) => (
                            <div
                              key={`new-${index}`}
                              className="relative group overflow-hidden rounded-lg"
                            >
                              <img
                                src={image}
                                alt={`Package image ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <span className="text-white text-sm font-medium">
                                  Remove
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload-multiple"
                          />
                          <label htmlFor="image-upload-multiple">
                            <Button asChild variant="outline" size="sm">
                              <span className="cursor-pointer">
                                <Plus className="h-4 w-4 mr-2" />
                                Add More Images
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag or click to upload package images
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload">
                          <Button asChild variant="outline" size="sm">
                            <span className="cursor-pointer">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Upload Images
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Validity Period & Status */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                      5
                    </div>
                    <h3 className="font-semibold text-lg">
                      Validity Period & Status
                    </h3>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">
                              Start Date <span className="text-red-500">*</span>
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal bg-white",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? new Date(
                                          field.value,
                                        ).toLocaleDateString()
                                      : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) =>
                                    field.onChange(
                                      date ? date.toISOString() : "",
                                    )
                                  }
                                  disabled={(date) => {
                                    const isBeforeToday =
                                      date <
                                      new Date(new Date().setHours(0, 0, 0, 0));
                                    const endDate = form.getValues("endDate");
                                    const isAfterEndDate =
                                      endDate && date > new Date(endDate);
                                    return isBeforeToday || !!isAfterEndDate;
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">
                              End Date <span className="text-red-500">*</span>
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal bg-white",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? new Date(
                                          field.value,
                                        ).toLocaleDateString()
                                      : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) =>
                                    field.onChange(
                                      date ? date.toISOString() : "",
                                    )
                                  }
                                  disabled={(date) => {
                                    const isBeforeToday =
                                      date <
                                      new Date(new Date().setHours(0, 0, 0, 0));
                                    const startDate =
                                      form.getValues("startDate");
                                    const isBeforeStartDate =
                                      startDate && date < new Date(startDate);
                                    return isBeforeToday || !!isBeforeStartDate;
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">
                              Status <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white w-full">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Active
                                  </span>
                                </SelectItem>
                                <SelectItem value="inactive">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    Inactive
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex gap-3 justify-end border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {editingPackageId ? "Updating..." : "Creating..."}
                      </>
                    ) : editingPackageId ? (
                      "Update Package"
                    ) : (
                      "Create Package"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>

        <PriceChangeConfirmationDialog
          open={showPriceChangeDialog}
          priceChangeData={priceChangeData}
          pendingFormData={pendingFormData as any}
          editServiceData={{ name: "Package Price" }}
          onConfirm={handlePriceChangeConfirm as any}
          onCancel={handlePriceChangeCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
