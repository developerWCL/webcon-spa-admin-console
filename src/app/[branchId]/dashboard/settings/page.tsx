"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PaypalIntegration from "./_components/PaypalIntegration";
import { getBranchById, updateBranch } from "@/actions/branch.actions";
import { toast } from "sonner";
import { generateMediaUploadUrls, uploadImageToS3 } from "@/actions/media.actions";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useSession } from "next-auth/react";

// Validation Schemas
const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  phone: z.string(),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  website: z.string().url("Invalid website URL"),
});

const operatingHoursSchema = z.object({
  monday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
  tuesday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
  wednesday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
  thursday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
  friday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
  saturday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
  sunday: z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  }),
});

const bookingSettingsSchema = z.object({
  maxConcurrentBookings: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .optional(),
  emailNotificationThreshold: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .optional(),
  preBookingDay: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .optional(),
});

type OperatingHourRecord = {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;
type OperatingHoursFormData = z.infer<typeof operatingHoursSchema>;
type BookingSettingsFormData = z.infer<typeof bookingSettingsSchema>;

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const dayKeys = days.map(
  (d) => d.toLowerCase() as keyof OperatingHoursFormData,
);

export default function SettingsPage() {
  const params = useParams();
  const branchId = params?.branchId as string;
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const {data: session} = useSession();
  
  const businessForm = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: "",
      phone: "",
      email: "",
      address: "",
      website: "https://",
    },
  });

  const hoursForm = useForm<OperatingHoursFormData>({
    resolver: zodResolver(operatingHoursSchema),
    defaultValues: {
      monday: { start: "09:00", end: "20:00", enabled: true },
      tuesday: { start: "09:00", end: "20:00", enabled: true },
      wednesday: { start: "09:00", end: "20:00", enabled: true },
      thursday: { start: "09:00", end: "20:00", enabled: true },
      friday: { start: "09:00", end: "20:00", enabled: true },
      saturday: { start: "09:00", end: "20:00", enabled: true },
      sunday: { start: "09:00", end: "20:00", enabled: false },
    },
  });

  const bookingSettingsForm = useForm<BookingSettingsFormData>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: {
      maxConcurrentBookings: 0,
      emailNotificationThreshold: 0,
      preBookingDay: 0,
    },
  });
async function loadBranchData() {
      if (!branchId) return;

      setIsLoading(true);
      try {
        const result = await getBranchById(branchId);

        if (result.success && result.data) {
          const branch = result.data;

          // Update business form with branch data
          businessForm.reset({
            businessName: branch.name || "",
            phone: branch.phone || "",
            email: branch.email || "",
            address: branch.location || "",
            website: branch.website || "https://",
          });

          // Update booking settings form
          bookingSettingsForm.reset({
            maxConcurrentBookings: branch.maxConcurrentBookings || 0,
            emailNotificationThreshold: branch.emailNotificationThreshold || 0,
            preBookingDay: branch.preBookingDay || 0,
          });

          // Initialize with all days disabled by default
          const hoursData: OperatingHoursFormData = {
            monday: { start: "09:00", end: "20:00", enabled: false },
            tuesday: { start: "09:00", end: "20:00", enabled: false },
            wednesday: { start: "09:00", end: "20:00", enabled: false },
            thursday: { start: "09:00", end: "20:00", enabled: false },
            friday: { start: "09:00", end: "20:00", enabled: false },
            saturday: { start: "09:00", end: "20:00", enabled: false },
            sunday: { start: "09:00", end: "20:00", enabled: false },
          };

          // Map API operating hours to form structure
          // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const dayOfWeekMap: Record<number, keyof OperatingHoursFormData> = {
            1: "monday",
            2: "tuesday",
            3: "wednesday",
            4: "thursday",
            5: "friday",
            6: "saturday",
            0: "sunday",
          };

          if (Array.isArray(branch.operatingHours)) {
            branch.operatingHours.forEach((hours: OperatingHourRecord) => {
              const dayKey = dayOfWeekMap[hours.dayOfWeek];
              if (dayKey) {
                // Convert time from HH:MM:SS to HH:MM format
                const openTime = hours.openTime.substring(0, 5);
                const closeTime = hours.closeTime.substring(0, 5);

                hoursData[dayKey] = {
                  start: openTime,
                  end: closeTime,
                  enabled: true,
                };
              }
            });
          }

          hoursForm.reset(hoursData);
        } else {
          setSubmitMessage(result.error || "Failed to load branch data");
        }
      } catch (error) {
        setSubmitMessage("Error loading branch data");
        console.error("Error loading branch:", error);
      } finally {
        setIsLoading(false);
      }
    }
  useEffect(() => {
    

    loadBranchData();
  }, [branchId, businessForm, hoursForm]);

  const onBusinessSubmit = async (data: BusinessInfoFormData) => {
    try {
      setIsUploadingImage(true);
      // Prepare media IDs (keep existing ones and remove deleted ones)
      let mediaIds: string[] = [];

      // Keep existing media IDs (excluding removed ones)
      if (existingMedia.length > 0) {
        mediaIds = existingMedia
          .filter((m) => !removedMediaIds.includes(m.id))
          .map((m) => m.id);
      }

      // Upload new image if selected
      if (selectedFile) {
        try {
          // Generate upload URL
          const uploadUrls = await generateMediaUploadUrls([
            {
              filename: selectedFile.name,
              mimeType: selectedFile.type,
              size: selectedFile.size,
            },
          ]);

          if (!uploadUrls || !Array.isArray(uploadUrls) || uploadUrls.length === 0) {
            toast.error("Failed to generate upload URL");
            return;
          }

          const uploadUrl = uploadUrls[0];

          if (!uploadUrl || !uploadUrl.url || !uploadUrl.mediaId) {
            toast.error("Invalid upload URL received");
            return;
          }

          // Convert file to array buffer
          const arrayBuffer = await selectedFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const fileArray = Array.from(uint8Array);

          // Upload to S3
          await uploadImageToS3(uploadUrl.url, fileArray, selectedFile.type);
          mediaIds.push(uploadUrl.mediaId);
          setSelectedFile(null);
          await loadBranchData();
          setExistingMedia((prev) => [{ id: uploadUrl.mediaId, url: URL.createObjectURL(selectedFile) }]);
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error(error instanceof Error ? error.message : "Error uploading image");
          throw error;
        }
      }

      const result = await updateBranch(branchId, {
        name: data.businessName,
        phone: data.phone,
        email: data.email,
        location: data.address,
        website: data.website,
        mediaIds: mediaIds,
      });

      if (result.success) {
        setSubmitMessage("Business information saved successfully!");
        setRemovedMediaIds([]);
        toast.success("Business information saved successfully!");
      } else {
        setSubmitMessage(result.error || "Error saving business information");
        toast.error(result.error || "Error saving business information");
      }
    } catch (error) {
      setSubmitMessage("Error saving business information");
      console.error("Error:", error);
      toast.error("Error saving business information");
    } finally {
      setIsUploadingImage(false);
    }
  };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Only take the first file
    const file = files[0];
    setSelectedFile(file);
    toast.success("Image selected. Click 'Save Changes' to upload.");

    // Reset file input
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemoveImage = (mediaId: string) => {
    if (mediaId === "selected") {
      setSelectedFile(null);
    } else if (existingMedia.some((m) => m.id === mediaId)) {
      setRemovedMediaIds((prev) => [...prev, mediaId]);
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    }
  };

  const onHoursSubmit = async (data: OperatingHoursFormData) => {
    try {
      // Transform form structure to API structure
      const dayToWeekDay: Record<keyof OperatingHoursFormData, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };

      const operatingHours: OperatingHourRecord[] = Object.entries(data)
        .filter(([, hours]) => hours.enabled)
        .map(([day, hours]) => ({
          dayOfWeek: dayToWeekDay[day as keyof OperatingHoursFormData],
          openTime: `${hours.start}:00`,
          closeTime: `${hours.end}:00`,
        }));

      const result = await updateBranch(branchId, {
        operatingHours,
      });

      if (result.success) {
        setSubmitMessage("Operating hours saved successfully!");
        toast.success("Operating hours saved successfully!");
      } else {
        setSubmitMessage(result.error || "Error saving operating hours");
        toast.error(result.error || "Error saving operating hours");
      }
    } catch (error) {
      setSubmitMessage("Error saving operating hours");
      console.error("Error:", error);
      toast.error("Error saving operating hours");
    }
  };

  const onBookingSettingsSubmit = async (data: BookingSettingsFormData) => {
    try {
      const result = await updateBranch(branchId, {
        maxConcurrentBookings: data.maxConcurrentBookings,
        emailNotificationThreshold: data.emailNotificationThreshold,
        preBookingDay: data.preBookingDay,
      });

      if (result.success) {
        setSubmitMessage("Booking settings saved successfully!");
        toast.success("Booking settings saved successfully!");
      } else {
        setSubmitMessage(result.error || "Error saving booking settings");
        toast.error(result.error || "Error saving booking settings");
      }
    } catch (error) {
      setSubmitMessage("Error saving booking settings");
      console.error("Error:", error);
      toast.error("Error saving booking settings");
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {"Settings"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {"Manage your spa system configuration and preferences"}
        </p>
      </div>
      {/* {submitMessage && (
        <div className="p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
          {submitMessage}
        </div>
      )} */}
      {isLoading && (
        <div className="p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
          Loading branch information...
        </div>
      )}
      {/* Business Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>{"Business Information"}</CardTitle>
          <CardDescription>{"Your spa business details"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={businessForm.handleSubmit(onBusinessSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="businessName">{"Business Name"}</Label>
              <Input
                id="businessName"
                disabled={isLoading}
                {...businessForm.register("businessName")}
                placeholder="Enter business name"
              />
              {businessForm.formState.errors.businessName && (
                <p className="text-sm text-red-500">
                  {businessForm.formState.errors.businessName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{"Phone Number"}</Label>
              <Input
                id="phone"
                disabled={isLoading}
                {...businessForm.register("phone")}
                placeholder="+1-555-0100"
              />
              {businessForm.formState.errors.phone && (
                <p className="text-sm text-red-500">
                  {businessForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{"Email Address"}</Label>
              <Input
                id="email"
                type="email"
                disabled={isLoading}
                {...businessForm.register("email")}
                placeholder="contact@serenityspa.com"
              />
              {businessForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {businessForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{"Address"}</Label>
              <textarea
                id="address"
                disabled={isLoading}
                {...businessForm.register("address")}
                className="w-full min-h-20 px-3 py-2 text-sm rounded-md border border-input bg-background"
                placeholder="Enter your address"
              />
              {businessForm.formState.errors.address && (
                <p className="text-sm text-red-500">
                  {businessForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">{"Website"}</Label>
              <Input
                id="website"
                disabled={isLoading}
                {...businessForm.register("website")}
                placeholder="https://serenityspa.com"
              />
              {businessForm.formState.errors.website && (
                <p className="text-sm text-red-500">
                  {businessForm.formState.errors.website.message}
                </p>
              )}
            </div>
              <div className="space-y-2">
              <Label>{"Business Images"}</Label>
              <div className="flex flex-col gap-4">
               

                {/* Existing Media Display */}
                {existingMedia.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {existingMedia.map((media) => (
                      <div
                        key={media.id}
                        className="relative group rounded-lg overflow-hidden border border-input bg-muted aspect-square"
                      >
                        <Image
                          src={media.url}
                          alt="Branch image"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(media.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ): (
                  <>
                  {!selectedFile && (<div className="relative">
                  <Input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    disabled={isLoading || isUploadingImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md bg-background cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{"Upload Image"}</span>
                  </label>
                </div>)}
                  </>
                )
                }

                {/* Selected Image Preview */}
                {selectedFile && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div className="relative group rounded-lg overflow-hidden border border-input bg-muted aspect-square">
                      <Image
                        src={URL.createObjectURL(selectedFile)}
                        alt="Selected image preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium text-center px-2 truncate">{selectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage("selected")}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={businessForm.formState.isSubmitting || isLoading}
            >
              {businessForm.formState.isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {/* Operating Hours Form */}
      <Card>
        <CardHeader>
          <CardTitle>{"Operating Hours"}</CardTitle>
          <CardDescription>{"Set your business hours"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={hoursForm.handleSubmit(onHoursSubmit)}
            className="space-y-4"
          >
            {dayKeys.map((dayKey, index) => (
              <div key={dayKey} className="flex items-center gap-4">
                <div className="w-28">
                  <Label>{days[index]}</Label>
                </div>
                <Input
                  type="time"
                  disabled={isLoading}
                  {...hoursForm.register(`${dayKey}.start`)}
                  className="w-32"
                />
                <span className="text-muted-foreground">{"to"}</span>
                <Input
                  type="time"
                  disabled={isLoading}
                  {...hoursForm.register(`${dayKey}.end`)}
                  className="w-32"
                />
                <Switch
                  disabled={isLoading}
                  checked={hoursForm.watch(`${dayKey}.enabled`)}
                  onCheckedChange={(checked) =>
                    hoursForm.setValue(`${dayKey}.enabled`, checked)
                  }
                />
              </div>
            ))}

            <Button
              type="submit"
              disabled={hoursForm.formState.isSubmitting || isLoading}
            >
              {hoursForm.formState.isSubmitting ? "Saving..." : "Save Hours"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {/* Booking Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>{"Booking Settings"}</CardTitle>
          <CardDescription>{"Configure booking capacity and notifications"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={bookingSettingsForm.handleSubmit(onBookingSettingsSubmit)}
            className="space-y-4"
          >
             <div className="space-y-2">
              <Label htmlFor="preBookingDay">{"Pre Booking Time (Days)"}</Label>
              <Input
                id="preBookingDay"
                type="number"
                min="0"
                disabled={isLoading}
                {...bookingSettingsForm.register("preBookingDay", {
                  valueAsNumber: true,
                })}
                placeholder="Enter pre booking time in days"
              />
              <p className="text-xs text-muted-foreground">
                {"Number of days in advance a booking can be made"}
              </p>
              {bookingSettingsForm.formState.errors.preBookingDay && (
                <p className="text-sm text-red-500">
                  {bookingSettingsForm.formState.errors.preBookingDay.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailNotificationThreshold">{"Send Email At (Bookings)"}</Label>
              <Input
                id="emailNotificationThreshold"
                type="number"
                min="0"
                disabled={isLoading}
                {...bookingSettingsForm.register("emailNotificationThreshold", {
                  valueAsNumber: true,
                })}
                placeholder="Enter booking count to send notification"
              />
              <p className="text-xs text-muted-foreground">
                {"Email will be sent to the branch email when concurrent bookings reach this number"}
              </p>
              {bookingSettingsForm.formState.errors.emailNotificationThreshold && (
                <p className="text-sm text-red-500">
                  {bookingSettingsForm.formState.errors.emailNotificationThreshold.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={bookingSettingsForm.formState.isSubmitting || isLoading}
            >
              {bookingSettingsForm.formState.isSubmitting
                ? "Saving..."
                : "Save Booking Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
     {(session?.user?.email === "admin@spa.local" || session?.user?.email === "developer@webconnection.asia") && (
        <PaypalIntegration/>
      )}
    </div>
  );
}
