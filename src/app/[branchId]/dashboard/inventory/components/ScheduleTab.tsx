"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, Loader2, Search, XCircle } from "lucide-react";
import { GetBookingsResponse, BookingItem } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type ScheduleBookingItem = GetBookingsResponse & { item: BookingItem };

const bookingStatusConfig = {
  confirmed: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "In Progress",
    variant: "secondary" as const,
    icon: Clock,
  },
  pending: { label: "Pending", variant: "outline" as const, icon: Clock },
  cancelled: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

interface ScheduleTabProps {
  bookings: GetBookingsResponse[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  isLoading?: boolean;
  includeFilter?: boolean;
}

export function ScheduleTab({
  bookings,
  selectedDate,
  onDateChange,
  isLoading = false,
  includeFilter = false,
}: ScheduleTabProps) {
  const [open, setOpen] = useState(false);
  const bookingItems = useMemo((): ScheduleBookingItem[] => {
    return bookings.flatMap((booking) => {
      return booking.items
        .map((item) => {
          // filter today only and have bed or room only
          const scheduleDate = new Date(item.scheduledDate);
          const today = new Date();
          const isToday =
            scheduleDate.getDate() === today.getDate() &&
            scheduleDate.getMonth() === today.getMonth() &&
            scheduleDate.getFullYear() === today.getFullYear();
          if (!isToday) {
            return null;
          }
          if (!item.bed && !item.room) {
            return null;
          }

          return {
            ...booking,
            item: item,
          };
        })
        .filter((item): item is ScheduleBookingItem => item !== null);
    });
  }, [bookings]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today's Inventory Schedule</CardTitle>
            {/* <CardDescription>Room and bed allocation for today</CardDescription> */}
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : "Select Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (onDateChange) {
                    onDateChange(date);
                  }
                  setOpen(false);
                  // You can call a prop or context here to update the parent with the new date
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {includeFilter ? "No bookings found" : "No bookings yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  {includeFilter
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first booking"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {bookingItems.map((booking, idx) => (
                <div
                  key={`${booking.id}-${booking.item.id}-${idx}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  {/* <div className="flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {booking?.customer?.firstName?.[0]}
                        {booking?.customer?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div> */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-semibold">
                        {booking.bookingTime
                          ? new Date(booking.bookingTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.item.subService?.durationMinutes
                          ? `${booking.item.subService.durationMinutes} mins`
                          : booking.item.package?.subServices
                            ? booking.item.package.subServices.reduce(
                                (total, ss) =>
                                  total + (ss?.durationMinutes || 0),
                                0,
                              ) + " mins"
                            : booking.item.programme?.steps
                              ? booking.item.programme.steps.reduce(
                                  (total, step) =>
                                    total + (step?.duration || 0),
                                  0,
                                ) + " mins"
                              : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium capitalize">{`${booking?.customer?.firstName || `${booking.item.guests[0].firstName}`} ${booking?.customer?.lastName || `${booking.item.guests[0].lastName}`}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.item.subService
                          ? `${booking.item.subService.service.name} - ${booking.item.subService.name}`
                          : booking.item.package?.name ||
                            booking.item.programme?.name ||
                            "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Room</p>
                      <p className="font-medium">
                        {booking.item.room?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bed</p>
                      <p className="font-medium">
                        {booking.item.bed?.name || "-"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          bookingStatusConfig[
                            booking.status as keyof typeof bookingStatusConfig
                          ].variant
                        }
                      >
                        {
                          bookingStatusConfig[
                            booking.status as keyof typeof bookingStatusConfig
                          ].label
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
