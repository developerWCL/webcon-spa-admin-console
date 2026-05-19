"use client";

import { AvatarFallback } from "@/components/ui/avatar";

import { Avatar } from "@/components/ui/avatar";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBookings, updateBooking } from "@/actions/booking.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  User,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  List,
  FilterX,
  Printer,
} from "lucide-react";
import { Pagination, PaginationMeta } from "@/components/pagination";
import { GetBookingsResponse } from "@/types/api/booking";
import { formatNumberWithComma } from "@/utils/utils";
import { EditableAction } from "@/components/EditableAction";
import { set } from "date-fns";
import { printBooking, type PrintBookingData } from "@/utils/print-booking";
import { useSession } from "next-auth/react";

// Type for transformed booking data

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    variant: "default" as const,
    color: "bg-green-500",
  },
  pending: {
    label: "Pending",
    variant: "outline" as const,
    color: "bg-yellow-500",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive" as const,
    color: "bg-red-500",
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    color: "bg-green-600",
  },
};

const paymentStatusConfig = {
  paid: { label: "Paid", color: "text-green-600" },
  pending: { label: "Pending", color: "text-yellow-600" },
  // unpaid: { label: "Failed", color: "text-red-600" },
  refunded: { label: "Refunded", color: "text-gray-600" },
};

export default function BookingsPage() {
  const params = useParams();
  const branchId = params.branchId as string;

  const [bookings, setBookings] = useState<GetBookingsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabSelected, setTabSelected] = useState<
    "all" | "today" | "upcoming" | "past"
  >("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] =
    useState<GetBookingsResponse | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>();
  const [bookingToUpdate, setBookingToUpdate] =
    useState<GetBookingsResponse | null>(null);
  const [updateAction, setUpdateAction] = useState<
    "complete" | "cancel" | null
  >(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const { data: session } = useSession();
  // Fetch bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        let startDateTime: Date | undefined = undefined;
        let endDateTime: Date | undefined = undefined;
        if (tabSelected === "today") {
          const today = new Date();
          startDateTime = new Date(today.setHours(0, 0, 0, 0));
          endDateTime = new Date(today.setHours(23, 59, 59, 999));
        } else if (tabSelected === "upcoming") {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          startDateTime = new Date(today);
        } else if (tabSelected === "past") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          endDateTime = new Date(today);
        }

        const response = await getBookings(
          branchId,
          currentPage,
          itemsPerPage,
          searchQuery,
          statusFilter,
          startDateTime?.toISOString(),
          endDateTime?.toISOString(),
        );

        if (response.success && response.data) {
          setBookings(response.data);

          setPaginationMeta(response.meta);
        } else {
          setError(response.error || "Failed to fetch bookings");
          setBookings([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (branchId) {
      fetchBookings();
    }
  }, [
    branchId,
    currentPage,
    itemsPerPage,
    searchQuery,
    statusFilter,
    tabSelected,
  ]);

  const handleStatusUpdate = async () => {
    if (!bookingToUpdate || !updateAction) return;

    try {
      setIsUpdating(true);
      const newStatus = updateAction === "complete" ? "completed" : "cancelled";

      const response = await updateBooking(bookingToUpdate.id, {
        status: newStatus,
      });

      if (response.success) {
        // Refresh the bookings list
        const result = await getBookings(
          branchId,
          currentPage,
          itemsPerPage,
          searchQuery,
          statusFilter,
        );
        if (result.success && result.data) {
          setBookings(result.data);
          setPaginationMeta(result.meta);
        }

        // Close dialog and reset state
        setIsConfirmDialogOpen(false);
        setBookingToUpdate(null);
        setUpdateAction(null);
      } else {
        console.error("Failed to update booking status:", response.error);
        alert(`Failed to update booking: ${response.error}`);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("An error occurred while updating the booking");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenConfirmDialog = (
    booking: GetBookingsResponse,
    action: "complete" | "cancel",
  ) => {
    setBookingToUpdate(booking);
    setUpdateAction(action);
    setIsConfirmDialogOpen(true);
  };

  const handlePrintBooking = (booking: GetBookingsResponse) => {
    const firstItem = booking.items[0];
    const bookingDate = new Date(
      firstItem?.scheduledDate || booking.bookingTime,
    );
    const formattedDate = bookingDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime =
      firstItem?.scheduledTime?.split(":").slice(0, 2).join(":") || "—";

    const services = booking.items.map((item) => ({
      name:
        (item?.subService
          ? `${item.subService?.service?.name} (${item.subService?.name})`
          : item.package
            ? item.package?.name
            : item.programme?.name) || "Unknown Service",
      price: formatNumberWithComma(Number(item.price || 0)),
    }));

    // Calculate guest count from all items
    const guestCount =
      booking.items.reduce(
        (sum, item) => sum + (item.guests?.length || 0),
        0,
      ) || 1;

    // Calculate subtotal from all items
    const subtotalAmount = booking.items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0,
    );

    // Calculate discount
    const totalAmount = Number(booking.totalAmount || 0);
    const discountAmount = Math.max(0, subtotalAmount - totalAmount);

    // Get special request from first guest
    const specialRequest =
      booking.items
        .flatMap((item) => item.guests || [])
        .find((guest) => guest.specialRequest)?.specialRequest || undefined;

    const printData: PrintBookingData = {
      bookingId: booking.bookingId,
      bookingDate: `${formattedDate} at ${formattedTime}`,
      customerName: booking?.customer
        ? `${booking.customer.firstName} ${booking.customer.lastName}`
        : `${booking?.items?.[0]?.guests?.[0]?.firstName} ${booking?.items?.[0]?.guests?.[0]?.lastName}`,
      customerEmail: booking?.customer
        ? booking.customer.email
        : booking?.items?.[0]?.guests?.[0]?.email,
      customerPhone: booking?.customer
        ? booking.customer.phone
        : booking?.items?.[0]?.guests?.[0]?.phone,
      guestCount,
      services,
      subtotalAmount:
        subtotalAmount > 0 ? formatNumberWithComma(subtotalAmount) : undefined,
      totalAmount: formatNumberWithComma(totalAmount),
      discountAmount:
        discountAmount > 0 ? formatNumberWithComma(discountAmount) : undefined,
      currency: "฿",
      specialRequest,
      promotionName: booking.promotion?.name,
      promotionCode: booking.promotion?.code,
      paymentMethod: booking.payments?.[0]?.paymentType || "Not specified",
      captureId: booking.payments?.[0]?.paypalCaptureId || undefined,
      branchName: booking.branch?.name,
      branchPhone: booking.branch?.phone,
      branchEmail: booking.branch?.email,
      spaLogo: session?.metadata?.logo_url,
      primaryColor: session?.metadata?.primary_color || "#245743",
    };

    printBooking(printData);
  };

  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
    setIsUpdating(false);
    // Wait for the exit animation to finish before wiping data
    setTimeout(() => {
      setBookingToUpdate(null);
      setUpdateAction(null);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {"Booking Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {"Manage all spa appointments and reservations"}
          </p>
        </div>
        <EditableAction featureKey="bookings">
          <Link href="bookings/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {"New Booking"}
            </Button>
          </Link>
        </EditableAction>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{"Create New Booking"}</DialogTitle>
              <DialogDescription>
                {"Fill in the details to create a new spa appointment"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">{"Customer"}</Label>
                  <Select>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{"Sarah Johnson"}</SelectItem>
                      <SelectItem value="2">{"Michael Chen"}</SelectItem>
                      <SelectItem value="3">{"Emily Davis"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">{"Service"}</Label>
                  <Select>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{"Swedish Massage"}</SelectItem>
                      <SelectItem value="2">
                        {"Aromatherapy Massage"}
                      </SelectItem>
                      <SelectItem value="3">{"Hot Stone Massage"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="therapist">{"Therapist"}</Label>
                  <Select>
                    <SelectTrigger id="therapist">
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{"Emma Wilson"}</SelectItem>
                      <SelectItem value="2">{"Lisa Anderson"}</SelectItem>
                      <SelectItem value="3">{"John Smith"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">{"Room"}</Label>
                  <Select>
                    <SelectTrigger id="room">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{"Room 1"}</SelectItem>
                      <SelectItem value="2">{"Room 2"}</SelectItem>
                      <SelectItem value="3">{"Room 3"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{"Date"}</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{"Time"}</Label>
                  <Input id="time" type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{"Notes"}</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-20 px-3 py-2 text-sm rounded-md border border-input bg-background"
                  placeholder="Add any special notes or requirements..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {"Cancel"}
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                {"Create Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name or booking number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{"All Status"}</SelectItem>
                  <SelectItem value="pending">{"Pending"}</SelectItem>
                  <SelectItem value="confirmed">{"Confirmed"}</SelectItem>
                  <SelectItem value="completed">{"Completed"}</SelectItem>
                  <SelectItem value="cancelled">{"Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // reset all filter and pagination
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                  setItemsPerPage(10);
                }}
              >
                <FilterX className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Tabs */}
      <Tabs
        value={tabSelected}
        onValueChange={(v) =>
          setTabSelected(v as "all" | "today" | "upcoming" | "past")
        }
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">{"All Bookings"}</TabsTrigger>
          <TabsTrigger value="today">{"Today"}</TabsTrigger>
          <TabsTrigger value="upcoming">{"Upcoming"}</TabsTrigger>
          <TabsTrigger value="past">{"Past"}</TabsTrigger>
        </TabsList>

        <TabsContent value={tabSelected} className="space-y-4">
          {/* Bookings List */}

          <Card>
            <CardHeader>
              <CardTitle>{"All Bookings"}</CardTitle>
              <CardDescription>
                {`Showing ${bookings.length} booking(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {"Loading bookings..."}
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive">{`Error: ${error}`}</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {"No bookings found. Try adjusting your search or filters."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                            Booking ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                            Services
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                            Items
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wide">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                            Payment Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide hidden">
                            Transaction ID
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => {
                          const firstItem = booking.items[0];
                          const bookingDate = new Date(
                            firstItem?.scheduledDate || booking.bookingTime,
                          );
                          const formattedDate = bookingDate.toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          );

                          const serviceNames = booking.items
                            .map((item) =>
                              item?.subService
                                ? `${item.subService?.service?.name} (${item.subService?.name})`
                                : item.package
                                  ? item.package?.name
                                  : item.programme?.name,
                            )
                            .join(", ");

                          return (
                            <tr
                              key={booking.id}
                              className="border-b hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-foreground">
                                  {booking?.bookingId}
                                </code>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {booking?.customer?.firstName?.[0] ||
                                      booking?.items?.[0]?.guests?.[0]
                                        ?.firstName?.[0] ||
                                      "U"}
                                    {booking?.customer?.lastName?.[0] ||
                                      booking?.items?.[0]?.guests?.[0]
                                        ?.lastName?.[0] ||
                                      "N"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">
                                      {booking?.customer
                                        ? `${booking.customer.firstName} ${booking.customer.lastName}`
                                        : `${booking?.items?.[0]?.guests?.[0]?.firstName} ${booking?.items?.[0]?.guests?.[0]?.lastName}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {booking?.customer?.phone ||
                                        booking?.items?.[0]?.guests?.[0]
                                          ?.phone ||
                                        "—"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <p className="text-sm text-foreground line-clamp-2">
                                  {serviceNames || "—"}
                                </p>
                              </td>

                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <p className="font-semibold text-foreground">
                                    {formattedDate}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {firstItem?.scheduledTime
                                      ?.split(":")
                                      .slice(0, 2)
                                      .join(":") || "—"}{" "}
                                    • {firstItem?.duration || 0}m
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-center">
                                <Badge variant="secondary" className="text-xs">
                                  {booking.itemsCount}
                                </Badge>
                              </td>

                              <td className="px-4 py-3 text-right">
                                <p className="font-bold text-lg text-foreground">
                                  ฿
                                  {formatNumberWithComma(
                                    Number(booking.totalAmount),
                                  )}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-center">
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
                              </td>

                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant={
                                    !booking.payments?.[0]
                                      ? "destructive"
                                      : booking.payments?.[0]?.status === "paid"
                                        ? "default"
                                        : booking.payments?.[0]?.status ===
                                            "pending"
                                          ? "secondary"
                                          : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {paymentStatusConfig[
                                    booking.payments?.[0]
                                      ?.status as keyof typeof paymentStatusConfig
                                  ]?.label ||
                                    booking.payments?.[0]?.status ||
                                    "Unpaid"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center hidden">
                                <p className="text-xs font-mono text-muted-foreground">
                                  {booking.payments?.[0]?.paypalCaptureId ||
                                    booking.payments?.[0]?.paypalOrderId ||
                                    "—"}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <DropdownMenu
                                  open={dropdownOpen === booking.id}
                                  onOpenChange={(open) =>
                                    setDropdownOpen(open ? booking.id : null)
                                  }
                                >
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      {"Actions"}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link
                                      href={`/${branchId}/dashboard/bookings/view/${booking.id}`}
                                    >
                                      <DropdownMenuItem>
                                        <Eye className="w-4 h-4 mr-2" />
                                        {"View Details"}
                                      </DropdownMenuItem>
                                    </Link>
                                    <Link
                                      href={`/${branchId}/dashboard/bookings/${booking.id}`}
                                    >
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        {"Edit Booking"}
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        handleOpenConfirmDialog(
                                          booking,
                                          "complete",
                                        );
                                      }}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      {"Mark as Completed"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        handlePrintBooking(booking);
                                      }}
                                    >
                                      <Printer className="w-4 h-4 mr-2" />
                                      {"Print Booking"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setDropdownOpen(null);
                                        handleOpenConfirmDialog(
                                          booking,
                                          "cancel",
                                        );
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      {"Cancel Booking"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    meta={paginationMeta || undefined}
                    onPageChange={setCurrentPage}
                    onLimitChange={setItemsPerPage}
                    showLimitSelector={true}
                    className="mt-4"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>{"Today's Bookings"}</CardTitle>
              <CardDescription>
                {"Appointments scheduled for today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                {"Same booking list filtered for today's date"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>{"Upcoming Bookings"}</CardTitle>
              <CardDescription>{"Future appointments"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                {"Same booking list filtered for future dates"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>{"Past Bookings"}</CardTitle>
              <CardDescription>
                {"Completed and cancelled appointments"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                {"Same booking list filtered for past dates"}
              </p>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailsDialogOpen(false);
            setTimeout(() => setSelectedBooking(null), 200);
          }
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[95vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {selectedBooking && (
            <>
              <DialogHeader className="bg-gradient-to-r from-slate-900 to-slate-800 -m-6 mb-6 px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <DialogTitle className="text-white text-2xl">
                      Booking Details
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 mt-1">
                      ID:{" "}
                      <span className="font-mono font-bold">
                        {selectedBooking.id}
                      </span>{" "}
                      • Created{" "}
                      {new Date(selectedBooking.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Customer & Status */}
                <div className="border-b pb-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                        Customer Information
                      </Label>
                      <p className="font-bold text-xl mt-2 text-foreground">
                        {selectedBooking?.customer?.firstName}{" "}
                        {selectedBooking?.customer?.lastName}
                      </p>
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {selectedBooking?.customer?.email}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {selectedBooking?.customer?.phone}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide block mb-2">
                          Booking Status
                        </Label>
                        <Badge
                          variant={
                            statusConfig[
                              selectedBooking.status as keyof typeof statusConfig
                            ]?.variant || "outline"
                          }
                          className="px-3 py-1.5 text-sm font-semibold"
                        >
                          {statusConfig[
                            selectedBooking.status as keyof typeof statusConfig
                          ]?.label || selectedBooking.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide block mb-2">
                          Payment Status
                        </Label>
                        <Badge
                          variant={
                            selectedBooking.payments[0].status === "paid"
                              ? "default"
                              : selectedBooking.payments[0].status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="px-3 py-1.5 text-sm font-semibold"
                        >
                          {paymentStatusConfig[
                            selectedBooking.payments[0]
                              .status as keyof typeof paymentStatusConfig
                          ]?.label || selectedBooking.payments[0].status}
                        </Badge>
                      </div>
                      {selectedBooking.payments[0].paymentType && (
                        <div>
                          <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide block mb-2">
                            Payment Method
                          </Label>
                          <p className="text-sm font-medium capitalize bg-accent/30 px-3 py-2 rounded">
                            {selectedBooking.payments[0].paymentType}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services/Items */}
                <div className="border-b pb-6">
                  <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide block mb-4">
                    {`Services & Items (${selectedBooking.itemsCount})`}
                  </Label>
                  <div className="space-y-4">
                    {selectedBooking.items.map((item, idx) => {
                      const serviceName =
                        item.subService?.name ||
                        item.package?.name ||
                        item.programme?.name ||
                        "Unknown Service";
                      return (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 bg-primary/10 hover:shadow-md transition-all"
                        >
                          <div className="space-y-3">
                            {/* Service Name & Price */}
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                                    {idx + 1}
                                  </span>
                                  <p className="font-bold text-foreground text-base">
                                    {serviceName}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 ml-8">
                                  <span className="capitalize font-medium px-2 py-1 bg-white/60 rounded">
                                    {item.itemType.replace("_", " ")}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  ฿{item.subtotal}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.quantity}x @ ฿
                                  {formatNumberWithComma(Number(item.price))}
                                </p>
                              </div>
                            </div>

                            {/* Item Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/40 rounded-lg p-3">
                              <div>
                                <span className="text-xs text-muted-foreground font-semibold uppercase">
                                  Date
                                </span>
                                <p className="font-bold text-sm mt-1 text-foreground">
                                  {new Date(
                                    item.scheduledDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground font-semibold uppercase">
                                  Time
                                </span>
                                <p className="font-bold text-sm mt-1 text-foreground">
                                  {item.scheduledTime}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground font-semibold uppercase">
                                  Duration
                                </span>
                                <p className="font-bold text-sm mt-1 text-foreground">
                                  {item.duration} min
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground font-semibold uppercase">
                                  Qty
                                </span>
                                <p className="font-bold text-sm mt-1 text-foreground">
                                  {item.quantity}
                                </p>
                              </div>
                            </div>

                            {/* Bed/Room */}
                            {item.bed && (
                              <div className="bg-purple-50/80 border border-purple-200/50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-purple-900 uppercase mb-1">
                                  Room / Bed
                                </p>
                                <p className="font-bold text-foreground">
                                  {item.bed.name}
                                </p>
                              </div>
                            )}

                            {/* Guests assigned to this item */}
                            {item.guests && item.guests.length > 0 && (
                              <div className="bg-orange-50/80 border border-orange-200/50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-orange-900 uppercase mb-3">
                                  Assigned Guests ({item.guests.length})
                                </p>
                                <div className="space-y-2">
                                  {item.guests.map((guest) => (
                                    <div
                                      key={guest.id}
                                      className="bg-white/60 rounded-lg p-2.5 border border-orange-100"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm text-foreground">
                                            {guest.firstName} {guest.lastName}
                                          </p>
                                          {guest.email && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              📧 {guest.email}
                                            </p>
                                          )}
                                          {guest.phone && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              📱 {guest.phone}
                                            </p>
                                          )}
                                          {guest.specialRequest && (
                                            <div className="mt-2 pt-2 border-t border-orange-200">
                                              <p className="text-xs font-semibold text-orange-700 mb-1">
                                                ⭐ Special Request:
                                              </p>
                                              <p className="text-xs text-orange-900 bg-orange-50/70 rounded px-2 py-1">
                                                {guest.specialRequest}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {item.notes && (
                              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                <p className="text-xs font-semibold text-yellow-900 uppercase mb-1">
                                  Special Note
                                </p>
                                <p className="text-sm text-yellow-800">
                                  {item.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-primary/10 rounded-lg p-5">
                  <Label className="text-xs text-primary font-semibold uppercase tracking-wide block mb-4">
                    Pricing Summary
                  </Label>
                  <div className="space-y-3">
                    {selectedBooking.promotion && (
                      <div className="flex justify-between items-center p-2 bg-white/60 rounded">
                        <span className="text-sm font-medium text-foreground">
                          Promotion:{" "}
                          <span className="font-bold text-green-600">
                            {selectedBooking.promotion.code || "Applied"}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          -฿{selectedBooking.promotion.discountValue || "0"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3">
                      <span className="text-lg font-bold text-foreground">
                        Total Amount:
                      </span>
                      <span className="text-3xl font-bold text-green-600">
                        ฿{selectedBooking.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Notes */}
                {selectedBooking.notes && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                    <Label className="text-xs text-amber-900 font-semibold uppercase tracking-wide block mb-2">
                      Booking Notes
                    </Label>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="bg-slate-50 -m-6 mt-6 px-6 py-4 rounded-b-lg border-t flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    setSelectedBooking(null);
                  }}
                  className="min-w-[120px]"
                >
                  {"Close"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Print functionality
                    }}
                    className="min-w-[120px]"
                  >
                    {"Print"}
                  </Button>
                  <Link href={`/dashboard/bookings/${selectedBooking.id}/edit`}>
                    <Button className="min-w-[140px]">
                      <Edit className="w-4 h-4 mr-2" />
                      {"Edit Booking"}
                    </Button>
                  </Link>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Status Update Dialog */}
      <Dialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateAction === "complete"
                ? "Mark Booking as Completed?"
                : "Cancel Booking?"}
            </DialogTitle>
            <DialogDescription>
              {updateAction === "complete"
                ? `Are you sure you want to mark booking ${bookingToUpdate?.bookingId} as completed? This action cannot be undone.`
                : `Are you sure you want to cancel booking ${bookingToUpdate?.bookingId}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeConfirmDialog()}
              disabled={isUpdating}
            >
              {"Cancel"}
            </Button>
            <Button
              variant={updateAction === "cancel" ? "destructive" : "default"}
              onClick={handleStatusUpdate}
              disabled={isUpdating}
            >
              {isUpdating
                ? "Updating..."
                : updateAction === "complete"
                  ? "Mark as Completed"
                  : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
