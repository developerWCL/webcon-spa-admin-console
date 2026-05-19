"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Guest } from "@/actions/customer.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Country, getCountries } from "@/actions/countries";

// Zod schema for guest validation
export const editGuestSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format"),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  nationality: z.string().optional().nullable(),
  specialRequest: z.string().optional().nullable(),
});

export type EditGuestFormData = z.infer<typeof editGuestSchema>;

interface EditGuestDialogProps {
  guest: Guest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customerId: string, data: EditGuestFormData) => Promise<void>;
  isLoading?: boolean;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function EditGuestDialog({
  guest,
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: EditGuestDialogProps) {
  const [openNationalityPopover, setOpenNationalityPopover] =
    React.useState(false);
  const [COUNTRIES, setCOUNTRIES] = React.useState<Country[]>([]);

  const form = useForm<EditGuestFormData>({
    resolver: zodResolver(editGuestSchema),
    defaultValues: {
      firstName: guest?.firstName || "",
      lastName: guest?.lastName || "",
      email: guest?.email || "",
      phone: guest?.phone || "",
      gender: (guest?.gender as "male" | "female") || "male",
      nationality: guest?.nationality || null,
      specialRequest: guest?.specialRequest || null,
    },
  });

  // Reset form when guest changes
  React.useEffect(() => {
    if (guest) {
      form.reset({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        gender: guest.gender as "male" | "female",
        nationality: guest.nationality || null,
        specialRequest: guest.specialRequest,
      });
    } else {
      // Reset to empty values when guest is null (create mode)
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "male",
        nationality: null,
        specialRequest: null,
      });
    }
  }, [guest, form]);

  // Fetch countries on mount
  React.useEffect(() => {
    async function fetchCountries() {
      try {
        const countries = await getCountries();
        setCOUNTRIES(countries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    }
    fetchCountries();
  }, []);

  const handleSubmit = async (data: EditGuestFormData) => {
    try {
      // Use guest.id if editing, or empty string if creating (will be handled by server)
      const guestId = guest?.id || "";
      await onSubmit(guestId, data);
      const message = guest
        ? "Guest information updated successfully"
        : "Guest created successfully";
      toast.success(message);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {guest ? "Edit Guest Information" : "Create New Guest"}
          </DialogTitle>
          <DialogDescription>
            {guest
              ? "Update the guest's profile information below."
              : "Add a new guest to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+66 8 xxxx xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nationality */}
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Popover
                        open={openNationalityPopover}
                        onOpenChange={setOpenNationalityPopover}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            <div className="flex items-center justify-between w-full text-sm font-normal text-muted-foreground">
                              {COUNTRIES.find(
                                (country) =>
                                  country.code ===
                                  form.getValues("nationality"),
                              )?.title || "Select Nationality"}
                              <ChevronDown className="ml-2 size-4 opacity-50" />
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command className="rounded-lg border shadow-md w-full flex flex-col">
                            <CommandInput placeholder="Type a command or search..." />
                            <CommandList className="overflow-y-auto max-h-80">
                              <CommandEmpty>No results found.</CommandEmpty>
                              <CommandGroup>
                                {COUNTRIES.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    onSelect={() => {
                                      form.setValue(
                                        "nationality",
                                        country.code,
                                      );
                                      setOpenNationalityPopover(false);
                                    }}
                                  >
                                    {country.title}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Special Request */}
            <FormField
              control={form.control}
              name="specialRequest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Request</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any special requests or notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about the guest
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading
                  ? "Saving..."
                  : guest
                    ? "Save Changes"
                    : "Create Guest"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
