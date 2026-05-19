"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Clock, Package, Trash2, CalendarIcon, Plus, User } from "lucide-react";
import { format } from "date-fns";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getRooms } from "@/actions/rooms.actions";
import { getStaffMembers } from "@/actions/staff.actions";
import { getBeds } from "@/actions/beds.actions";
import type { BookingFormData } from "../../../../../schemas/booking.schema";

interface PackageService {
  id: number | string;
  name: string;
  duration: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  therapist: string;
  room: string;
  date: string;
  time: string;
  commission: number;
}

interface PackageServicesCardProps {
  form: UseFormReturn<BookingFormData>;
  isCreating: boolean;
  fields: FieldArrayWithId<BookingFormData, "bookingItems">[];
  remove: (index: number) => void;
}

interface GuestInfoSectionProps {
  form: UseFormReturn<BookingFormData>;
  itemIndex: number;
  isCreating: boolean;
  numberOfGuests: number;
  isFieldsDisabled: boolean;
}

// Guest Info Section Component
function GuestInfoSection({
  form,
  itemIndex,
  isCreating,
  numberOfGuests,
  isFieldsDisabled,
}: GuestInfoSectionProps) {
  const {
    fields: guestFields,
    append,
    remove: removeGuest,
  } = useFieldArray({
    control: form.control,
    name: `bookingItems.${itemIndex}.guests` as const,
  });

  const handleAddGuest = () => {
    if (!isFieldsDisabled && guestFields.length < (numberOfGuests || 1)) {
      append({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialRequest: "",
      } as any);
    }
  };

  const handleRemoveGuest = (guestIndex: number) => {
    if (!isFieldsDisabled && guestFields.length > 1) {
      removeGuest(guestIndex);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5" />
        <h3 className="font-semibold text-sm">
          Guest Information ({guestFields.length}/{numberOfGuests})
        </h3>
      </div>

      {guestFields.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No guests added yet
          </p>
          {!isFieldsDisabled && (
            <Button
              type="button"
              size="sm"
              onClick={handleAddGuest}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Guest
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {guestFields.map((guestField, guestIndex) => (
            <div
              key={guestField.id}
              className="p-3 border rounded-lg space-y-3 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm">
                  Guest {guestIndex + 1}
                </span>
                {!isFieldsDisabled && guestFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveGuest(guestIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`bookingItems.${itemIndex}.guests.${guestIndex}.firstName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First name"
                          disabled={isFieldsDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`bookingItems.${itemIndex}.guests.${guestIndex}.lastName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          disabled={isFieldsDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`bookingItems.${itemIndex}.guests.${guestIndex}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email address"
                          disabled={isFieldsDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`bookingItems.${itemIndex}.guests.${guestIndex}.phone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          disabled={isFieldsDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`bookingItems.${itemIndex}.guests.${guestIndex}.specialRequest`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Special Requests</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Any special requests or allergies?"
                        disabled={isFieldsDisabled}
                        className="min-h-[80px] w-full px-3 py-2 border border-input rounded-md bg-background text-base placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          {!isFieldsDisabled && guestFields.length < (numberOfGuests || 1) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddGuest}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Guest ({guestFields.length + 1}/{numberOfGuests})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function PackageServicesCard({
  form,
  isCreating,
  fields,
  remove,
}: PackageServicesCardProps) {
  const params = useParams();
  const branchId = params.branchId as string;
  const [openDatePickers, setOpenDatePickers] = useState<
    Record<number, boolean>
  >({});
  const [roomOptions, setRoomOptions] = useState<
    Record<number, Array<{ value: string; label: string }>>
  >({});
  const [isLoadingRooms, setIsLoadingRooms] = useState<Record<number, boolean>>(
    {},
  );

  // Initialize loading state for all fields
  useEffect(() => {
    const initialLoadingState: Record<number, boolean> = {};
    for (let i = 0; i < fields.length; i++) {
      initialLoadingState[i] = false;
    }
    setIsLoadingRooms(initialLoadingState);
    setIsLoadingBeds(initialLoadingState);
    setIsLoadingTherapists(initialLoadingState);
  }, [fields.length]);
  const [bedOptions, setBedOptions] = useState<
    Record<number, Array<{ value: string; label: string }>>
  >({});

  const [selectRoomOpen, setSelectRoomOpen] = useState<Record<number, boolean>>(
    {},
  );
  const [selectBedOpen, setSelectBedOpen] = useState<Record<number, boolean>>(
    {},
  );
  const [isLoadingBeds, setIsLoadingBeds] = useState<Record<number, boolean>>(
    {},
  );
  const [therapistOptions, setTherapistOptions] = useState<
    Record<number, Array<{ value: string; label: string }>>
  >({});
  const [isLoadingTherapists, setIsLoadingTherapists] = useState<
    Record<number, boolean>
  >({});

  // Determine if fields should be disabled
  const bookingStatus = form.watch("status");
  const isFieldsDisabled =
    !isCreating &&
    (bookingStatus === "completed" || bookingStatus === "cancelled");

  // Fetch rooms for a specific booking item when its date changes
  const fetchRoomsForItem = useCallback(
    async (index: number, date: string) => {
      if (!branchId || !date) {
        setRoomOptions((prev) => ({ ...prev, [index]: [] }));
        setIsLoadingRooms((prev) => ({ ...prev, [index]: false }));
        return;
      }

      setIsLoadingRooms((prev) => ({ ...prev, [index]: true }));

      try {
        const result = await getRooms(
          branchId,
          1,
          100,
          undefined,
          undefined,
          date,
        );

        if (result.success && result.data) {
          const rooms = Array.isArray(result.data) ? result.data : [];
          const transformedOptions = rooms
            .map((room: any) => ({
              value: room.id || room.name,
              label: room.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          setRoomOptions((prev) => ({
            ...prev,
            [index]: transformedOptions,
          }));
        } else {
          setRoomOptions((prev) => ({ ...prev, [index]: [] }));
        }
      } catch (error) {
        console.error(`Failed to fetch rooms for item ${index}:`, error);
        setRoomOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setIsLoadingRooms((prev) => ({ ...prev, [index]: false }));
      }
    },
    [branchId],
  );

  // Fetch beds for a specific booking item when its date and room change
  const fetchBedsForItem = useCallback(
    async (index: number, date: string, roomId: string) => {
      if (!branchId || !date || !roomId) {
        setBedOptions((prev) => ({ ...prev, [index]: [] }));
        setIsLoadingBeds((prev) => ({ ...prev, [index]: false }));
        return;
      }

      setIsLoadingBeds((prev) => ({ ...prev, [index]: true }));

      try {
        const result = await getBeds(
          branchId,
          1,
          100,
          undefined,
          undefined,
          date,
        );

        if (result.success && result.data) {
          const beds = Array.isArray(result.data) ? result.data : [];
          // Filter beds for the selected room
          const filteredBeds = beds.filter(
            (bed: any) => (bed.roomId || bed.room?.id) === roomId,
          );
          const transformedOptions = filteredBeds
            .map((bed: any) => ({
              value: bed.id || bed.name,
              label: bed.name,
              roomId: bed.roomId || bed.room?.id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          setBedOptions((prev) => ({
            ...prev,
            [index]: transformedOptions,
          }));
        } else {
          setBedOptions((prev) => ({ ...prev, [index]: [] }));
        }
      } catch (error) {
        console.error(`Failed to fetch beds for item ${index}:`, error);
        setBedOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setIsLoadingBeds((prev) => ({ ...prev, [index]: false }));
      }
    },
    [branchId],
  );

  // Fetch therapists for a specific booking item when its date changes
  const fetchTherapistsForItem = useCallback(
    async (index: number, date: string) => {
      if (!branchId || !date) {
        setTherapistOptions((prev) => ({ ...prev, [index]: [] }));
        setIsLoadingTherapists((prev) => ({ ...prev, [index]: false }));
        return;
      }

      setIsLoadingTherapists((prev) => ({ ...prev, [index]: true }));

      try {
        const result = await getStaffMembers(
          branchId,
          1,
          100,
          undefined,
          true,
          date,
        );

        if (result.success && result.data) {
          const staff = Array.isArray(result.data) ? result.data : [];
          const transformedOptions = staff
            .map((member: any) => ({
              value: member.id,
              label: `${member.firstName} ${member.lastName}`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          setTherapistOptions((prev) => ({
            ...prev,
            [index]: transformedOptions,
          }));
        } else {
          setTherapistOptions((prev) => ({ ...prev, [index]: [] }));
        }
      } catch (error) {
        console.error(`Failed to fetch therapists for item ${index}:`, error);
        setTherapistOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setIsLoadingTherapists((prev) => ({ ...prev, [index]: false }));
      }
    },
    [branchId],
  );

  // Watch all dates and fetch rooms, beds, and therapists when they change
  useEffect(() => {
    const timers: Record<number, NodeJS.Timeout> = {};

    const subscription = form.watch((data) => {
      if (data.bookingItems) {
        data.bookingItems.forEach((item: any, index: number) => {
          // Clear previous timer for this index
          if (timers[index]) {
            clearTimeout(timers[index]);
          }

          // Debounce the fetch for each item
          timers[index] = setTimeout(() => {
            fetchRoomsForItem(index, item.date);
            fetchTherapistsForItem(index, item.date);
            // Fetch beds if date and room are selected
            if (item.room) {
              fetchBedsForItem(index, item.date, item.room);
            }
          }, 300);
        });
      }
    });

    return () => {
      // Clean up timers and subscription
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [form, fetchRoomsForItem, fetchBedsForItem, fetchTherapistsForItem]);

  // Get bed options for the current booking item
  const getBedOptionsForItem = (index: number) => {
    return bedOptions[index] || [];
  };

  // Get therapist options for the current booking item
  const getTherapistOptionsForItem = (index: number) => {
    return therapistOptions[index] || [];
  };

  const toggleDatePicker = (index: number) => {
    setOpenDatePickers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleBedSelect = (index: number) => {
    setSelectBedOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Package Services
        </CardTitle>
        <CardDescription>
          {isCreating
            ? "Manage services for this booking"
            : "Manage each service in the package individually"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              {isCreating
                ? "No services added yet. Select a service above and click 'Add Service' to get started."
                : "No services in this booking."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="font-semibold">
                        {form.watch(`bookingItems.${index}.name` as const)}
                      </span>
                      {/* <FormField
                        control={form.control}
                        name={`bookingItems.${index}.status`}
                        render={({ field }) => (
                          <Badge
                            variant={
                              serviceStatusConfig[
                                field.value as keyof typeof serviceStatusConfig
                              ].variant
                            }
                          >
                            {
                              serviceStatusConfig[
                                field.value as keyof typeof serviceStatusConfig
                              ].label
                            }
                          </Badge>
                        )}
                      /> */}
                    </div>
                  </div>
                  {!isFieldsDisabled && isCreating && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`bookingItems.${index}.numberOfGuests`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Number of Guests
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            disabled={!isCreating || isFieldsDisabled}
                            {...field}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                field.onChange("");
                              } else {
                                field.onChange(parseInt(e.target.value));
                              }
                            }}
                            placeholder="Number of guest"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bookingItems.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Date</FormLabel>
                        <Popover
                          open={openDatePickers[index] || false}
                          onOpenChange={(open) => toggleDatePicker(index)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-sm"
                              disabled={isFieldsDisabled}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(format(date, "yyyy-MM-dd"));
                                  toggleDatePicker(index);
                                }
                              }}
                              disabled={(date) => date < new Date("1900-01-01")}
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
                    name={`bookingItems.${index}.time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            disabled={isFieldsDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bookingItems.${index}.therapist`}
                    render={({ field }) => {
                      const therapistListForItem =
                        getTherapistOptionsForItem(index);
                      return (
                        <FormItem>
                          <FormLabel className="text-xs">Therapist</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={
                              isLoadingTherapists[index] ||
                              !form.watch(`bookingItems.${index}.date`) ||
                              isFieldsDisabled
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm w-full">
                                <SelectValue
                                  placeholder={
                                    !form.watch(`bookingItems.${index}.date`)
                                      ? "Select date first"
                                      : isLoadingTherapists[index]
                                        ? "Loading therapists..."
                                        : "Select request therapist"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {therapistListForItem.length > 0 ? (
                                therapistListForItem.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                  {!form.watch(`bookingItems.${index}.date`)
                                    ? "Please select a date first"
                                    : isLoadingTherapists[index]
                                      ? "Loading therapists..."
                                      : "No therapists available on this date"}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name={`bookingItems.${index}.room`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Room</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          onOpenChange={(open) =>
                            setSelectRoomOpen((prev) => ({
                              ...prev,
                              [index]: open,
                            }))
                          }
                          open={selectRoomOpen[index] || false}
                          //disabled={isLoadingRooms[index] || isFieldsDisabled}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm w-full">
                              <SelectValue
                                placeholder={
                                  !form.watch(
                                    `bookingItems.${index}.date` as const,
                                  )
                                    ? "Select date first"
                                    : isLoadingRooms[index]
                                      ? "Loading rooms..."
                                      : "Select room"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(roomOptions[index] || []).length > 0 ? (
                              (roomOptions[index] || []).map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground">
                                {!form.watch(
                                  `bookingItems.${index}.date` as const,
                                )
                                  ? "Please select a date first"
                                  : isLoadingRooms[index]
                                    ? "Loading rooms..."
                                    : "No rooms available on this date"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`bookingItems.${index}.bed`}
                    render={({ field }) => {
                      const bedListForItem = getBedOptionsForItem(index);
                      return (
                        <FormItem>
                          <FormLabel className="text-xs">Bed</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            open={selectBedOpen[index] || false}
                            onOpenChange={(open) =>
                              setSelectBedOpen((prev) => ({
                                ...prev,
                                [index]: open,
                              }))
                            }
                            disabled={
                              isLoadingBeds[index] ||
                              !form.watch(`bookingItems.${index}.room`) ||
                              isFieldsDisabled
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm w-full">
                                <SelectValue
                                  placeholder={
                                    !form.watch(`bookingItems.${index}.room`)
                                      ? "Select room first"
                                      : !form.watch(
                                            `bookingItems.${index}.date`,
                                          )
                                        ? "Select date first"
                                        : isLoadingBeds[index]
                                          ? "Loading beds..."
                                          : "Select bed"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bedListForItem.length > 0 ? (
                                bedListForItem.map((option: any) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                  {!form.watch(`bookingItems.${index}.room`)
                                    ? "Please select a room first"
                                    : !form.watch(`bookingItems.${index}.date`)
                                      ? "Please select a date first"
                                      : isLoadingBeds[index]
                                        ? "Loading beds..."
                                        : "No beds available for this date and room"}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <Separator className="my-4" />

                {/* Guest Information Section */}
                <GuestInfoSection
                  form={form}
                  itemIndex={index}
                  isCreating={isCreating}
                  numberOfGuests={form.watch(
                    `bookingItems.${index}.numberOfGuests`,
                  )}
                  isFieldsDisabled={isFieldsDisabled}
                />

                <div className="flex items-center gap-3 pt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {form.watch(`bookingItems.${index}.duration`)} mins
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
