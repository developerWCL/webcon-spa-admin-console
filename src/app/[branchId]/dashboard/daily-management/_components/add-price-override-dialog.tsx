"use client";

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
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCatalogueItems } from "@/actions/catalogue.actions";
import {
  createPriceOverride,
  updatePriceOverride,
} from "@/actions/daily-management.actions";
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { toast } from "sonner";

interface CatalogueItem {
  id: string;
  name: string;
  duration?: string;
  price?: number;
}

interface PriceOverride {
  id: number;
  date: string;
  endDate: string;
  type: string;
  itemName: string;
  originalPrice: number;
  newPrice: number;
  status: string;
  serviceId?: string;
  programmeId?: string;
  packageId?: string;
}

interface AddPriceOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  priceOverride?: PriceOverride;
  onUpdate?: () => void;
}

const priceOverrideSchema = z.object({
  itemType: z.string().min(1, "Item type is required"),
  itemId: z.string().min(1, "Item ID is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  originalPrice: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      "Original price must be a valid number",
    ),
  newPrice: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      "New price must be a valid number",
    ),
});

type PriceOverrideFormData = z.infer<typeof priceOverrideSchema>;

export function AddPriceOverrideDialog({
  open,
  onOpenChange,
  onSave,
  priceOverride,
  onUpdate,
}: AddPriceOverrideDialogProps) {
  const params = useParams();
  const branchId = params.branchId as string;
  const isEditMode = !!priceOverride;

  const form = useForm<PriceOverrideFormData>({
    resolver: zodResolver(priceOverrideSchema),
    defaultValues: {
      itemType: "",
      itemId: "",
      startDate: undefined,
      endDate: undefined,
      originalPrice: "",
      newPrice: "",
    },
  });

  // Watch form values
  const itemType = form.watch("itemType");
  const itemId = form.watch("itemId");

  // State management
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openItemType, setOpenItemType] = useState(false);
  const [openItemName, setOpenItemName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const itemTypeOptions = [
    { value: "service", label: "Service" },
    { value: "package", label: "Package" },
    { value: "programme", label: "Programme" },
  ];

  // Set default values when editing
  useEffect(() => {
    if (isEditMode && priceOverride && open) {
      form.reset({
        itemType: priceOverride.type,
        itemId:
          priceOverride.serviceId ||
          priceOverride.packageId ||
          priceOverride.programmeId ||
          "",
        startDate: new Date(priceOverride.date),
        endDate: new Date(priceOverride.endDate),
        originalPrice: priceOverride.originalPrice.toString(),
        newPrice: priceOverride.newPrice.toString(),
      });
    } else if (!isEditMode && open) {
      form.reset({
        itemType: "",
        itemId: "",
        startDate: undefined,
        endDate: undefined,
        originalPrice: "",
        newPrice: "",
      });
    }
  }, [isEditMode, priceOverride, open, form]);

  // Fetch items when itemType changes or when in edit mode
  useEffect(() => {
    if (!itemType || !branchId) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const catalogueType =
          itemType === "service"
            ? "services"
            : itemType === "package"
              ? "packages"
              : "programmes";

        const result = await getCatalogueItems(catalogueType, branchId);

        if (result.success && result.data) {
          setItems(result.data);
          // Auto-select original price when item is already loaded
          if (isEditMode && itemId) {
            const selectedItem = result.data.find((item) => item.id === itemId);
            if (selectedItem) {
              form.setValue(
                "originalPrice",
                selectedItem.price?.toString() || "",
              );
            }
          }
        } else {
          setError(result.error || "Failed to fetch items");
          setItems([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [itemType, branchId, isEditMode, itemId, form]);

  const handleSave = async (data: PriceOverrideFormData) => {
    if (isSaving) return; // Prevent multiple submissions
    setIsSaving(true);

    try {
      let result;

      if (isEditMode && priceOverride) {
        // Handle update
        result = await updatePriceOverride(
          branchId,
          priceOverride.id.toString(),
          {
            startDate: data.startDate,
            endDate: data.endDate,
            newPrice: parseFloat(data.newPrice),
          },
        );

        if (result.success) {
          toast.success("Price override updated successfully");
          form.reset();
          onOpenChange(false);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to update price override");
        }
      } else {
        // Handle create
        result = await createPriceOverride(branchId, {
          itemType: data.itemType as "service" | "package" | "programme",
          itemId: data.itemId,
          startDate: data.startDate,
          endDate: data.endDate,
          newPrice: parseFloat(data.newPrice),
        });

        if (result.success) {
          toast.success("Price override created successfully");
          form.reset();
          onOpenChange(false);
          onSave?.();
        } else {
          toast.error(result.error || "Failed to create price override");
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An error occurred while saving",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Price Override" : "Add Price Override"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type</FormLabel>
                    <Popover
                      open={!isEditMode && openItemType}
                      onOpenChange={setOpenItemType}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openItemType}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={isEditMode}
                          >
                            {field.value
                              ? itemTypeOptions.find(
                                  (opt) => opt.value === field.value,
                                )?.label
                              : "Select type..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {!isEditMode && (
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search type..." />
                            <CommandEmpty>No type found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {itemTypeOptions.map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                      field.onChange(
                                        currentValue === field.value
                                          ? ""
                                          : currentValue,
                                      );
                                      setOpenItemType(false);
                                      form.setValue("itemName", ""); // Reset item name when type changes
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === option.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {option.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      )}
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <Popover
                      open={!isEditMode && openItemName}
                      onOpenChange={setOpenItemName}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openItemName}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={!itemType || loading || isEditMode}
                          >
                            {field.value
                              ? items.find((item) => item.id === field.value)
                                  ?.name
                              : loading
                                ? "Loading..."
                                : !itemType
                                  ? "Select type first"
                                  : "Select item..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {!isEditMode && (
                        <PopoverContent className="w-full p-0">
                          <Command
                            filter={(value, search) => {
                              const type = form.getValues("itemType");
                              if (!type) return false;
                              const valueName =
                                type === "service"
                                  ? items.find((item) => item.id === value)
                                      ?.service?.name +
                                    " - " +
                                    items.find((item) => item.id === value)
                                      ?.name
                                  : items.find((item) => item.id === value)
                                      ?.name || "";
                              return valueName
                                .toLowerCase()
                                .includes(search.toLowerCase());
                            }}
                          >
                            <CommandInput placeholder="Search items..." />
                            <CommandEmpty>
                              {error ? error : "No items found."}
                            </CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {items.map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    value={item.id}
                                    onSelect={(currentValue) => {
                                      field.onChange(
                                        currentValue === field.value
                                          ? ""
                                          : currentValue,
                                      );
                                      form.setValue(
                                        "originalPrice",
                                        item.price?.toString() || "",
                                      ); // Set original price when item is selected
                                      setOpenItemName(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === item.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />

                                    {itemType === "service"
                                      ? ` ${item?.service?.name} - ${item.name}`
                                      : item.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      )}
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP")
                              : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date >
                              new Date(new Date().getFullYear() + 1, 11, 31) ||
                            (form.getValues("endDate") &&
                              date > form.getValues("endDate")) ||
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
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
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP")
                              : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date >
                              new Date(new Date().getFullYear() + 1, 11, 31) ||
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            (form.getValues("startDate") &&
                              date < form.getValues("startDate"))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price (฿)</FormLabel>
                    <FormControl>
                      <Input
                        id="original-price"
                        type="number"
                        placeholder="0.00"
                        disabled
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Price (฿)</FormLabel>
                    <FormControl>
                      <Input
                        id="new-price"
                        type="number"
                        placeholder="0.00"
                        {...field}
                      />
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
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                    ? "Update Price Override"
                    : "Save Price Override"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
