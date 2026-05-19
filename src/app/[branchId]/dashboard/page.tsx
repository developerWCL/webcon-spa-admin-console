"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBookings } from "@/actions/booking.actions";
import Link from "next/link";
import { EditableAction } from "@/components/EditableAction";
import { canAccessFeature } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";

interface RecentBooking {
  id: string;
  bookingId?: string;
  customer: string;
  service: string;
  time: string;
  status: string;
  therapist: string;
}

const getUpcomingAppointments = (bookings: RecentBooking[]) => {
  return bookings.map((booking, index) => ({
    time: booking.time,
    customer: booking.customer,
    service: booking.service,
    room: booking?.room?.name ? `Room ${index + 1}` : "Unassigned Room",
    bookingId: booking.bookingId,
  }));
};

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
  },
  "in-progress": {
    label: "In Progress",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-blue-600",
  },
  pending: {
    label: "Pending",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-yellow-600",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
};

export default function DashboardPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const today = new Date();
        const startDateTime = new Date(today);
        startDateTime.setHours(0, 0, 0, 0);
        const endDateTime = new Date(today);
        endDateTime.setHours(23, 59, 59, 999);
        const response = await getBookings(
          branchId,
          1,
          5,
          undefined,
          undefined,
          startDateTime.toISOString(),
          endDateTime.toISOString(),
        );

        if (!response.success || !response.data) {
          setError("Failed to fetch bookings");
          setRecentBookings([]);
          return;
        }

        // Transform API response to dashboard format
        const bookingsData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        const transformedBookings: RecentBooking[] = bookingsData.flatMap(
          (booking: any) => {
            const items = booking.items.filter((item: any) => {
              const scheduledDate = new Date(item.scheduledDate);
              const today = new Date();
              return (
                scheduledDate.getDate() === today.getDate() &&
                scheduledDate.getMonth() === today.getMonth() &&
                scheduledDate.getFullYear() === today.getFullYear()
              );
            });

            // If items.length > 1, return one entry for each item
            if (items.length > 1) {
              return items.map((item: any) => ({
                id: booking.id,
                bookingId: booking.bookingId,
                customer:
                  item.guests?.[0] && item.guests?.[0].firstName
                    ? `${item.guests?.[0].firstName} ${item.guests?.[0].lastName || ""}`
                    : "Guest",
                service:
                  item?.subService?.name ||
                  item?.package?.name ||
                  item?.programme?.name ||
                  "Service",
                time:
                  item?.scheduledTime?.split(":")[0] +
                  ":" +
                  (item?.scheduledTime?.split(":")[1] || "00"),
                status: booking.status || "pending",
                therapist: item?.staff?.firstName || "Not assigned",
                room: item?.room || null,
              }));
            }

            // If only one item, return a single entry
            return [
              {
                id: booking.id,
                bookingId: booking.bookingId,
                customer:
                  items?.[0]?.guests?.[0] && items?.[0]?.guests?.[0].firstName
                    ? `${items?.[0]?.guests[0].firstName} ${items?.[0]?.guests?.[0].lastName || ""}`
                    : "Guest",
                service: items?.[0]?.subService
                  ? `${items?.[0]?.subService?.service?.name} (${items?.[0]?.subService.name})`
                  : items?.[0]?.package
                    ? items?.[0]?.package.name
                    : items?.[0]?.programme
                      ? items?.[0]?.programme.name
                      : "Service",

                time:
                  items?.[0]?.scheduledTime.split(":")[0] +
                  ":" +
                  (items?.[0]?.scheduledTime.split(":")[1] || "00"),
                status: booking.status || "pending",
                therapist: items?.[0]?.staff?.firstName || "Not assigned",
                room: items?.[0]?.room || null,
              },
            ];
          },
        );
        // new order by time
        transformedBookings.sort((a, b) => {
          const timeA = a.time.split(":").map(Number);
          const timeB = b.time.split(":").map(Number);
          return timeA[0] - timeB[0] || timeA[1] - timeB[1];
        });
        setRecentBookings(transformedBookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setRecentBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (branchId) {
      fetchBookings();
    }
  }, [branchId]);

  const { canAccess } = usePermission();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {"Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {"Welcome back! Here's an overview of your spa operations today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditableAction featureKey="bookings">
            <Link href={`/${branchId}/dashboard/bookings/new`}>
              <Button>{"New Booking"}</Button>
            </Link>
          </EditableAction>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{"Recent Bookings"}</CardTitle>
                <CardDescription>
                  {"Today's appointments and their status"}
                </CardDescription>
              </div>
              {canAccess("bookings", "view") ||
              canAccess("bookings", "full") ? (
                <Link href={`/${branchId}/dashboard/bookings`}>
                  <Button variant="ghost" size="sm">
                    {"View All"}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No bookings found for today
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => {
                  const StatusIcon =
                    statusConfig[booking.status as keyof typeof statusConfig]
                      ?.icon || AlertCircle;
                  if (canAccess("bookings", "full")) {
                    return (
                      <Link
                        key={booking.id}
                        href={`/${branchId}/dashboard/bookings/${booking.id}`}
                        className="block w-full"
                      >
                        <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                          <div className="flex-shrink-0">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {booking.customer
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-foreground truncate">
                                {booking.customer}
                              </p>
                              <Badge
                                variant={
                                  statusConfig[
                                    booking.status as keyof typeof statusConfig
                                  ]?.variant || "outline"
                                }
                                className="text-xs"
                              >
                                {statusConfig[
                                  booking.status as keyof typeof statusConfig
                                ]?.label || booking.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {booking.service}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-medium text-foreground">
                              {booking.time}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.bookingId}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                        <div className="flex-shrink-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {booking.customer
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground truncate">
                              {booking.customer}
                            </p>
                            <Badge
                              variant={
                                statusConfig[
                                  booking.status as keyof typeof statusConfig
                                ]?.variant || "outline"
                              }
                              className="text-xs"
                            >
                              {statusConfig[
                                booking.status as keyof typeof statusConfig
                              ]?.label || booking.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.service}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium text-foreground">
                            {booking.time}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.bookingId}
                          </p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{"Today's Schedule"}</CardTitle>
                <CardDescription>{"Upcoming appointments"}</CardDescription>
              </div>
              {canAccess("inventory", "view") ||
              canAccess("inventory", "full") ? (
                <Link href={`/${branchId}/dashboard/inventory`}>
                  <Button variant="ghost" size="sm">
                    {"View All"}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No appointments scheduled for today
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getUpcomingAppointments(recentBookings).map((apt, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 pt-1">
                      <div className="text-sm font-semibold text-foreground">
                        {apt.time}
                      </div>
                    </div>
                    <div className="flex-1 p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-foreground">
                            {apt.customer}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.service}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="outline" className="text-xs">
                            {apt.room}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {apt.bookingId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{"Quick Actions"}</CardTitle>
          <CardDescription>{"Common tasks and shortcuts"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={`/${branchId}/dashboard/bookings/new`}
              className="block w-full"
            >
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2 bg-transparent w-full"
              >
                <Calendar className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{"Create Booking"}</div>
                  <div className="text-xs text-muted-foreground">
                    {"Schedule new appointment"}
                  </div>
                </div>
              </Button>
            </Link>
            <Link
              href={`/${branchId}/dashboard/customers?type=new`}
              className="w-full block"
            >
              <Button
                variant="outline"
                className="w-full h-auto flex-col items-start p-4 gap-2 bg-transparent"
              >
                <Users className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{"Add Customer"}</div>
                  <div className="text-xs text-muted-foreground">
                    {"Register new client"}
                  </div>
                </div>
              </Button>
            </Link>
            <Link
              href={`/${branchId}/dashboard/daily-management`}
              className="w-full block"
            >
              <Button
                variant="outline"
                className="w-full h-auto flex-col items-start p-4 gap-2 bg-transparent"
              >
                <CalendarCheck className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{"Daily Management"}</div>
                  <div className="text-xs text-muted-foreground">
                    {"Dynamic pricing & Availability"}
                  </div>
                </div>
              </Button>
            </Link>
            <Link
              href={`/${branchId}/dashboard/reports`}
              className="w-full block"
            >
              <Button
                variant="outline"
                className="w-full h-auto flex-col items-start p-4 gap-2 bg-transparent"
              >
                <TrendingUp className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{"View Reports"}</div>
                  <div className="text-xs text-muted-foreground">
                    {"Analytics & insights"}
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
