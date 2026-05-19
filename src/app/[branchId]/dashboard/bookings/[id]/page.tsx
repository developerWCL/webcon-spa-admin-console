"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useTransition, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  updateBooking,
  createBookingWithItems,
  getBookingById,
  type CreateBookingWithItemsPayload,
  type BookingItem,
} from "@/actions/booking.actions";
import {
  bookingSchema,
  type BookingFormData,
} from "../../../../../schemas/booking.schema";
import { useBookingPage } from "../useBookingPage";
import { ServiceSelectionCard } from "../components/ServiceSelectionCard";
import { PackageServicesCard } from "../components/PackageServicesCard";
import { BookingDetailsCard } from "../components/BookingDetailsCard";
import { PaymentSummaryCard } from "../components/PaymentSummaryCard";
import { getNextServiceId } from "../../../../../utils/utils";
import { toast } from "sonner";

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = Array.isArray(params.branchId)
    ? params.branchId[0]
    : (params.branchId as string);
  const bookingId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);
  const isCreating = bookingId === "new";
  const [isPending, startTransition] = useTransition();

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
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Initialize form with React Hook Form
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingId: "",
      customer: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialRequests: "",
      },
      bookingItems: [],
      totalPrice: 0,
      payments: [],
    },
  });

  // Use custom hook for page state management
  const pageState = useBookingPage({ branchId, isCreating });

  // Get field array for package services
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bookingItems",
  });

  // Load booking data when in edit mode
  useEffect(() => {
    if (!isCreating && bookingId) {
      setIsLoadingBooking(true);
      setBookingError(null);

      getBookingById(bookingId)
        .then((response) => {
          if (response.success && response.data) {
            // Apply the transformed booking data to the form with proper options
            form.reset(response.data, {
              keepDefaultValues: false,
              keepValues: false,
              keepDirty: false,
              keepTouched: false,
              keepIsSubmitted: false,
            });

            // Restore payments if they exist in the response
            if (response.data.payments && response.data.payments.length > 0) {
              pageState.setPayments(response.data.payments);

              // In edit mode, clear the payment form fields
              pageState.setMethod(undefined);
              pageState.setPaymentStatus("pending");
              pageState.setTempPaymentAmount(0);
            }

            // Restore applied promotion/coupon if it exists
            if (response.data.appliedPromotion) {
              pageState.setAppliedCoupon(response.data.appliedPromotion);
              pageState.setAppliedDiscount(
                response.data.appliedPromotion.discountAmount || 0,
              );
            }

            // Verify form values after reset
            setTimeout(() => {
              const formData = form.getValues();
            }, 100);

            // Clear loading state
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
  }, [isCreating, bookingId]);

  // Get current values
  const totalPrice = form.watch("totalPrice");
  const bookingItems = form.watch("bookingItems");

  // Recalculate total price when numberOfGuests changes (only in CREATE mode)
  // In EDIT mode, keep the totalPrice from the API to avoid race conditions
  useEffect(() => {
    // Skip recalculation in edit mode - race condition with service loading
    if (!isCreating) {
      return;
    }

    const calculateTotalPrice = () => {
      const dataSource = pageState.getCurrentServiceList();
      let newTotal = 0;

      bookingItems.forEach((item) => {
        const service = dataSource.find(
          (s) => String(s.id) === String(item.service),
        );
        if (service) {
          const numberOfGuests = item.numberOfGuests || 1;
          newTotal += Number(service.price || 0) * numberOfGuests;
        }
      });

      form.setValue("totalPrice", newTotal);
    };

    if (bookingItems.length > 0) {
      calculateTotalPrice();
    }
  }, [
    isCreating,
    bookingItems
      .map((item) => `${item.service}-${item.numberOfGuests}`)
      .join(","),
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const onSubmit = async (data: BookingFormData) => {
    startTransition(async () => {
      try {
        let result;

        if (isCreating) {
          // Validate that all booking items have date and time
          const hasInvalidItems = data.bookingItems.some(
            (item) => !item.date || !item.time,
          );

          if (hasInvalidItems) {
            console.error("Please fill in date and time for all booking items");
            // TODO: Show error toast/notification
            return;
          }

          // Transform form data to CreateBookingWithItemsPayload format
          const originalAmount = data.totalPrice || 0;
          const discountAmount = pageState.appliedDiscount || 0;
          const finalAmount = originalAmount - discountAmount;

          const bookingPayload: CreateBookingWithItemsPayload = {
            branchId,
            bookingTime: new Date(),
            amount: String(originalAmount),
            discountAmount: String(discountAmount),
            totalAmount: String(finalAmount),
            itemsCount: data.bookingItems.length,
            duration: data.bookingItems[0]?.duration
              ? parseInt(String(data.bookingItems[0].duration))
              : 0,
            ...(pageState.appliedCoupon?.id && {
              promotionId: String(pageState.appliedCoupon.id),
            }),
            ...(pageState.payments.length > 0 && {
              payments: pageState.payments,
            }),
          };

          // Transform booking items
          const getBookingItemType = (
            tab: string,
          ): "sub_service" | "package" | "programme" => {
            const typeMap: Record<
              string,
              "sub_service" | "package" | "programme"
            > = {
              treatments: "sub_service",
              packages: "package",
              programmes: "programme",
            };
            return typeMap[tab] || "sub_service";
          };

          const bookingItems: BookingItem[] = data.bookingItems.map(
            (bookingItem) => {
              const itemType = getBookingItemType(pageState.selectedTab);
              // Look up the service to get the correct price
              const dataSource = pageState.getCurrentServiceList();
              const service = dataSource.find(
                (s) => String(s.id) === String(bookingItem.service),
              );
              const servicePrice = Number(service?.price || 0);

              const numberOfGuests = bookingItem.numberOfGuests || 1;
              const baseItem: BookingItem = {
                itemType,
                quantity: numberOfGuests,
                duration: parseInt(String(bookingItem.duration)) || 0,
                price: String(servicePrice),
                subtotal: String(servicePrice * numberOfGuests),
                scheduledDate: bookingItem.date,
                scheduledTime: bookingItem.time,
                notes: data.customer.specialRequests,
                staffId: bookingItem.therapist || "",
                roomId: bookingItem.room || "",
                bedId: bookingItem.bed || "",
                guestData: (bookingItem.guests || []).map((g) => ({
                  ...g,
                  specialRequest: g.specialRequest ?? undefined,
                })),
              };

              // Map service ID to the appropriate field based on itemType
              if (itemType === "sub_service") {
                baseItem.subServiceId = String(bookingItem.service);
              } else if (itemType === "package") {
                baseItem.packageId = String(bookingItem.service);
              } else if (itemType === "programme") {
                baseItem.programmeId = String(bookingItem.service);
              }

              return baseItem;
            },
          );

          result = await createBookingWithItems(bookingPayload, bookingItems);
        } else {
          // Transform form data for update
          const updateData = {
            status: data.status,
            totalPrice: data.totalPrice,
            notes: data.customer.specialRequests,
            discountAmount: pageState.appliedDiscount,
            appliedPromotion: pageState.appliedCoupon,
            payments: pageState.payments,
            bookingItems: data.bookingItems.map((item) => ({
              ...item,
              bookingItemId: item.id,
            })),
          };
          result = await updateBooking(params.id as string, updateData);
        }

        if (result.success) {
          // Redirect to bookings list
          router.push(`/${branchId}/dashboard/bookings`);
        } else {
          console.error("Failed to save booking:", result.error);
          toast.error(result.error || "Failed to save booking");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to save booking",
        );
      }
    });
  };

  const handleAddService = () => {
    try {
      if (!pageState.selectedServiceId) {
        return;
      }

      const dataSource = pageState.getCurrentServiceList();
      const selectedService = dataSource.find(
        (s) => String(s.id) === String(pageState.selectedServiceId),
      );
      if (!selectedService) {
        console.error(
          "Selected service not found in data source",
          pageState.selectedServiceId,
        );
        return;
      }

      const newServiceId = getNextServiceId(fields);

      // Map tab name to booking item type
      const getBookingItemType = (
        tab: string,
      ): "sub_service" | "package" | "programme" => {
        const typeMap: Record<string, "sub_service" | "package" | "programme"> =
          {
            treatments: "sub_service",
            packages: "package",
            programmes: "programme",
          };
        return typeMap[tab] || "sub_service";
      };

      const newService = {
        service: String(selectedService.id),
        serviceId:
          String(selectedService.serviceId) || String(selectedService.id),
        type: getBookingItemType(pageState.selectedTab),
        name:
          getBookingItemType(pageState.selectedTab) === "sub_service"
            ? `${selectedService.service?.name} - ${selectedService.name}`
            : selectedService.name,
        therapist: "",
        room: "",
        date: "",
        time: "",
        duration: selectedService.duration
          ? parseInt(String(selectedService.duration))
          : undefined,
        numberOfGuests: 1,
        guests: [
          {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            specialRequest: "",
          },
        ],
      };

      append(newService);

      // Update total price after appending service (multiply by number of guests)
      const currentTotal = form.getValues("totalPrice") || 0;
      const numberOfGuests = 1;
      const newTotal =
        Number(currentTotal) +
        Number(selectedService.price || 0) * numberOfGuests;
      form.setValue("totalPrice", newTotal);

      pageState.setSelectedServiceId("");
    } catch (error) {
      console.error("Error in handleAddService:", error);
    }
  };

  const handleMethodChange = (
    newMethod: "on_arrival" | "bank_transfer" | "paypal" | "credit_card",
  ) => {
    pageState.setMethod(newMethod);
  };

  const handlePaymentStatusChange = (
    newStatus: "pending" | "paid" | "failed" | "refunded",
  ) => {
    pageState.setPaymentStatus(newStatus);
  };

  const handleApplyCoupon = () => {
    // Get the first service date from booking items for validation
    const bookingItems = form.getValues("bookingItems");

    const firstServiceDate = bookingItems?.[0]?.date
      ? new Date(bookingItems[0].date)
      : undefined;

    pageState.applyCoupon(bookingItems, totalPrice, firstServiceDate);
  };

  const handleRemoveCoupon = () => {
    pageState.removeCoupon();
  };

  const handleRemoveService = (index: number) => {
    try {
      const serviceToRemove = fields[index];
      if (serviceToRemove) {
        // Find the service in the data source to get its price
        const dataSource = pageState.getCurrentServiceList();
        const removedService = dataSource.find(
          (s) => String(s.id) === String(serviceToRemove.service),
        );

        if (removedService) {
          // Decrease total price (multiply by number of guests)
          const currentTotal = form.getValues("totalPrice") || 0;
          const numberOfGuests = serviceToRemove.numberOfGuests || 1;
          const newTotal =
            Number(currentTotal) -
            Number(removedService.price || 0) * numberOfGuests;
          form.setValue("totalPrice", Math.max(0, newTotal)); // Ensure price doesn't go negative
        }
      }

      // Remove the service from the field array
      remove(index);
    } catch (error) {
      console.error("Error in handleRemoveService:", error);
    }
  };

  const handleAddPayment = (payment: any) => {
    pageState.addPayment(payment);
    form.setValue("payments", [...pageState.payments, payment]);
  };

  const handleRemovePayment = (paymentId: string) => {
    pageState.removePayment(paymentId);
    const updatedPayments = form.getValues("payments") || [];
    form.setValue(
      "payments",
      updatedPayments.filter((p) => p.id !== paymentId),
    );
  };

  const handleUpdatePayment = (updatedPayment: any) => {
    pageState.updatePayment(updatedPayment);
    const currentPayments = form.getValues("payments") || [];
    const updatedPayments = currentPayments.map((p) =>
      p.id === updatedPayment.id ? updatedPayment : p,
    );
    form.setValue("payments", updatedPayments);
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

      {/* Form content */}
      {!isLoadingBooking && !bookingError && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    {isCreating ? "Create Booking" : "Edit Booking"}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {!isCreating && (
                      <>
                        {form.watch("bookingId")}
                        {form.watch("customer.firstName") && (
                          <>
                            {" • "}
                            {form.watch("customer.firstName")}{" "}
                            {form.watch("customer.lastName")}
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/${branchId}/dashboard/bookings`}>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancel Changes
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : isCreating
                      ? "Create Booking"
                      : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Service Selection  */}
                {isCreating && (
                  <ServiceSelectionCard
                    selectedTab={pageState.selectedTab}
                    onTabChange={pageState.setSelectedTab}
                    selectedServiceId={pageState.selectedServiceId}
                    onServiceSelect={pageState.setSelectedServiceId}
                    onAddService={handleAddService}
                    treatments={pageState.treatments}
                    packages={pageState.packages}
                    programmes={pageState.programmes}
                    isLoading={pageState.isLoadingServices}
                    serviceSearchOpen={pageState.serviceSearchOpen}
                    onServiceSearchOpenChange={pageState.setServiceSearchOpen}
                  />
                )}

                {/* Booking Status - Only show for single service bookings in edit mode */}
                {/* {!isCreating && bookingType !== "package" && (
                  <BookingStatusCard form={form} />
                )} */}

                {/* Package Services Status (in create and edit mode) */}
                <PackageServicesCard
                  form={form}
                  isCreating={isCreating}
                  fields={fields}
                  remove={handleRemoveService}
                />

                {/* Booking Details */}
                <BookingDetailsCard form={form} isCreating={isCreating} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Payment Summary */}
                <PaymentSummaryCard
                  subtotal={Number(totalPrice)}
                  appliedDiscount={pageState.appliedDiscount}
                  appliedCoupon={pageState.appliedCoupon}
                  couponCode={pageState.couponCode}
                  onCouponCodeChange={pageState.setCouponCode}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                  availableCoupons={pageState.getFilteredPromotions(
                    bookingItems,
                  )}
                  onAddPaymentClick={() =>
                    pageState.openPaymentDialog("deposit")
                  }
                  method={pageState.method}
                  onMethodChange={handleMethodChange}
                  paymentStatus={pageState.paymentStatus}
                  onPaymentStatusChange={handlePaymentStatusChange}
                  methodError={undefined}
                  statusError={undefined}
                  couponError={pageState.couponError}
                  payments={pageState.payments}
                  onPaymentAdded={handleAddPayment}
                  onPaymentRemoved={handleRemovePayment}
                  onPaymentUpdated={handleUpdatePayment}
                  tempPaymentAmount={pageState.tempPaymentAmount}
                  onTempPaymentAmountChange={pageState.setTempPaymentAmount}
                  isCreating={isCreating}
                  transactionId={
                    pageState.payments?.[0]?.paypalCaptureId ||
                    pageState.payments?.[0]?.paypalOrderId
                  }
                />

                {/* Payment History - Only show in edit mode */}
                {/* {!isCreating && (
                  <PaymentHistoryCard paymentHistory={paymentHistory} />
                )} */}
              </div>
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
