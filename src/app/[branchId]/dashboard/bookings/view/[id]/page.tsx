"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookingById } from "@/actions/booking.actions";
import { useBookingPage } from "../../useBookingPage";
import { toast } from "sonner";
import { printBooking, type PrintBookingData } from "@/utils/print-booking";
import { formatNumberWithComma } from "@/utils/utils";
import { useSession } from "next-auth/react";

interface BookingDetail {
  bookingId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  branch?: {
    name: string;
    phone: string;
    email: string;
  };
  bookingItems: Array<{
    id: string;
    service: string;
    type: "sub_service" | "package" | "programme";
    price: number;
    name: string;
    therapist: string;
    room: string;
    date: string;
    time: string;
    duration?: number;
    numberOfGuests: number;
    guests?: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialRequest: string;
    }>;
  }>;
  totalPrice: number;
  status?: string;
  payments?: Array<{
    id: string;
    amount: string;
    method: string;
    status: string;
    date?: string;
    transactionId?: string;
    paypalCaptureId?: string;
  }>;
  appliedPromotion?: {
    id: string;
    code: string;
    discountAmount: number;
  };
}

export default function ViewBookingPage() {
  const params = useParams();
  const branchId = Array.isArray(params.branchId)
    ? params.branchId[0]
    : (params.branchId as string);
  const bookingId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  // Validate that branchId is available
  if (!branchId || branchId === "[branchId]") {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Error: Branch ID not found in route parameters
        </p>
      </div>
    );
  }

  // State for loading and error handling
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingDetail | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const { data: session } = useSession();
  // Load booking data
  useEffect(() => {
    if (bookingId) {
      setIsLoadingBooking(true);
      setBookingError(null);

      getBookingById(bookingId)
        .then((response) => {
          if (response.success && response.data) {
            setBookingData(response.data);

            // Calculate applied discount if promotion exists
            if (response.data.appliedPromotion) {
              setAppliedDiscount(
                Number(response.data.appliedPromotion.discountAmount) || 0,
              );
            }

            setIsLoadingBooking(false);
          } else {
            setBookingError(response.error || "Failed to load booking");
            setIsLoadingBooking(false);
          }
        })
        .catch((error) => {
          setBookingError(
            error instanceof Error ? error.message : "Failed to load booking",
          );
          setIsLoadingBooking(false);
        });
    }
  }, [bookingId]);

  const pageState = useBookingPage({ branchId, isCreating: false });

  const handlePrintBooking = () => {
    if (!bookingData) return;

    const services = (bookingData.bookingItems || []).map((item) => ({
      name: item.name || item.service || "Unknown Service",
      price: formatNumberWithComma(Number(item.price || 0)), // Using duration as fallback, adjust if you have actual price
    }));

    const guestCount =
      (bookingData.bookingItems || []).reduce(
        (sum, item) => sum + (item.numberOfGuests || 0),
        0,
      ) || 1;

    const firstItem = bookingData.bookingItems?.[0];
    const bookingDate = firstItem?.date
      ? new Date(firstItem.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Not set";

    const formattedTime = firstItem?.time || "Not set";

    const printData: PrintBookingData = {
      bookingId: bookingData.bookingId,
      bookingDate: `${bookingDate} at ${formattedTime}`,
      customerName: bookingData.customer
        ? `${bookingData.customer.firstName} ${bookingData.customer.lastName}`
        : `${bookingData.bookingItems[0].guests?.[0].firstName} ${bookingData.bookingItems[0].guests?.[0].lastName}`,
      customerEmail: bookingData.customer
        ? bookingData.customer.email
        : bookingData.bookingItems?.[0]?.guests?.[0]?.email,
      customerPhone: bookingData.customer
        ? bookingData.customer.phone
        : bookingData.bookingItems?.[0]?.guests?.[0]?.phone,
      guestCount,
      services,
      totalAmount: formatNumberWithComma(Number(bookingData.totalPrice || 0)),
      discountAmount:
        appliedDiscount > 0
          ? formatNumberWithComma(appliedDiscount)
          : undefined,
      currency: "฿",
      specialRequest: bookingData.customer.specialRequests,
      promotionName: bookingData.appliedPromotion?.code,
      promotionCode: bookingData.appliedPromotion?.code,
      paymentMethod: bookingData.payments?.[0]?.method || "Not specified",
      captureId: bookingData.payments?.[0]?.paypalCaptureId || undefined,
      spaLogo: session?.metadata?.logo_url,
      primaryColor: session?.metadata?.primary_color || "#245743",
      branchName: bookingData.branch?.name,
      branchPhone: bookingData.branch?.phone,
      branchEmail: bookingData.branch?.email,
    };

    printBooking(printData);
  };

  return (
    <>
      {/* Error message for booking not found */}
      {bookingError && (
        <div className="p-8 text-center">
          <p className="text-red-500">{bookingError}</p>
          <Link href={`/${branchId}/dashboard/bookings`}>
            <Button className="mt-4">Back to Bookings</Button>
          </Link>
        </div>
      )}

      {/* Loading state */}
      {isLoadingBooking && !bookingError && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading booking...</p>
        </div>
      )}

      {/* View content */}
      {!isLoadingBooking && !bookingError && bookingData && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${branchId}/dashboard/bookings`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Booking Details
                </h1>
                <p className="text-muted-foreground mt-1">
                  <span>{bookingData.bookingId}</span>
                  {bookingData.customer.firstName && (
                    <>
                      {" • "}
                      {bookingData.customer.firstName}{" "}
                      {bookingData.customer.lastName}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrintBooking}>
                <Printer className="h-4 w-4 mr-2" />
                Print Booking
              </Button>
              <Link href={`/${branchId}/dashboard/bookings/${bookingId}`}>
                <Button>Edit Booking</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Items */}
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Services</h2>
                <div className="space-y-4">
                  {bookingData.bookingItems &&
                  bookingData.bookingItems.length > 0 ? (
                    bookingData.bookingItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.type}
                            </p>
                          </div>
                          {item.duration && (
                            <span className="text-sm bg-secondary px-2 py-1 rounded">
                              {item.duration} mins
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">
                              {item.date
                                ? new Date(item.date).toLocaleDateString()
                                : "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Time</p>
                            <p className="font-medium">
                              {item.time || "Not set"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {item.therapist && (
                            <div>
                              <p className="text-muted-foreground">Therapist</p>
                              <p className="font-medium">{item.therapist}</p>
                            </div>
                          )}
                          {item.room && (
                            <div>
                              <p className="text-muted-foreground">Room</p>
                              <p className="font-medium">{item.room}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-sm">
                          <p className="text-muted-foreground">Guests</p>
                          <p className="font-medium">{item.numberOfGuests}</p>
                        </div>

                        {item.guests && item.guests.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-2">
                              Guest Details
                            </p>
                            {item.guests.map((guest, guestIndex) => (
                              <div
                                key={guestIndex}
                                className="text-sm text-muted-foreground space-y-1"
                              >
                                <p>
                                  {guest.firstName} {guest.lastName}
                                </p>
                                {guest.email && <p>Email: {guest.email}</p>}
                                {guest.phone && <p>Phone: {guest.phone}</p>}
                                {guest.specialRequest && (
                                  <p>Request: {guest.specialRequest}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No services added</p>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Customer Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">
                      {bookingData.customer.firstName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">
                      {bookingData.customer.lastName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {bookingData.customer.email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {bookingData.customer.phone || "-"}
                    </p>
                  </div>
                </div>

                {bookingData.customer.specialRequests && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Special Requests
                    </p>
                    <p className="font-medium">
                      {bookingData.customer.specialRequests}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      ฿{Number(bookingData.totalPrice)?.toFixed(2)}
                    </span>
                  </div>

                  {appliedDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className="font-medium">
                          ฿-{(appliedDiscount || 0).toFixed(2)}
                        </span>
                      </div>
                      {bookingData.appliedPromotion && (
                        <div className="text-sm text-muted-foreground">
                          Code: {bookingData.appliedPromotion.code}
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-3 border-t flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      ฿
                      {(
                        Number(bookingData.totalPrice) - (appliedDiscount || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {bookingData.payments && bookingData.payments.length > 0 && (
                <div className="border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Payment History
                  </h2>
                  <div className="space-y-3">
                    {bookingData.payments.map((payment) => (
                      <div key={payment.id} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{payment.method}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.status}
                            </p>
                          </div>
                          <span className="font-semibold">
                            ฿{Number(payment.amount).toFixed(2)}
                          </span>
                        </div>
                        {payment.date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                        )}
                        {payment.transactionId && (
                          <p className="text-xs text-muted-foreground break-all">
                            ID: {payment.transactionId}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Status */}
              {bookingData.status && (
                <div className="border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Status</h2>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {bookingData.status}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
