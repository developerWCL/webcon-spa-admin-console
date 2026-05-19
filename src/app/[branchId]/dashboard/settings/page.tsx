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

  useEffect(() => {
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

    loadBranchData();
  }, [branchId, businessForm, hoursForm]);

  const onBusinessSubmit = async (data: BusinessInfoFormData) => {
    try {
      const result = await updateBranch(branchId, {
        name: data.businessName,
        phone: data.phone,
        email: data.email,
        location: data.address,
        website: data.website,
      });

      if (result.success) {
        setSubmitMessage("Business information saved successfully!");
        toast.success("Business information saved successfully!");
      } else {
        setSubmitMessage(result.error || "Error saving business information");
        toast.error(result.error || "Error saving business information");
      }
    } catch (error) {
      setSubmitMessage("Error saving business information");
      console.error("Error:", error);
      toast.error("Error saving business information");
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
    </div>
  );
}
