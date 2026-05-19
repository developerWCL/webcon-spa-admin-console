"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Plus,
  Trash2,
  Info,
  ImageIcon,
  Upload,
  InfoIcon,
} from "lucide-react";
import {
  CreateServiceSchema,
  CreateServiceFormData,
} from "../../../../../schemas/service.schema";
import { createService, updateService } from "@/actions/service.actions";
import {
  generateMediaUploadUrls,
  uploadImageToS3,
} from "@/actions/media.actions";
import { useLanguages } from "@/hooks/useLanguages";
import { PriceChangeConfirmationDialog } from "./price-change-confirmation-dialog";
import { ServiceCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getBranches } from "@/actions/branch.actions";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddServiceDialogProps {
  categories: ServiceCategory[];
  branchId: string;
  onAddService?: (data: CreateServiceFormData) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editServiceId?: string;
  editServiceData?: any;
}

export const AddServiceDialog = ({
  categories,
  branchId,
  onAddService,
  open,
  onOpenChange,
  editServiceId,
  editServiceData,
}: AddServiceDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [subServiceTabIndex, setSubServiceTabIndex] = useState<
    Record<number, string>
  >({});
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  const [priceChangeConfirm, setPriceChangeConfirm] = useState<{
    show: boolean;
    oldPrices: Record<number, number>;
    newPrices: Record<number, number>;
    newPrice?: number;
  }>({
    show: false,
    oldPrices: {},
    newPrices: {},
  });
  const [pendingFormData, setPendingFormData] =
    useState<CreateServiceFormData | null>(null);
  const [priceChangeAction, setPriceChangeAction] = useState<
    "overwrite" | "keep-custom" | null
  >(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([
    branchId,
  ]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const isEditMode = !!editServiceId;

  // Use controlled open prop if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;

  // Fetch branches on component mount
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

    if (!isEditMode) {
      loadBranches();
    } else {
      setIsLoadingBranches(false);
    }
  }, [isEditMode]);

  // Initialize default translations only when languages are loaded
  const getDefaultTranslations = () => {
    if (languages.length === 0) return [];
    return languages.map((lang) => ({
      languageCode: lang.code,
      name: "",
      description: "",
    }));
  };

  const getDefaultSubServiceTranslations = () => {
    if (languages.length === 0) return [];
    return languages.map((lang) => ({
      languageCode: lang.code,
      name: "",
      description: "",
    }));
  };

  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<CreateServiceFormData>({
    resolver: zodResolver(CreateServiceSchema),
    mode: "onSubmit",
    defaultValues: isEditMode
      ? {
          branchId,
          categoryId: editServiceData?.categoryId || "",
          name: editServiceData?.name || "",
          description: editServiceData?.description || "",
          status: editServiceData?.status || "active",
          maxConcurrentBookings: editServiceData?.maxConcurrentBookings || 0,
          maxBookingsPerDay: editServiceData?.maxBookingsPerDay || 0,
          subServices: editServiceData?.subServices.map((sub: any) => {
            return {
              ...sub,
              translations: sub.translations.map((t: any) => {
                return {
                  languageCode: t.languageCode,
                  name: t.name || "",
                  description: t.description || "",
                };
              }),
            };
          }) || [
            {
              name: "",
              durationMinutes: 45,
              price: 0,
              status: "active",
              translations: getDefaultSubServiceTranslations(),
            },
          ],
          imageUrls: editServiceData?.imageUrls || [],
          translations:
            editServiceData?.translations.map((t: any) => {
              return {
                languageCode: t.languageCode,
                name: t.name || "",
                description: t.description || "",
              };
            }) || getDefaultTranslations(),
        }
      : {
          branchId: selectedBranchIds,
          categoryId: "",
          name: "",
          description: "",
          status: "active",
          maxConcurrentBookings: 1,
          maxBookingsPerDay: 10,
          subServices: [
            {
              name: "",
              durationMinutes: 45,
              price: 0,
              status: "active",
              translations: getDefaultSubServiceTranslations(),
            },
          ],
          imageUrls: [],
          translations: getDefaultTranslations(),
        },
  });

  const imageUrls = watch("imageUrls");
  const translations = watch("translations");
  const subServices = watch("subServices");

  // Reset form when languages first load
  useEffect(() => {
    if (languages.length > 0 && !isEditMode) {
      reset({
        branchId: selectedBranchIds,
        categoryId: "",
        name: "",
        description: "",
        status: "active",
        maxConcurrentBookings: 1,
        maxBookingsPerDay: 10,
        subServices: [
          {
            name: "",
            durationMinutes: 45,
            price: 0,
            status: "active",
            translations: getDefaultSubServiceTranslations(),
          },
        ],
        imageUrls: [],
        translations: getDefaultTranslations(),
      });
    }
  }, [languages.length, isEditMode, branchId, reset]);

  // Update form when in edit mode and editServiceData changes
  useEffect(() => {
    if (isEditMode && editServiceData && isOpen && languages.length > 0) {
      // Map translations to match languages order
      const translationsMap = new Map(
        (editServiceData?.translations || []).map((t: any) => [
          t.languageCode,
          t,
        ]),
      );

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

      // Map subServices translations similarly
      const mappedSubServices = (editServiceData?.subServices || []).map(
        (sub: any) => {
          const subTranslationsMap = new Map(
            (sub.translations || []).map((t: any) => [t.languageCode, t]),
          );

          return {
            ...sub,
            translations: languages.map((lang) => {
              const existing = subTranslationsMap.get(lang.code);
              return (
                existing || {
                  languageCode: lang.code,
                  name: "",
                  description: "",
                }
              );
            }),
          };
        },
      );

      const formData = {
        branchId,
        categoryId: editServiceData?.categoryId || "",
        name: editServiceData?.name || "",
        description: editServiceData?.description || "",
        status: editServiceData?.status || "active",
        maxConcurrentBookings: editServiceData?.maxConcurrentBookings || 0,
        maxBookingsPerDay: editServiceData?.maxBookingsPerDay || 0,
        subServices: mappedSubServices,
        imageUrls: editServiceData?.imageUrls || [],
        translations: mappedTranslations,
      };

      reset(formData);
    }
  }, [isEditMode, editServiceData, isOpen, branchId, reset, languages]);

  // Ensure all translations have languageCode
  useEffect(() => {
    if (translations && Array.isArray(translations) && languages.length > 0) {
      translations.forEach((_, index) => {
        const languageCode = languages[index]?.code;
        if (languageCode && !translations[index]?.languageCode) {
          setValue(`translations.${index}.languageCode`, languageCode);
        }
      });
    }
  }, [languages, translations, setValue]);

  // Ensure all subService translations have languageCode
  useEffect(() => {
    if (subServices && Array.isArray(subServices) && languages.length > 0) {
      subServices.forEach((subService, subServiceIndex) => {
        if (subService.translations && Array.isArray(subService.translations)) {
          subService.translations.forEach((_, translationIndex) => {
            const languageCode = languages[translationIndex]?.code;
            if (
              languageCode &&
              !subService.translations[translationIndex]?.languageCode
            ) {
              setValue(
                `subServices.${subServiceIndex}.translations.${translationIndex}.languageCode`,
                languageCode,
              );
            }
          });
        }
      });
    }
  }, [languages, subServices, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subServices",
  });

  // Check for price changes in edit mode
  const checkPriceChanges = (data: CreateServiceFormData): boolean => {
    if (!isEditMode || !editServiceData?.subServices) {
      return false;
    }

    const oldPrices: Record<number, number> = {};
    const newPrices: Record<number, number> = {};
    let hasPriceChange = false;

    // Compare prices - ensure numeric comparison
    data.subServices?.forEach((newSub, index) => {
      const oldSub = editServiceData.subServices[index];
      if (oldSub) {
        const oldPrice = Number(oldSub.price) || 0;
        const newPrice = Number(newSub.price) || 0;

        // Only mark as changed if prices are different
        if (oldPrice !== newPrice) {
          oldPrices[index] = oldPrice;
          newPrices[index] = newPrice;
          hasPriceChange = true;
        }
      }
    });

    if (hasPriceChange) {
      setPriceChangeConfirm({
        show: true,
        oldPrices,
        newPrices,
      });
    }

    return hasPriceChange;
  };

  // Handle form submission - check for price changes first
  const onSubmit = async (data: CreateServiceFormData) => {
    // Check if price has changed in edit mode
    if (isEditMode && checkPriceChanges(data)) {
      setPendingFormData(data);
      setIsSubmitting(false);
      return;
    }

    // No price change detected or not in edit mode, proceed normally
    await executeSubmit(data, null);
  };

  // Execute the actual form submission
  const executeSubmit = async (
    data: CreateServiceFormData,
    action: "overwrite" | "keep-custom" | null = null,
  ) => {
    setIsSubmitting(true);
    try {
      // Ensure all translations have valid languageCode strings
      // Map translations to ensure they have proper languageCodes
      const translationsWithCodes = data.translations
        .map((t, index) => ({
          ...t,
          languageCode: t.languageCode || languages[index]?.code || "",
        }))
        .filter(
          (t) =>
            t.languageCode &&
            typeof t.languageCode === "string" &&
            t.languageCode.length > 0,
        );

      // Keep all translations with languageCode, even if names are empty
      // This ensures translation records are created for all languages
      const filteredData: CreateServiceFormData = {
        ...data,
        translations: translationsWithCodes,
        subServices:
          data.subServices?.map((sub) => ({
            ...sub,
            translations:
              sub.translations
                ?.map((t, index) => ({
                  ...t,
                  languageCode: t.languageCode || languages[index]?.code || "",
                }))
                .filter(
                  (t) =>
                    t.languageCode &&
                    typeof t.languageCode === "string" &&
                    t.languageCode.length > 0,
                ) || [],
          })) || [],
        mediaIds: [],
        isOverride: action === "overwrite",
      };

      // Step 1: Collect existing media IDs (from editServiceData) + Upload new images to S3
      let mediaIds: string[] = [];

      // In edit mode, start with existing media IDs (excluding removed ones)
      if (
        isEditMode &&
        editServiceData?.media &&
        Array.isArray(editServiceData.media)
      ) {
        mediaIds = editServiceData.media
          .filter((m: any) => !removedMediaIds.includes(m.id))
          .map((m: any) => m.id);
      }

      // Upload new images if any
      if (filteredData.imageUrls && filteredData.imageUrls.length > 0) {
        try {
          // Prepare image metadata
          const imagesToUpload: Array<{
            filename: string;
            mimeType: string;
            size: number;
          }> = [];

          for (let i = 0; i < filteredData.imageUrls.length; i++) {
            try {
              const base64String = filteredData.imageUrls[i];
              if (!base64String) {
                console.warn(`Skipping empty image at index ${i}`);
                continue;
              }
              // Convert base64 to blob to get size
              const blob = base64ToBlob(base64String);
              const filename = `service-image-${i + 1}-${Date.now()}.jpg`;

              imagesToUpload.push({
                filename,
                mimeType: "image/jpeg",
                size: blob.size,
              });
            } catch (error) {
              console.error(`Failed to process image ${i}:`, error);
              throw new Error(
                `Failed to process image ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }

          // Generate presigned URLs (no serviceId needed)
          if (imagesToUpload.length > 0) {
            let uploadUrls;
            try {
              uploadUrls = await generateMediaUploadUrls(imagesToUpload);
            } catch (error) {
              console.error("Failed to generate upload URLs:", error);
              throw new Error(
                `Failed to generate upload URLs: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }

            // Validate response structure
            if (!uploadUrls || !Array.isArray(uploadUrls)) {
              console.error("Invalid upload URLs response:", uploadUrls);
              throw new Error(
                "Invalid response from server: expected array of upload URLs",
              );
            }

            // Upload each image to S3
            for (let i = 0; i < filteredData.imageUrls.length; i++) {
              try {
                const base64String = filteredData.imageUrls[i];
                if (!base64String) continue;

                const blob = base64ToBlob(base64String);
                const uploadUrl = uploadUrls[i];

                if (!uploadUrl || !uploadUrl.url || !uploadUrl.mediaId) {
                  console.error(`Invalid upload URL at index ${i}:`, uploadUrl);
                  throw new Error(
                    `Invalid upload URL received for image ${i + 1}`,
                  );
                }

                // Convert blob to ArrayBuffer for server action transmission
                const arrayBuffer = await blob.arrayBuffer();
                await uploadImageToS3(uploadUrl.url, arrayBuffer, "image/jpeg");
                mediaIds.push(uploadUrl.mediaId);
              } catch (error) {
                console.error(`Failed to upload image ${i}:`, error);
                throw new Error(
                  `Failed to upload image ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
                );
              }
            }
          }
        } catch (error) {
          console.error("Image upload process error:", error);
          throw error;
        }
      }

      // Step 2: Create or update service with mediaIds
      const finalData = {
        ...filteredData,
        mediaIds,
        imageUrls: [], // Clear imageUrls as we're now using mediaIds
      };

      if (isEditMode && editServiceId) {
        const response = await updateService(editServiceId, finalData);
        toast.success("Service updated successfully!", {
          description: `${data.name} has been updated.`,
        });
        onAddService?.(response);
      } else {
        // Create service with selectedBranchIds in create mode
        const response = await createService(
          branchId,
          selectedBranchIds,
          finalData,
        );
        toast.success("Service created successfully!", {
          description: `${data.name} has been added to your services.`,
        });
        onAddService?.(response);
      }

      reset();
      setRemovedMediaIds([]);
      setInternalOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create service:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Please try again.";

      // Provide specific error messages for different failure types
      const isImageError =
        errorMessage.includes("image") ||
        errorMessage.includes("upload") ||
        errorMessage.includes("URL");

      toast.error(
        isImageError
          ? "Failed to process images"
          : isEditMode
            ? "Failed to update service"
            : "Failed to create service",
        {
          description: errorMessage,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64String: string): Blob => {
    try {
      const arr = base64String.split(",");
      if (!arr[1]) {
        throw new Error("Invalid base64 string format");
      }
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      throw new Error(
        `Failed to process image: ${error instanceof Error ? error.message : "Invalid image data"}`,
      );
    }
  };

  const handleAddVariant = () => {
    append({
      name: "",
      durationMinutes: 45,
      price: 0,
      status: "active",
      translations: getDefaultSubServiceTranslations(),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentImages = watch("imageUrls") || [];
      const MAX_IMAGES = 5;
      const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes

      // Check if adding these files would exceed the limit
      if (currentImages.length + files.length > MAX_IMAGES) {
        toast.error("Image limit exceeded", {
          description: `You can upload a maximum of ${MAX_IMAGES} images. You already have ${currentImages.length} image(s).`,
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
          const updatedImages = watch("imageUrls") || [];
          setValue("imageUrls", [...updatedImages, base64String]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = watch("imageUrls") || [];
    setValue(
      "imageUrls",
      currentImages.filter((_, i) => i !== index),
    );
  };

  const handlePriceChangeConfirm = (
    formData: CreateServiceFormData,
    action: "overwrite" | "keep-custom",
  ) => {
    setPriceChangeConfirm({
      show: false,
      oldPrices: {},
      newPrices: {},
    });
    setPendingFormData(null);
    executeSubmit(formData, action);
  };

  const handlePriceChangeCancel = () => {
    setPriceChangeConfirm({
      show: false,
      oldPrices: {},
      newPrices: {},
    });
    setPendingFormData(null);
  };

  return (
    <>
      <PriceChangeConfirmationDialog
        open={priceChangeConfirm.show}
        priceChangeData={{
          oldPrices: priceChangeConfirm.oldPrices,
          newPrices: priceChangeConfirm.newPrices,
        }}
        pendingFormData={pendingFormData}
        editServiceData={editServiceData}
        onConfirm={handlePriceChangeConfirm}
        onCancel={handlePriceChangeCancel}
      />

      {!isEditMode && (
        <Button onClick={() => setInternalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      )}
      <Dialog
        open={isOpen}
        onOpenChange={(newOpen) => {
          setInternalOpen(newOpen);
          if (onOpenChange) {
            onOpenChange(newOpen);
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          style={{ width: "90vw", maxWidth: "800px" }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {isEditMode ? "Edit Service" : "Create New Service"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update spa service details, pricing, variants, and multi-language support"
                : "Add a new spa service with pricing, variants, and multi-language support"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingLanguages && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoadingLanguages && (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Tip: Start with basic information
                  </p>
                  <p>
                    You can add variants and translations to reach more
                    customers
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info with Translations */}
                <div className="space-y-4">
                  <Tabs
                    defaultValue={
                      languages.find((lang) => lang.isPrimary)?.code ||
                      languages[0]?.code
                    }
                    className="w-full"
                  >
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                          1
                        </div>
                        <h3 className="font-semibold text-lg">
                          Basic Information
                        </h3>
                      </div>
                      <TabsList className="grid grid-cols-2">
                        {languages.map((lang) => (
                          <TabsTrigger key={lang.code} value={lang.code}>
                            {lang.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    {languages.map((lang, index) => (
                      <TabsContent
                        value={lang.code}
                        key={lang.code}
                        className="space-y-4 mt-4"
                      >
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="name" className="font-medium">
                            Service Name{" "}
                            {lang.isPrimary ? (
                              <span className="text-red-500">*</span>
                            ) : (
                              <span className="text-gray-400">(Optional)</span>
                            )}
                          </Label>
                          <Input
                            id="name"
                            placeholder={
                              lang.isPrimary
                                ? "e.g., Relaxing Thai Massage"
                                : "Optional translation"
                            }
                            {...register(
                              lang.isPrimary
                                ? "name"
                                : `translations.${index}.name`,
                            )}
                            className={
                              lang.isPrimary && errors.name
                                ? "border-red-500"
                                : ""
                            }
                            onChange={(e) => {
                              if (lang.isPrimary) {
                                setValue("name", e.target.value);
                                setValue(
                                  `translations.${index}.name`,
                                  e.target.value,
                                );
                              } else {
                                setValue(
                                  `translations.${index}.name`,
                                  e.target.value,
                                );
                              }
                            }}
                          />
                          {lang.isPrimary && errors.name && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="description" className="font-medium">
                            Description{" "}
                            <span className="text-gray-400">(Optional)</span>
                          </Label>
                          <Textarea
                            id="description"
                            placeholder={
                              lang.isPrimary
                                ? "Describe what makes this service special..."
                                : "Optional translation"
                            }
                            {...register(
                              lang.isPrimary
                                ? "description"
                                : `translations.${index}.description`,
                            )}
                            className="h-24"
                            onChange={(e) => {
                              if (lang.isPrimary) {
                                setValue("description", e.target.value);
                                setValue(
                                  `translations.${index}.description`,
                                  e.target.value,
                                );
                              } else {
                                setValue(
                                  `translations.${index}.description`,
                                  e.target.value,
                                );
                              }
                            }}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Branch Multi-Select (Create Mode Only) */}
                  {!isEditMode && (
                    <div className="space-y-2">
                      <Label htmlFor="branchIds" className="font-medium">
                        Select Branches <span className="text-red-500">*</span>
                      </Label>
                      <MultiSelect
                        items={branches}
                        disableItems={[branchId]}
                        selectedIds={selectedBranchIds}
                        onSelectionChange={setSelectedBranchIds}
                        placeholder="Select one or more branches..."
                        searchPlaceholder="Search branches..."
                        emptyMessage="No branches found."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This service will be created for all selected branches
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId" className="font-medium">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="categoryId"
                        control={control}
                        rules={{ required: "Category is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              className={`bg-white w-full ${errors.categoryId ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => {
                                const primaryLang = languages.find(
                                  (lang) => lang.isPrimary,
                                );
                                const translatedName =
                                  cat.translations?.find(
                                    (t) => t.languageCode === primaryLang?.code,
                                  )?.name || cat.name;

                                return (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {translatedName}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.categoryId && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.categoryId.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="font-medium">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="bg-white w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxConcurrentBookings"
                        className="font-medium"
                      >
                        Max Concurrent Bookings
                      </Label>
                      <Input
                        id="maxConcurrentBookings"
                        type="number"
                        min="0"
                        {...register("maxConcurrentBookings", {
                          valueAsNumber: true,
                        })}
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How many customers can book this service at the same
                        slot duration have set.{" "}
                        <span className="font-medium">(0 = unlimited)</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="maxBookingsPerDay"
                        className="font-medium"
                      >
                        Max Bookings Per Day
                      </Label>
                      <Input
                        id="maxBookingsPerDay"
                        type="number"
                        min="0"
                        {...register("maxBookingsPerDay", {
                          valueAsNumber: true,
                        })}
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum bookings allowed daily •{" "}
                        <span className="font-medium">0 = unlimited</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Service Images</h3>
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {(imageUrls && imageUrls.length > 0) ||
                    (isEditMode && editServiceData?.media?.length > 0) ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {/* Show existing service images when editing */}
                          {isEditMode &&
                            editServiceData?.media &&
                            editServiceData.media.map(
                              (image: any, index: number) =>
                                !removedMediaIds.includes(image.id) && (
                                  <div
                                    key={`existing-${index}`}
                                    className="relative group"
                                  >
                                    <img
                                      src={image.url}
                                      alt={`Existing ${index + 1}`}
                                      className="w-full h-32 object-cover rounded border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRemovedMediaIds([
                                          ...removedMediaIds,
                                          image.id,
                                        ])
                                      }
                                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Click to remove image"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ),
                            )}
                          {/* Show newly uploaded images */}
                          {imageUrls.map((image, index) => (
                            <div
                              key={`new-${index}`}
                              className="relative group"
                            >
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
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
                              <span>
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
                          Drag or click to upload service images
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
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Images
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Variants (Sub-Services) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                      2
                    </div>
                    <h3 className="font-semibold text-lg">Service Variants</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {fields.length} variant{fields.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    Create different options (e.g., different durations) for
                    this service
                  </p>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors space-y-3 bg-white"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-700 ">
                            Variant {index + 1}
                            <Badge
                              variant="default"
                              className={`ml-2 px-2 py-1 rounded-full ${
                                editServiceData?.subServices?.[index]
                                  ?.onlyPackage
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {editServiceData?.subServices?.[index]
                                ?.onlyPackage
                                ? "Package Only"
                                : "General"}
                            </Badge>
                          </p>

                          {fields.length > 1 && (
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
                          <div className="space-y-2">
                            <Tabs
                              value={
                                subServiceTabIndex[index] ||
                                languages.find((lang) => lang.isPrimary)
                                  ?.code ||
                                languages[0]?.code
                              }
                              onValueChange={(value) => {
                                setSubServiceTabIndex((prev) => ({
                                  ...prev,
                                  [index]: value,
                                }));
                              }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs font-medium">
                                  Name{" "}
                                </Label>
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
                              </div>
                              {languages.map((lang, langIndex) => {
                                return (
                                  <TabsContent
                                    key={lang.code}
                                    value={lang.code}
                                  >
                                    <div className="space-y-2">
                                      {lang.isPrimary ? (
                                        <Controller
                                          name={`subServices.${index}.name`}
                                          control={control}
                                          rules={{
                                            required:
                                              "Variant name is required",
                                          }}
                                          render={({ field }) => (
                                            <Input
                                              placeholder="e.g., 45 minutes"
                                              {...field}
                                              className={
                                                errors.subServices?.[index]
                                                  ?.name
                                                  ? "border-red-500"
                                                  : ""
                                              }
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(value);
                                                // Sync to primary language translation
                                                setValue(
                                                  `subServices.${index}.translations.${langIndex}.name`,
                                                  value,
                                                );
                                              }}
                                            />
                                          )}
                                        />
                                      ) : (
                                        <Controller
                                          name={`subServices.${index}.translations.${langIndex}.name`}
                                          control={control}
                                          render={({ field }) => (
                                            <Input
                                              placeholder="Optional translation"
                                              {...field}
                                            />
                                          )}
                                        />
                                      )}
                                      {lang.isPrimary &&
                                        errors.subServices?.[index]?.name && (
                                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {
                                              errors.subServices[index]?.name
                                                ?.message
                                            }
                                          </p>
                                        )}
                                    </div>
                                  </TabsContent>
                                );
                              })}
                            </Tabs>
                          </div>

                          <div className="space-y-2 ">
                            <div className="flex items-center gap-2 mt-1">
                              <Label className="text-xs font-medium">
                                Duration (min)
                              </Label>
                            </div>
                            <Input
                              type="number"
                              placeholder="45"
                              {...register(
                                `subServices.${index}.durationMinutes`,
                                {
                                  valueAsNumber: true,
                                },
                              )}
                              className="mt-3.5"
                            />
                            {errors.subServices?.[index]?.durationMinutes && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.subServices[index]?.durationMinutes
                                    ?.message
                                }
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">
                              Price (THB)
                            </Label>
                            <Input
                              type="number"
                              placeholder="600"
                              {...register(`subServices.${index}.price`, {
                                valueAsNumber: true,
                              })}
                            />
                            {errors.subServices?.[index]?.price && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.subServices[index]?.price?.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">
                              Status
                            </Label>
                            <Controller
                              name={`subServices.${index}.status`}
                              control={control}
                              render={({ field }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="text-sm w-full">
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
                    onClick={handleAddVariant}
                    className="border-dashed border-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Variant
                  </Button>
                </div>
              </form>

              <DialogFooter className="flex gap-3 justify-end border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInternalOpen(false);
                    if (onOpenChange) {
                      onOpenChange(false);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className={isSubmitting ? "opacity-75" : ""}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </div>
                  ) : isEditMode ? (
                    "Update Service"
                  ) : (
                    "Create Service"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
