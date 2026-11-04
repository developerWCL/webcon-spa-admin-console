import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  PromotionFormData,
  PromotionSchema,
  PromotionGuestType,
  ActiveDayWithTime,
} from "@/schemas/promotion.schema";
import {
  createPromotion,
  getPromotionById,
  updatePromotion,
} from "@/actions/promotion.actions";
import { getServices } from "@/actions/service.actions";
import { getPackages } from "@/actions/package.actions";
import { getProgrammesAction } from "@/actions/programme.action";
import { normalizeActiveDays } from "@/utils/promotion.utils";
import {
  generateMediaUploadUrls,
  uploadImageToS3,
} from "@/actions/media.actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { Promotion } from "@/types/models/promotion";
import { ImageIcon, Upload, Trash2, Plus, Loader } from "lucide-react";

interface AddPromotionDialogProps {
  open: boolean;
  onClose: () => void;
  setOpen: (open: boolean) => void;
  selectedPromotionId: string | null;
  refreshPromotions: () => void;
}

const AddPromotionDialog: React.FC<AddPromotionDialogProps> = ({
  open,
  onClose,
  setOpen,
  selectedPromotionId,
  refreshPromotions,
}) => {
  const params = useParams();
  const branchId = params.branchId as string;

  // State for fetched data
  const [services, setServices] = React.useState<any[]>([]);
  const [packages, setPackages] = React.useState<any[]>([]);
  const [programmes, setProgrammes] = React.useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = React.useState(false);
  const [isLoadingPromotion, setIsLoadingPromotion] = React.useState(false);
  const [selectedPromotion, setSelectedPromotion] =
    React.useState<Promotion | null>(null);

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(PromotionSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      startDate: "",
      endDate: "",
      minPurchaseAmount: "",
      maxUsed: undefined,
      activeDays: [
        { day: "mon", allDay: true },
        { day: "tue", allDay: true },
        { day: "wed", allDay: true },
        { day: "thu", allDay: true },
        { day: "fri", allDay: true },
        { day: "sat", allDay: true },
        { day: "sun", allDay: true },
      ],
      branchId: "",
      status: "active",
      imageUrls: [],
      mediaIds: [],
      serviceIds: [],
      packageIds: [],
      programmeIds: [],
      maxUsedPerAccount: undefined,
      guestType: "all_guests",
    },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [removedMediaIds, setRemovedMediaIds] = React.useState<string[]>([]);
console.log("form", form.formState.errors);
  // Fetch services, packages, and programmes
  useEffect(() => {
    if (!open || !branchId) return;

    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        const [servicesData, packagesData, programmesData] = await Promise.all([
          getServices(branchId, 1, 100),
          getPackages(branchId, 1, 100),
          getProgrammesAction(branchId, { limit: 100, page: 1 }),
        ]);

        setServices(
          (servicesData?.data || servicesData || []).map((item: any) => ({
            id: item.id,
            name: item.name,
          })),
        );
        setPackages(
          (packagesData?.data || packagesData || []).map((item: any) => ({
            id: item.id,
            name: item.name,
          })),
        );
        setProgrammes(
          (programmesData?.data?.data || programmesData || []).map(
            (item: any) => ({
              id: item.id,
              name: item.name,
            }),
          ),
        );
      } catch (error) {
        console.error("Failed to fetch items:", error);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchItems();
  }, [open, branchId]);

  const handleClose = () => {
    form.reset();
    setOpen(false);
    onClose();
  };

  useEffect(() => {
    if (selectedPromotionId) {
      const fetchPromotion = async () => {
        setIsLoadingPromotion(true);
        try {
          const promotion = await getPromotionById(selectedPromotionId);
          setSelectedPromotion(promotion);
        } catch (error) {
          console.error("Failed to fetch promotion:", error);
          toast.error("Failed to load promotion");
        } finally {
          setIsLoadingPromotion(false);
        }
      };
      fetchPromotion();
    } else {
      setSelectedPromotion(null);
    }
  }, [selectedPromotionId]);

  useEffect(() => {
    if (selectedPromotion && selectedPromotion.id) {
      const normalizedDays = normalizeActiveDays(selectedPromotion.activeDays);
      const promotionData = selectedPromotion as any;
      const serviceIds = (promotionData.services || [])
        .map((s: any) => s.service?.id || s.id)
        .filter(Boolean);
      const packageIds = (promotionData.packages || [])
        .map((p: any) => p.package?.id || p.id)
        .filter(Boolean);
      const programmeIds = (promotionData.programmes || [])
        .map((pr: any) => pr.programme?.id || pr.id)
        .filter(Boolean);

      form.reset({
        code: selectedPromotion.code,
        name: selectedPromotion.name,
        description: selectedPromotion.description || "",
        discountType: selectedPromotion.discountType,
        discountValue: String(selectedPromotion.discountValue),
        startDate: selectedPromotion.startDate,
        endDate: selectedPromotion.endDate,
        minPurchaseAmount: String(selectedPromotion.minPurchaseAmount || ""),
        maxUsed: selectedPromotion.maxUsed,
        maxUsedPerAccount: selectedPromotion.maxUsedPerAccount,
        guestType: selectedPromotion.guestType || "all_guests",
        activeDays: normalizedDays,
        branchId: selectedPromotion.branch.id,
        status: selectedPromotion.status,
        imageUrls: [],
        mediaIds: [],
        serviceIds,
        packageIds,
        programmeIds,
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
        minPurchaseAmount: "",
        maxUsed: undefined,
        maxUsedPerAccount: undefined,
        guestType: "all_guests",
        activeDays: [
          { day: "mon", allDay: true },
          { day: "tue", allDay: true },
          { day: "wed", allDay: true },
          { day: "thu", allDay: true },
          { day: "fri", allDay: true },
          { day: "sat", allDay: true },
          { day: "sun", allDay: true },
        ],
        branchId: "",
        status: "active",
        imageUrls: [],
        mediaIds: [],
        serviceIds: services.map((s) => s.id),
        packageIds: packages.map((p) => p.id),
        programmeIds: programmes.map((pr) => pr.id),
      });
    }
  }, [selectedPromotion, form, services, packages, programmes]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentImages = form.watch("imageUrls") || [];
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
          const updatedImages = form.watch("imageUrls") || [];
          form.setValue("imageUrls", [...updatedImages, base64String]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.watch("imageUrls") || [];
    form.setValue(
      "imageUrls",
      currentImages.filter((_, i) => i !== index),
    );
  };

  const handleRemoveExistingMedia = (mediaId: string) => {
    setRemovedMediaIds([...removedMediaIds, mediaId]);
  };

  const onSubmit = async (data: PromotionFormData) => {
    try {
      setIsSubmitting(true);

      // Step 1: Handle image uploads
      let mediaIds: string[] = [];

      // In edit mode, start with existing media IDs (excluding removed ones)
      if (selectedPromotion?.media && Array.isArray(selectedPromotion.media)) {
        mediaIds = selectedPromotion.media
          .filter((m: any) => !removedMediaIds.includes(m.id))
          .map((m: any) => m.id);
      }

      // Upload new images if any
      if (data.imageUrls && data.imageUrls.length > 0) {
        try {
          // Prepare image metadata
          const imagesToUpload: Array<{
            filename: string;
            mimeType: string;
            size: number;
          }> = [];

          for (let i = 0; i < data.imageUrls.length; i++) {
            try {
              const base64String = data.imageUrls[i];
              if (!base64String) {
                console.warn(`Skipping empty image at index ${i}`);
                continue;
              }
              // Convert base64 to blob to get size
              const blob = base64ToBlob(base64String);
              const filename = `promotion-image-${i + 1}-${Date.now()}.jpg`;

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
            for (let i = 0; i < data.imageUrls.length; i++) {
              try {
                const base64String = data.imageUrls[i];
                if (!base64String) continue;

                const blob = base64ToBlob(base64String);
                const uploadUrl = uploadUrls[i];

                if (!uploadUrl || !uploadUrl.url || !uploadUrl.mediaId) {
                  console.error(`Invalid upload URL at index ${i}:`, uploadUrl);
                  throw new Error(
                    `Invalid upload URL received for image ${i + 1}`,
                  );
                }

                // Upload directly to S3 from client using presigned URL
                const response = await fetch(uploadUrl.url, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "image/jpeg",
                  },
                  body: blob,
                });

                if (!response.ok) {
                  throw new Error(
                    `S3 upload failed with status ${response.status}`,
                  );
                }

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

      // Step 2: Create or update promotion with mediaIds
      const finalData = {
        ...data,
        mediaIds,
        imageUrls: [], // Clear imageUrls as we're now using mediaIds
      };

      if (selectedPromotion) {
        await updatePromotion(selectedPromotion.id, finalData);
        toast.success("Offer updated successfully");
      } else {
        await createPromotion(branchId, finalData);
        toast.success("Offer created successfully");
      }
      handleClose();
      refreshPromotions();
    } catch (error) {
      console.error("Promotion submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      // Provide specific error messages for different failure types
      const isImageError =
        errorMessage.includes("image") ||
        errorMessage.includes("upload") ||
        errorMessage.includes("URL");

      toast.error(
        isImageError
          ? "Failed to process images"
          : selectedPromotion
            ? "Failed to update offer"
            : "Failed to create offer",
        {
          description: errorMessage,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ width: "90vw", maxWidth: "800px" }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {selectedPromotion ? "Edit Offer" : "Create Offer"}
          </DialogTitle>
          <DialogDescription>
            {selectedPromotion
              ? "Edit the details of your offer"
              : "Create a discount code or offer for your services"}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoadingPromotion && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading promotion details...
            </p>
          </div>
        )}

        {/* Info Tip Box */}
        {!isLoadingPromotion && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <span className="w-5 h-5 text-blue-600 shrink-0 mt-0.5">💡</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tip: Boost your bookings</p>
              <p>
                {selectedPromotion
                  ? "Update your promotion details to keep your offers fresh and attractive."
                  : "Create special offers to attract more guests and reward loyal customers."}
              </p>
            </div>
          </div>
        )}

        {!isLoadingPromotion && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Offer Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Summer Special"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Discount Type{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="bg-white w-full">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">
                                  Percentage
                                </SelectItem>
                                <SelectItem value="fixed">
                                  Fixed Amount
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Value</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="20"
                              {...field}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Offer Code <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SUMMER20"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the promotion..."
                            {...field}
                            className="bg-white h-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Offer Images</h3>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {(form.watch("imageUrls") &&
                    form.watch("imageUrls")!.length > 0) ||
                  (selectedPromotion?.media &&
                    selectedPromotion.media.filter(
                      (m: any) => !removedMediaIds.includes(m.id),
                    ).length > 0) ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Show existing promotion images when editing */}
                        {selectedPromotion?.media &&
                          selectedPromotion.media.map(
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
                                      handleRemoveExistingMedia(image.id)
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
                        {form.watch("imageUrls")!.map((image, index) => (
                          <div key={`new-${index}`} className="relative group">
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
                        Drag or click to upload offer images
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

              {/* Section 2: Validity Period & Conditions */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Validity & Conditions
                    </h3>
                    <p className="text-xs text-muted-foreground mt-3 col-span-2">
                      Choose the date when customers typically come to receive
                      your services. The promotion will only apply on these
                      selected dates.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-x-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>

                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full justify-start text-left font-normal bg-white" +
                                    (!field.value
                                      ? " text-muted-foreground"
                                      : "")
                                  }
                                >
                                  {field.value
                                    ? format(
                                        new Date(field.value),
                                        "yyyy-MM-dd",
                                      )
                                    : "Pick a date"}
                                </Button>
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
                                  onSelect={(date) => {
                                    field.onChange(
                                      date ? format(date, "yyyy-MM-dd") : "",
                                    );
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full justify-start text-left font-normal bg-white" +
                                    (!field.value
                                      ? " text-muted-foreground"
                                      : "")
                                  }
                                >
                                  {field.value
                                    ? format(
                                        new Date(field.value),
                                        "yyyy-MM-dd",
                                      )
                                    : "Pick a date"}
                                </Button>
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
                                  onSelect={(date) => {
                                    field.onChange(
                                      date ? format(date, "yyyy-MM-dd") : "",
                                    );
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minPurchaseAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Purchase (THB)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1000"
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
                      name="maxUsed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Limit (0 for unlimited)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                              className="bg-white"
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                field.onChange(
                                  isNaN(value) ? undefined : value,
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="guestType"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === "authenticated_only"}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked ? "authenticated_only" : "all_guests",
                              );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer font-normal">
                          Authenticated Guests Only
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {form.watch("guestType") === "authenticated_only" && (
                    <FormField
                      control={form.control}
                      name="maxUsedPerAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Per Account Limit (0 for unlimited)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              {...field}
                              className="bg-white"
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                field.onChange(
                                  isNaN(value) ? undefined : value,
                                );
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Limits how many times each customer can use this
                            promotion
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="activeDays"
                    key={`activeDays-${selectedPromotion?.id || "new"}`}
                    render={({ field }) => {
                      // Watch for changes to ensure re-render
                      const watchedActiveDays = form.watch("activeDays");
                      return (
                        <FormItem>
                          <FormLabel>Active Days & Times</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Select which days (booking day) the promotion is
                            active. For each day, choose "All Day" or set
                            specific times.
                          </p>
                          <FormControl>
                            <div className="space-y-4">
                              {[
                                { value: "mon", label: "Monday" },
                                { value: "tue", label: "Tuesday" },
                                { value: "wed", label: "Wednesday" },
                                { value: "thu", label: "Thursday" },
                                { value: "fri", label: "Friday" },
                                { value: "sat", label: "Saturday" },
                                { value: "sun", label: "Sunday" },
                              ].map((dayOption) => {
                                const dayData = (watchedActiveDays || [])?.find(
                                  (d: ActiveDayWithTime) =>
                                    d.day === dayOption.value,
                                ) as ActiveDayWithTime | undefined;
                                const isActive = !!dayData;

                                return (
                                  <div
                                    key={dayOption.value}
                                    className="border rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                          checked={isActive}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              field.onChange([
                                                ...(field.value || []),
                                                {
                                                  day: dayOption.value,
                                                  allDay: true,
                                                },
                                              ]);
                                            } else {
                                              field.onChange(
                                                (field.value || []).filter(
                                                  (d: ActiveDayWithTime) =>
                                                    d.day !== dayOption.value,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                        <span className="font-medium text-sm">
                                          {dayOption.label}
                                        </span>
                                      </label>
                                    </div>

                                    {isActive && (
                                      <div className="ml-6 space-y-3 bg-white p-3 rounded-md border border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            checked={dayData?.allDay || false}
                                            onCheckedChange={(checked) => {
                                              const updatedDays = (
                                                field.value || []
                                              ).map((d: ActiveDayWithTime) =>
                                                d.day === dayOption.value
                                                  ? {
                                                      ...d,
                                                      allDay: !!checked,
                                                    }
                                                  : d,
                                              );
                                              field.onChange(updatedDays);
                                            }}
                                          />
                                          <Label className="text-xs font-medium cursor-pointer">
                                            All Day
                                          </Label>
                                        </div>

                                        {!dayData?.allDay && (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label className="text-xs text-muted-foreground mb-1 block">
                                                Start Time
                                              </Label>
                                              <Input
                                                type="time"
                                                value={dayData?.startTime || ""}
                                                onChange={(e) => {
                                                  const updatedDays = (
                                                    field.value || []
                                                  ).map(
                                                    (d: ActiveDayWithTime) =>
                                                      d.day === dayOption.value
                                                        ? {
                                                            ...d,
                                                            startTime:
                                                              e.target.value,
                                                          }
                                                        : d,
                                                  );
                                                  field.onChange(updatedDays);
                                                }}
                                                className="bg-white h-8 text-sm"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs text-muted-foreground mb-1 block">
                                                End Time
                                              </Label>
                                              <Input
                                                type="time"
                                                value={dayData?.endTime || ""}
                                                onChange={(e) => {
                                                  const updatedDays = (
                                                    field.value || []
                                                  ).map(
                                                    (d: ActiveDayWithTime) =>
                                                      d.day === dayOption.value
                                                        ? {
                                                            ...d,
                                                            endTime:
                                                              e.target.value,
                                                          }
                                                        : d,
                                                  );
                                                  field.onChange(updatedDays);
                                                }}
                                                className="bg-white h-8 text-sm"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Section 3: Apply to Services, Packages & Programmes */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Apply to Services, Packages & Programmes
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select which services, packages, or programmes this
                      promotion can be applied to. Leave empty to apply to all.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <FormField
                    control={form.control}
                    name="serviceIds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Services (Optional)</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={() => {
                              const currentSelection = field.value || [];
                              if (currentSelection.length === services.length) {
                                field.onChange([]);
                              } else {
                                field.onChange(services.map((s) => s.id));
                              }
                            }}
                          >
                            {(field.value || []).length === services.length &&
                            services.length > 0
                              ? "Clear All"
                              : "Select All"}
                          </Button>
                        </div>
                        <FormControl>
                          <MultiSelect
                            items={services}
                            selectedIds={field.value || []}
                            onSelectionChange={field.onChange}
                            placeholder="Select services..."
                            searchPlaceholder="Search services..."
                            emptyMessage="No services available"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageIds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Packages (Optional)</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={() => {
                              const currentSelection = field.value || [];
                              if (currentSelection.length === packages.length) {
                                field.onChange([]);
                              } else {
                                field.onChange(packages.map((p) => p.id));
                              }
                            }}
                          >
                            {(field.value || []).length === packages.length &&
                            packages.length > 0
                              ? "Clear All"
                              : "Select All"}
                          </Button>
                        </div>
                        <FormControl>
                          <MultiSelect
                            items={packages}
                            selectedIds={field.value || []}
                            onSelectionChange={field.onChange}
                            placeholder="Select packages..."
                            searchPlaceholder="Search packages..."
                            emptyMessage="No packages available"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="programmeIds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Programmes (Optional)</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={() => {
                              const currentSelection = field.value || [];
                              if (
                                currentSelection.length === programmes.length
                              ) {
                                field.onChange([]);
                              } else {
                                field.onChange(programmes.map((pr) => pr.id));
                              }
                            }}
                          >
                            {(field.value || []).length === programmes.length &&
                            programmes.length > 0
                              ? "Clear All"
                              : "Select All"}
                          </Button>
                        </div>
                        <FormControl>
                          <MultiSelect
                            items={programmes}
                            selectedIds={field.value || []}
                            onSelectionChange={field.onChange}
                            placeholder="Select programmes..."
                            searchPlaceholder="Search programmes..."
                            emptyMessage="No programmes available"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-3 justify-end border-t pt-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoadingPromotion}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting || isLoadingPromotion}
                >
                  {isLoadingPromotion
                    ? "Loading..."
                    : isSubmitting
                      ? selectedPromotion
                        ? "Updating..."
                        : "Creating..."
                      : selectedPromotion
                        ? "Update Offer"
                        : "Create Offer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPromotionDialog;
