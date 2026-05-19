"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getRooms } from "@/actions/rooms.actions";
import { getBeds } from "@/actions/beds.actions";
import { createRoomBedClosure } from "@/actions/room-bed-closure.actions";
import { Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";

const availabilitySchema = z.object({
  date: z.string().min(1, "Date is required"),
  room: z.string().min(1, "Room is required"),
  bed: z.string().optional(),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must not exceed 500 characters"),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

interface ManageAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: AvailabilityFormValues) => void;
}

export function ManageAvailabilityDialog({
  open,
  onOpenChange,
  onSave,
}: ManageAvailabilityDialogProps) {
  const params = useParams();
  const branchId = params.branchId as string;

  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [beds, setBeds] = useState<
    Array<{ id: string; name: string; roomId: string }>
  >([]);
  const [filteredBeds, setFilteredBeds] = useState<
    Array<{ id: string; name: string; roomId: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      date: "",
      room: "",
      bed: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchRoomsAndBeds();
    }
  }, [open, branchId]);

  // Filter beds when room is selected
  useEffect(() => {
    const selectedRoom = form.watch("room");
    if (selectedRoom) {
      // Find the room ID by room name
      const room = rooms.find((r) => r.id === selectedRoom);
      if (room) {
        const filtered = beds.filter((bed) => bed.roomId === room.id);
        setFilteredBeds(filtered);
        // Clear bed selection if it's not in the selected room
        const currentBed = form.watch("bed");
        if (currentBed && !filtered.find((b) => b.id === currentBed)) {
          form.setValue("bed", "");
        }
      }
    } else {
      setFilteredBeds(beds);
    }
  }, [form.watch("room"), beds, rooms]);

  const fetchRoomsAndBeds = async () => {
    try {
      setIsLoading(true);
      const [roomsResponse, bedsResponse] = await Promise.all([
        getRooms(branchId),
        getBeds(branchId),
      ]);

      if (roomsResponse.success && roomsResponse.data) {
        const roomsList = Array.isArray(roomsResponse.data)
          ? roomsResponse.data
          : [roomsResponse.data];
        setRooms(
          roomsList.map((room: any) => ({
            id: room.id,
            name: room.name,
          })),
        );
      }

      if (bedsResponse.success && bedsResponse.data) {
        const bedsList = Array.isArray(bedsResponse.data)
          ? bedsResponse.data
          : [bedsResponse.data];
        setBeds(
          bedsList.map((bed: any) => ({
            id: bed.id,
            name: bed.name,
            roomId: bed.roomId || bed.room?.id || "",
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch rooms and beds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AvailabilityFormValues) => {
    try {
      const result = await createRoomBedClosure(branchId, {
        roomId: data.room,
        bedId: data.bed,
        closureDate: data.date,
        reason: data.reason,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create closure");
        return;
      }

      toast.success("Room/Bed closure created successfully");
      onSave?.(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred while creating the closure");
      console.error("Submit error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Availability</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Close Date</FormLabel>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
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
                            ? format(new Date(field.value), "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
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
                            setDateOpen(false);
                          }
                        }}
                        disabled={(date) =>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Room</FormLabel>
                    <Popover open={roomOpen} onOpenChange={setRoomOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? rooms.find((r) => r.id === field.value)?.name
                              : "Select room..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search rooms..." />
                          <CommandEmpty>No room found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {rooms.map((room) => (
                                <CommandItem
                                  value={room.id}
                                  key={room.id}
                                  onSelect={(currentValue) => {
                                    field.onChange(
                                      currentValue === field.value
                                        ? ""
                                        : currentValue,
                                    );
                                    setRoomOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === room.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {room.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bed"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Bed</FormLabel>
                    <Popover open={bedOpen} onOpenChange={setBedOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? beds.find((b) => b.id === field.value)?.name
                              : "Select bed..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search beds..." />
                          <CommandEmpty>No bed found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {filteredBeds.map((bed) => {
                                const bedRoom = rooms.find(
                                  (r) => r.id === bed.roomId,
                                );
                                return (
                                  <CommandItem
                                    value={bed.id}
                                    key={bed.id}
                                    onSelect={(currentValue) => {
                                      field.onChange(
                                        currentValue === field.value
                                          ? ""
                                          : currentValue,
                                      );
                                      // Auto-select room when bed is selected
                                      if (currentValue !== field.value) {
                                        const selectedBed = beds.find(
                                          (b) => b.id === currentValue,
                                        );
                                        if (selectedBed) {
                                          const room = rooms.find(
                                            (r) => r.id === selectedBed.roomId,
                                          );
                                          if (room) {
                                            form.setValue("room", room.id);
                                          }
                                        }
                                      }
                                      setBedOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === bed.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{bed.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {bedRoom?.name}
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the reason for closure..."
                      className="min-h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Availability</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
