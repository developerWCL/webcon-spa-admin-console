"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createProgrammeAction,
  updateProgrammeAction,
} from "../../../../../actions/programme.action";
import {
  generateMediaUploadUrls,
  uploadImageToS3,
} from "@/actions/media.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguages } from "@/hooks/useLanguages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Upload,
  ImageIcon,
  X,
  ListOrdered,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ProgrammeFormData,
  programmeFormSchema,
  ProgrammeStep,
  programmeStepSchema,
} from "@/schemas/programme.schema";
import { PriceChangeConfirmationDialog } from "../../services/_components/price-change-confirmation-dialog";

interface CreateProgrammeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultData?: {
    id: string | number;
    name: string;
    description: string;
    price: number;
    status: "active" | "inactive";
    maxConcurrentBookings?: number;
    maxBookingsPerDay?: number;
    steps: Array<{
      id: string | number;
      title: string;
      description: string;
      duration: string;
    }>;
    translations?: Array<{
      languageCode: string;
      name: string;
      description: string;
    }>;
    media?: Array<{
      id: string;
      url: string;
    }>;
  } | null;
  onSubmit?: () => void;
}

export const CreateProgrammeDialog = ({
  open,
  onOpenChange,
  defaultData,
  onSubmit: onSubmitCallback,
}: CreateProgrammeDialogProps) => {
  // Hooks
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  const params = useParams();
  const branchId = params.branchId as string;

  // Form state with React Hook Form
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProgrammeFormData>({
    resolver: zodResolver(programmeFormSchema),
    defaultValues: {
      price: "",
      status: "active",
      imageUrls: [],
      translations: [],
      maxBookingsPerDay: "",
      maxConcurrentBookings: "",
    },
  });

  const formData = watch();

  const [programmeSteps, setProgrammeSteps] = useState<ProgrammeStep[]>([]);
  const [stepTabIndex, setStepTabIndex] = useState<
    Record<string | number, string>
  >({});
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [showPriceChangeDialog, setShowPriceChangeDialog] = useState(false);
  const [priceChangeData, setPriceChangeData] = useState<{
    oldPrices: Record<number, number>;
    newPrices: Record<number, number>;
  }>({ oldPrices: {}, newPrices: {} });
  const [pendingFormData, setPendingFormData] =
    useState<ProgrammeFormData | null>(null);
  const [priceChangeAction, setPriceChangeAction] = useState<
    "overwrite" | "keep-custom" | null
  >(null);

  // Load default data when dialog opens
  useEffect(() => {
    if (open && defaultData) {
      reset({
        price: defaultData.price.toString(),
        status: defaultData.status,
        maxConcurrentBookings:
          defaultData.maxConcurrentBookings?.toString() || "",
        maxBookingsPerDay: defaultData.maxBookingsPerDay?.toString() || "",
        imageUrls: [], // New images will be added via upload, existing ones shown separately
        translations: defaultData.translations || [],
      });
      setProgrammeSteps(
        (defaultData.steps || []).map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          duration: step.duration,
          translations: languages.map((lang) => {
            const translation = (step as any)?.translations?.find(
              (t: any) => t.languageCode === lang.code,
            );
            return {
              languageCode: lang.code,
              title: translation?.title || "",
              description: translation?.description || "",
            };
          }),
        })),
      );
    } else if (open && !defaultData) {
      // Reset for new programme
      reset({
        price: "",
        status: "active",
        imageUrls: [],
        translations: [],
      });
      setProgrammeSteps([]);
    }
  }, [open, defaultData, languages, reset]);

  // Initialize translations when languages load or dialog opens
  useEffect(() => {
    if (open && languages.length > 0 && !defaultData) {
      const initialTranslations = languages.map((lang) => ({
        languageCode: lang.code,
        name: "",
        description: "",
      }));
      setValue("translations", initialTranslations);
    }
  }, [open, languages, defaultData, setValue]);

  // Detect price changes when editing
  useEffect(() => {
    if (open && defaultData && formData.price) {
      const oldPrice = defaultData.price;
      const newPrice = parseFloat(formData.price);
      if (Math.abs(oldPrice - newPrice) > 0.01) {
        setPriceChangeData({
          oldPrices: { 0: oldPrice },
          newPrices: { 0: newPrice },
        });
      }
    }
  }, [formData.price, open, defaultData]);

  // Initialize step tab indices when languages load
  useEffect(() => {
    if (languages.length > 0) {
      const newTabIndex: Record<string | number, string> = {};
      const defaultLang =
        languages.find((lang) => lang.isPrimary)?.code || languages[0]?.code;

      programmeSteps.forEach((step) => {
        if (!stepTabIndex[step.id]) {
          newTabIndex[step.id] = defaultLang;
        }

        // Ensure step has translations
        if (!step.translations || step.translations.length === 0) {
          setProgrammeSteps((prev) =>
            prev.map((s) =>
              s.id === step.id
                ? {
                    ...s,
                    translations: languages.map((lang) => ({
                      languageCode: lang.code,
                      title: "",
                      description: "",
                    })),
                  }
                : s,
            ),
          );
        }
      });

      if (Object.keys(newTabIndex).length > 0) {
        setStepTabIndex((prev) => ({ ...prev, ...newTabIndex }));
      }
    }
  }, [languages]);

  const handleAddStep = () => {
    const newStep: ProgrammeStep = {
      id: Date.now().toString(),
      title: "",
      description: "",
      duration: "",
      translations: languages.map((lang) => ({
        languageCode: lang.code,
        title: "",
        description: "",
      })),
    };
    setProgrammeSteps([...programmeSteps, newStep]);
    const defaultLang =
      languages.find((lang) => lang.isPrimary)?.code || languages[0]?.code;
    setStepTabIndex((prev) => ({ ...prev, [newStep.id]: defaultLang }));
  };

  const handleRemoveStep = (id: string | number) => {
    setProgrammeSteps(programmeSteps.filter((step) => step.id !== id));
  };

  const handleUpdateStep = (
    id: string | number,
    field: string,
    value: string,
    langCode?: string,
  ) => {
    // Get primary language - fallback to first language if primary not found
    const primaryLang = languages.find((lang) => lang.isPrimary);
    const primaryLangCode = primaryLang?.code || languages[0]?.code;

    setProgrammeSteps(
      programmeSteps.map((step) => {
        if (step.id === id) {
          if (langCode && (field === "title" || field === "description")) {
            // Update translation
            const updatedTranslations = step.translations.map((t) =>
              t.languageCode === langCode ? { ...t, [field]: value } : t,
            );

            // If updating primary language, also update base field
            if (langCode === primaryLangCode && primaryLangCode) {
              return {
                ...step,
                [field]: value,
                translations: updatedTranslations,
              };
            }

            return {
              ...step,
              translations: updatedTranslations,
            };
          } else {
            // Update base field (duration)
            return { ...step, [field]: value };
          }
        }
        return step;
      }),
    );
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...programmeSteps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];
      setProgrammeSteps(newSteps);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentImages = formData.imageUrls || [];
      const MAX_IMAGES = 8;
      const MAX_FILE_SIZE = 500 * 1024; // 500 KB in bytes

      // Check if adding these files would exceed the limit
      if (currentImages.length + files.length > MAX_IMAGES) {
        toast.error(
          `Image limit exceeded. You can upload a maximum of ${MAX_IMAGES} images. You already have ${currentImages.length} image(s).`,
        );
        return;
      }

      Array.from(files).forEach((file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(
            `File "${file.name}" is too large. Maximum file size is 500 KB. Your file is ${(file.size / 1024).toFixed(2)} KB.`,
          );
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          const updatedImages = formData.imageUrls || [];
          const newImages = [...updatedImages, base64String];
          setValue("imageUrls", newImages);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number, mediaId?: string) => {
    // Track removed media IDs if in edit mode
    if (mediaId) {
      setRemovedMediaIds((prev) => [...prev, mediaId]);
    }
    const newImages = (formData.imageUrls || []).filter((_, i) => i !== index);
    setValue("imageUrls", newImages);
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

  const onSubmit = async (data: ProgrammeFormData) => {
    try {
      // Check for price changes in edit mode
      if (defaultData && formData.price) {
        const oldPrice = defaultData.price;
        const newPrice = parseFloat(formData.price);
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
    } catch (error) {
      console.error("[ERROR] Error submitting programme:", error);
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
          : "Failed to create programme",
        {
          description: errorMessage,
        },
      );
    }
  };

  const performSubmit = async (data: ProgrammeFormData) => {
    // Validate steps
    if (programmeSteps.length === 0) {
      toast.error("At least one programme step is required");
      return;
    }

    // Sanitize steps - convert null descriptions to empty strings before validation
    const sanitizedSteps = programmeSteps.map((step) => ({
      ...step,
      description: step.description ?? "",
      translations: (step.translations || []).map((t) => ({
        languageCode: t.languageCode,
        title: t.title ?? "",
        description: t.description ?? "",
      })),
    }));

    // Validate each step with Zod schema
    const stepsValidation = z
      .array(programmeStepSchema)
      .safeParse(sanitizedSteps);
    if (!stepsValidation.success) {
      const errors = stepsValidation.error.errors;
      console.error("[DEBUG] Step validation errors:", errors);
      const errorMessages = errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n");
      toast.error(`Step validation failed:\n${errorMessages}`);
      return;
    }

    // Transform steps data to match backend DTO
    const stepsData = sanitizedSteps.map((step) => {
      // Get primary language translation
      const primaryLang =
        languages.find((lang) => lang.isPrimary) || languages[0];
      const primaryTranslation = step.translations.find(
        (t) => t.languageCode === primaryLang?.code,
      );

      // Filter translations to only include those with a title
      const filteredTranslations = step.translations
        .filter((translation) => translation.title.trim().length > 0)
        .map((translation) => ({
          languageCode: translation.languageCode,
          title: translation.title,
          description: translation.description,
        }));

      return {
        ...(typeof step.id === "string" && { id: step.id }),
        title: primaryTranslation?.title || step.title || "",
        description: primaryTranslation?.description || step.description || "",
        duration: step.duration,
        translations: filteredTranslations,
      };
    });

    // Get primary language translation for name/description
    const primaryLang2 =
      languages.find((lang) => lang.isPrimary) || languages[0];
    const primaryTranslation2 = data.translations.find(
      (t) => t.languageCode === primaryLang2.code,
    );

    if (!primaryTranslation2 || !primaryTranslation2.name.trim()) {
      toast.error(`Primary language (${primaryLang2.name}) name is required`);
      return;
    }

    // Step 1: Collect existing media IDs (from defaultData) + Upload new images to S3
    let mediaIds: string[] = [];

    // In edit mode, start with existing media IDs (excluding removed ones)
    if (defaultData && defaultData.media && Array.isArray(defaultData.media)) {
      mediaIds = defaultData.media
        .filter((m: any) => !removedMediaIds.includes(m.id))
        .map((m: any) => m.id);
    }

    // Upload new images if any
    if (formData.imageUrls && formData.imageUrls.length > 0) {
      try {
        // Prepare image metadata
        const imagesToUpload: Array<{
          filename: string;
          mimeType: string;
          size: number;
        }> = [];

        for (let i = 0; i < formData.imageUrls.length; i++) {
          try {
            const base64String = formData.imageUrls[i];
            if (!base64String) {
              console.warn(`Skipping empty image at index ${i}`);
              continue;
            }
            // Convert base64 to blob to get size
            const blob = base64ToBlob(base64String);
            const filename = `programme-image-${i + 1}-${Date.now()}.jpg`;

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

        // Generate presigned URLs
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
          for (let i = 0; i < formData.imageUrls.length; i++) {
            try {
              const base64String = formData.imageUrls[i];
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
              const uint8Array = new Uint8Array(arrayBuffer);
              const fileArray = Array.from(uint8Array);
              await uploadImageToS3(uploadUrl.url, fileArray, "image/jpeg");
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

    // Build the API payload
    // Filter translations to only include those with a name
    const filteredTranslations = data.translations
      .filter((translation) => translation.name.trim().length > 0)
      .map((translation) => ({
        languageCode: translation.languageCode,
        name: translation.name,
        description: translation.description || "",
      }));

    const payload = {
      branchId,
      name: primaryTranslation2.name,
      description: primaryTranslation2.description,
      price: parseFloat(data.price),
      status: data.status,
      maxConcurrentBookings: data.maxConcurrentBookings
        ? parseInt(data.maxConcurrentBookings)
        : undefined,
      maxBookingsPerDay: data.maxBookingsPerDay
        ? parseInt(data.maxBookingsPerDay)
        : undefined,
      translations: filteredTranslations,
      steps: stepsData,
      mediaIds,
    };

    // Call appropriate server action based on mode
    const result = defaultData
      ? await updateProgrammeAction({
          ...payload,
          id: defaultData.id as string,
          isOverride: priceChangeAction === "overwrite" ? true : false,
        })
      : await createProgrammeAction(payload);

    if (!result.success) {
      throw new Error(result.error || result.message);
    }
    if (onSubmitCallback) onSubmitCallback();
    toast.success(result.message);
    onOpenChange(false);
    document.body.style.pointerEvents = "auto";
    // Reset form
    reset({
      price: "",
      status: "active",
      imageUrls: [],
      translations: languages.map((lang) => ({
        languageCode: lang.code,
        name: "",
        description: "",
      })),
    });
    setProgrammeSteps([]);
    setStepTabIndex({});
    setRemovedMediaIds([]);
  };

  // Handler for price change confirmation
  const handlePriceChangeConfirm = async (
    formData: ProgrammeFormData,
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
        className="max-h-[90vh] overflow-y-auto"
        style={{ width: "90vw", maxWidth: "800px" }}
        onInteractOutside={(e) => {
          const hasPointerEventsNone =
            document.body.style.pointerEvents === "none";
          if (hasPointerEventsNone) {
            document.body.style.pointerEvents = "auto";
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {defaultData ? "Edit Programme" : "Create New Programme"}
          </DialogTitle>
          <DialogDescription>
            {defaultData
              ? "Update the programme details and steps"
              : "Create a multi-step treatment programme with sequential steps and detailed information"}
          </DialogDescription>
        </DialogHeader>

        {/* Info Tip Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <Upload className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              Tip: Build your programme step by step
            </p>
            <p>
              Create a structured sequence of treatments to guide clients
              through their wellness journey
            </p>
          </div>
        </div>

        {isLoadingLanguages && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoadingLanguages && (
          <>
            <form className="space-y-6">
              {/* Basic Information with Translations */}
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
                      className="space-y-4 mt-4"
                      key={lang.code}
                    >
                      <div className="col-span-2 space-y-2">
                        <Label
                          htmlFor={`name-${lang.code}`}
                          className="font-medium"
                        >
                          Programme Name{" "}
                          {lang.isPrimary && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Controller
                          name={`translations.${formData.translations.findIndex((t) => t.languageCode === lang.code)}.name`}
                          control={control}
                          render={({ field, fieldState: { error } }) => {
                            const primaryLang = languages.find(
                              (l) => l.isPrimary,
                            );
                            const isPrimaryEmpty =
                              lang.isPrimary &&
                              !formData.translations
                                .find((t) => t.languageCode === lang.code)
                                ?.name.trim();
                            return (
                              <>
                                <Input
                                  id={`name-${lang.code}`}
                                  placeholder={
                                    lang.isPrimary
                                      ? "e.g., Weight Loss Journey"
                                      : "Optional translation"
                                  }
                                  {...field}
                                  className={
                                    error ||
                                    (isPrimaryEmpty && errors.translations)
                                      ? "border-red-500"
                                      : ""
                                  }
                                />
                                {error && (
                                  <p className="text-sm text-red-500">
                                    {error.message}
                                  </p>
                                )}
                                {isPrimaryEmpty && errors.translations && (
                                  <p className="text-sm text-red-500">
                                    Primary language ({primaryLang?.name}) name
                                    is required
                                  </p>
                                )}
                              </>
                            );
                          }}
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label
                          htmlFor={`description-${lang.code}`}
                          className="font-medium"
                        >
                          Description{" "}
                          {/* {lang.isPrimary && (
                            <span className="text-red-500">*</span>
                          )} */}
                        </Label>
                        <Controller
                          name={`translations.${formData.translations.findIndex((t) => t.languageCode === lang.code)}.description`}
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <>
                              <Textarea
                                id={`description-${lang.code}`}
                                placeholder={
                                  lang.isPrimary
                                    ? "Describe the programme and its benefits for clients..."
                                    : "Optional translation"
                                }
                                rows={3}
                                {...field}
                                className={error ? "border-red-500" : ""}
                              />
                              {error && (
                                <p className="text-sm text-red-500">
                                  {error.message}
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="font-medium">
                      Price (THB) <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="price"
                          type="number"
                          placeholder="15000"
                          {...field}
                          className={
                            errors.price
                              ? "border-red-500 bg-gray-50"
                              : "bg-gray-50"
                          }
                        />
                      )}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">
                        {errors.price.message}
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
                    <Controller
                      name="maxConcurrentBookings"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="maxConcurrentBookings"
                          type="number"
                          placeholder="e.g., 5"
                          {...field}
                          className={
                            errors.maxConcurrentBookings
                              ? "border-red-500 bg-gray-50"
                              : "bg-gray-50"
                          }
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      How many customers can book this programme at the same
                      slot duration have set. Enter 0 for unlimited concurrent
                      bookings
                    </p>
                    {errors.maxConcurrentBookings && (
                      <p className="text-sm text-red-500">
                        {errors.maxConcurrentBookings.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBookingsPerDay" className="font-medium">
                      Max Bookings Per Day
                    </Label>
                    <Controller
                      name="maxBookingsPerDay"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="maxBookingsPerDay"
                          type="number"
                          placeholder="e.g., 10"
                          {...field}
                          className={
                            errors.maxBookingsPerDay
                              ? "border-red-500 bg-gray-50"
                              : "bg-gray-50"
                          }
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter 0 for unlimited bookings per day
                    </p>
                    {errors.maxBookingsPerDay && (
                      <p className="text-sm text-red-500">
                        {errors.maxBookingsPerDay.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Programme Image */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-semibold text-lg">Programme Images</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {formData.imageUrls?.length || 0}/8 images
                  </span>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6">
                  {(formData.imageUrls && formData.imageUrls.length > 0) ||
                  (defaultData &&
                    defaultData.media &&
                    defaultData.media.length > 0) ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Show existing images when editing */}
                        {defaultData &&
                          defaultData.media &&
                          defaultData.media.map(
                            (image: any, index: number) =>
                              !removedMediaIds.includes(image.id) && (
                                <div
                                  key={`existing-${index}`}
                                  className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                                >
                                  <img
                                    src={image.url}
                                    alt={`Existing programme image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveImage(index, image.id)
                                    }
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ),
                          )}
                        {/* Show newly uploaded images */}
                        {formData.imageUrls.map((image, index) => (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                          >
                            <img
                              src={image}
                              alt={`Programme image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {formData.imageUrls.length < 8 && (
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
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              type="button"
                            >
                              <span>
                                <Plus className="h-4 w-4 mr-2" />
                                Add More Images
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag or click to upload programme images
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Maximum 8 images, each up to 500 KB
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
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          type="button"
                        >
                          <span>
                            <Plus className="h-4 w-4 mr-2" />
                            Upload Images
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Programme Steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                      3
                    </div>
                    <h3 className="font-semibold text-lg">Programme Steps</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {programmeSteps.length} step
                      {programmeSteps.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddStep}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Step
                  </Button>
                </div>

                {programmeSteps.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
                    <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No steps added yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "Add Step" to create your programme sequence
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {programmeSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors space-y-3 bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex flex-col gap-1 pt-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveStep(index, "up")}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveStep(index, "down")}
                                disabled={index === programmeSteps.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm">
                              {index + 1}
                            </div>

                            <div className="flex-1 space-y-3">
                              <Tabs
                                value={
                                  stepTabIndex[step.id] ||
                                  languages[0]?.code ||
                                  ""
                                }
                                onValueChange={(value) =>
                                  setStepTabIndex((prev) => ({
                                    ...prev,
                                    [step.id]: value,
                                  }))
                                }
                              >
                                <TabsList className="h-auto bg-transparent border-0 p-0">
                                  {languages.map((lang) => (
                                    <TabsTrigger
                                      key={lang.code}
                                      value={lang.code}
                                    >
                                      {lang.code.toUpperCase()}
                                    </TabsTrigger>
                                  ))}
                                </TabsList>

                                {languages.map((lang) => (
                                  <TabsContent
                                    key={`step-${step.id}-${lang.code}`}
                                    value={lang.code}
                                    className="space-y-3 mt-3"
                                  >
                                    <Input
                                      placeholder={
                                        lang.isPrimary
                                          ? "Step title"
                                          : "Optional translation"
                                      }
                                      value={
                                        step.translations?.find(
                                          (t) => t.languageCode === lang.code,
                                        )?.title || ""
                                      }
                                      onChange={(e) =>
                                        handleUpdateStep(
                                          step.id,
                                          "title",
                                          e.target.value,
                                          lang.code,
                                        )
                                      }
                                      className="bg-gray-50"
                                    />
                                    <Textarea
                                      placeholder={
                                        lang.isPrimary
                                          ? "Step description"
                                          : "Optional translation"
                                      }
                                      rows={2}
                                      value={
                                        step.translations?.find(
                                          (t) => t.languageCode === lang.code,
                                        )?.description || ""
                                      }
                                      onChange={(e) =>
                                        handleUpdateStep(
                                          step.id,
                                          "description",
                                          e.target.value,
                                          lang.code,
                                        )
                                      }
                                      className="bg-gray-50"
                                    />
                                  </TabsContent>
                                ))}
                              </Tabs>

                              <Input
                                placeholder="Duration (e.g., 60)"
                                value={step.duration}
                                onChange={(e) => {
                                  if (isNaN(Number(e.target.value))) return;
                                  handleUpdateStep(
                                    step.id,
                                    "duration",
                                    e.target.value,
                                  );
                                }}
                                className="bg-gray-50"
                              />
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStep(step.id)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </>
        )}

        <DialogFooter className="flex gap-3 justify-end border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isLoadingLanguages}
          >
            {isSubmitting
              ? defaultData
                ? "Updating..."
                : "Creating..."
              : defaultData
                ? "Update Programme"
                : "Create Programme"}
          </Button>
        </DialogFooter>

        <PriceChangeConfirmationDialog
          open={showPriceChangeDialog}
          priceChangeData={priceChangeData}
          pendingFormData={pendingFormData as any}
          editServiceData={{ name: "Programme Price" }}
          onConfirm={handlePriceChangeConfirm as any}
          onCancel={handlePriceChangeCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
